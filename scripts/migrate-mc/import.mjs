// Migrated pages (out/**/*.story.json from migrate.mjs) -> CMS pages, saved as drafts in .data/cms.sqlite.
// Publish them from /admin afterwards (or "Publish all changes" there).
//
// The story files keep the block tree migrate.mjs builds (Storyblok's shape, which the CMS's page JSON
// follows); this converts what differs: rich text documents -> markdown, multilinks -> a URL plus
// <field>_target, assets -> a URL plus <field>_alt. usu.edu links to pages being imported become site paths.
//
// Usage: node scripts/migrate-mc/import.mjs [--out <dir>] [--nav]
//   --out  The migrate.mjs output folder (default: scripts/migrate-mc/out). A story's folder under it is
//          its path: out/advising/conference/conference.story.json -> /advising/conference.
//   --nav  Also fetch each folder start page's top nav from its published usu.edu page (navs.json).
// Site header names come from out/<site>/headers.json when present.
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { parse } from 'ultrahtml'
import { navBlocks, publishedMenu } from './nav.mjs'
import { cmsCreatePage, cmsGetPageByPath, cmsSaveDraft } from '../../server/utils/cms-db.ts'

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const args = process.argv.slice(2)
const outDir = path.resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(here, 'out'))
const withNav = args.includes('--nav')

const USU = 'https://www.usu.edu'

// ---------- Which pages, at which paths ----------

const storyFiles = []
;(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.story.json')) storyFiles.push(p)
  }
})(outDir)

const pathOf = file => '/' + path.relative(outDir, path.dirname(file)).split(path.sep).filter(Boolean).join('/').toLowerCase()
const paths = new Set(storyFiles.map(pathOf))

// Storyblok full slugs in headers.json/navs.json: <prefix folder>/advising/exploratory/ -> /advising/exploratory
function pathOfSlug(slug) {
  const parts = slug.split('/').filter(Boolean)
  for (let i = 0; i < parts.length; i++) {
    const p = '/' + parts.slice(i).join('/')
    if (paths.has(p)) return p
  }
  return undefined
}

// A usu.edu address of a page being imported -> its path here (keeping the #anchor); anything else unchanged
function siteHref(href) {
  if (!href) return ''
  let url
  try { url = new URL(href, USU) }
  catch { return href }
  if (url.origin !== USU || !/^https?:/.test(href) && !href.startsWith('/')) return href
  const p = url.pathname.replace(/\/index\.php$/, '/').replace(/\.php$/, '').replace(/\/$/, '') || '/'
  return paths.has(p) ? p + url.hash : href
}

// ---------- Field values ----------

function multilinkHref(link) {
  if (!link) return ''
  if (link.linktype === 'email') return link.email ? `mailto:${link.email}` : ''
  let href = link.url || link.cached_url || ''
  if (link.linktype === 'story') href = '/' + (link.story?.full_slug ?? link.cached_url ?? '').replace(/^\/+/, '')
  if (href && link.anchor) href += `#${link.anchor}`
  return siteHref(href)
}

const isDoc = v => v && typeof v === 'object' && v.type === 'doc'
const isLink = v => v && typeof v === 'object' && (v.fieldtype === 'multilink' || 'linktype' in v)
const isAsset = v => v && typeof v === 'object' && (v.fieldtype === 'asset' || ('filename' in v && !('component' in v)))

// Fields renamed here: Vue reserves `style` for inline CSS, so it can't be a component prop
const renamed = { 'moca-text': { style: 'text_style' }, 'moca-quote': { style: 'quote_style' } }

function convertBlock(b) {
  const out = { _uid: b._uid ?? randomUUID(), component: b.component }
  for (const [field, value] of Object.entries(b)) {
    const key = renamed[b.component]?.[field] ?? field
    if (key === '_uid' || key === 'component' || key === '_editable') continue
    if (isDoc(value)) out[key] = richtextToMarkdown(value)
    else if (isLink(value)) {
      out[key] = multilinkHref(value)
      if (value.target) out[`${key}_target`] = value.target
    }
    else if (isAsset(value)) {
      out[key] = value.filename ?? ''
      if (value.alt) out[`${key}_alt`] = value.alt
    }
    else if (Array.isArray(value)) out[key] = value.map(convertBlock)
    else out[key] = value
  }
  return out
}

// ---------- Rich text (ProseMirror JSON) -> markdown ----------

// Characters markdown (or MDC's inline syntax) would read as formatting
const escapeText = s => s.replace(/([\\`*_[\]<>|])/g, '\\$1')

function linkHref(attrs) {
  if (attrs.linktype === 'email') return attrs.href?.startsWith('mailto:') ? attrs.href : `mailto:${attrs.href ?? ''}`
  let href = attrs.href ?? ''
  if (attrs.anchor) href += `#${attrs.anchor}`
  return siteHref(href)
}

function inline(nodes = []) {
  // Neighbouring text with the same marks is one run, so "**a****b**" never happens
  const runs = []
  for (const n of nodes) {
    if (n.type === 'hard_break') { runs.push({ br: true }); continue }
    if (n.type === 'image') { runs.push({ raw: `![${escapeText(n.attrs?.alt ?? '')}](${n.attrs?.src ?? ''})` }); continue }
    if (n.type !== 'text') continue
    const marks = (n.marks ?? []).filter(m => ['bold', 'italic', 'underline', 'link'].includes(m.type))
    const key = JSON.stringify(marks)
    const last = runs.at(-1)
    if (last && last.key === key) last.text += n.text
    else runs.push({ key, marks, text: n.text })
  }
  return runs.map((r) => {
    // MDC reads a backslash line ending as text, not a line break
    if (r.br) return '<br>\n'
    if (r.raw) return r.raw
    // Emphasis can't start or end with a space: keep the spaces outside the markers
    const [, lead, core, trail] = r.text.match(/^(\s*)([\s\S]*?)(\s*)$/)
    if (!core) return r.text
    let s = escapeText(core)
    const has = t => r.marks.find(m => m.type === t)
    if (has('italic')) s = `*${s}*`
    if (has('bold')) s = `**${s}**`
    if (has('underline')) s = `<u>${s}</u>`
    const link = has('link')
    if (link) s = `[${s}](${linkHref(link.attrs ?? {})})${link.attrs?.target === '_blank' ? '{target="_blank"}' : ''}`
    return lead + s + trail
  }).join('')
}

const indentRest = (text, pad) => text.split('\n').map((l, i) => (i && l ? pad + l : l)).join('\n')

function block(n) {
  switch (n.type) {
    case 'paragraph': return inline(n.content)
    case 'heading': return `${'#'.repeat(n.attrs?.level ?? 2)} ${inline(n.content)}`
    case 'horizontal_rule': return '***'
    case 'blockquote': return blocks(n.content).split('\n').map(l => `> ${l}`).join('\n')
    case 'image': return inline([n])
    case 'bullet_list':
    case 'ordered_list': {
      let num = n.attrs?.order ?? 1
      return (n.content ?? []).map((item) => {
        const marker = n.type === 'bullet_list' ? '- ' : `${num++}. `
        // An item's paragraphs and nested lists, tight (no blank lines), continued under the marker
        const body = (item.content ?? []).map(block).join('\n')
        return marker + indentRest(body, ' '.repeat(marker.length))
      }).join('\n')
    }
    case 'table': return table(n)
    default: return n.content ? blocks(n.content) : ''
  }
}

function blocks(nodes = []) {
  return nodes.map(block).filter(s => s.trim()).join('\n\n')
}

// GFM table: the first row is the header. A cell's paragraphs and list items become lines (<br>).
function table(n) {
  const cell = c => (c.content ?? []).flatMap(b => b.type === 'bullet_list' || b.type === 'ordered_list'
    ? (b.content ?? []).map(li => `• ${(li.content ?? []).map(p => inline(p.content)).join(' ')}`)
    : [inline(b.content)]).filter(Boolean).join('<br>').replace(/\n/g, '')
  const rows = (n.content ?? []).map(r => (r.content ?? []).map(cell))
  if (!rows.length) return ''
  const width = Math.max(...rows.map(r => r.length))
  const line = r => `| ${Array.from({ length: width }, (_, i) => r[i] ?? '').join(' | ')} |`
  return [line(rows[0]), `|${' --- |'.repeat(width)}`, ...rows.slice(1).map(line)].join('\n')
}

function richtextToMarkdown(doc) {
  return blocks(doc.content)
}

// ---------- Header and nav ----------

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch { return [] }
}
const siteDirs = fs.readdirSync(outDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => path.join(outDir, e.name))
const headers = new Map(siteDirs.flatMap(d => readJson(path.join(d, 'headers.json'))).map(h => [pathOfSlug(h.story), h]))
const navs = new Map(siteDirs.flatMap(d => readJson(path.join(d, 'navs.json'))).map(n => [pathOfSlug(n.story), n.published]))

function headerFor(p) {
  const h = headers.get(p)
  if (!h) return undefined
  return {
    site_name: h.site ?? '',
    // Empty: the page that sets the name
    site_link: '',
    parent_name: h.parent ?? '',
    parent_link: (h.parentStory && pathOfSlug(h.parentStory)) || '',
  }
}

// The published menu's links as nav blocks (the importer's own field shapes: link is a URL string)
async function navFor(p) {
  const published = navs.get(p)
  if (!withNav || !published) return undefined
  const html = await (await fetch(published)).text()
  const blocks = navBlocks(publishedMenu(parse(html)), href => ({ linktype: 'url', url: new URL(href, published).href }))
  return blocks.map(convertBlock)
}

// ---------- Import ----------

let created = 0, updated = 0
for (const file of storyFiles.sort()) {
  const { story } = JSON.parse(fs.readFileSync(file, 'utf8'))
  const p = pathOf(file)
  const content = story.content ?? {}
  const draft = {
    title: story.name ?? p,
    body: (content.body ?? []).map(convertBlock),
    top_nav: (await navFor(p)) ?? [],
  }
  const header = headerFor(p)
  if (header) draft.header = header

  const existing = cmsGetPageByPath(p)
  if (existing) {
    // Keep a nav set in the editor when this run didn't fetch one
    if (!withNav && existing.draft.top_nav?.length) draft.top_nav = existing.draft.top_nav
    cmsSaveDraft(existing.id, draft)
    updated++
  }
  else {
    cmsCreatePage(p, draft)
    created++
  }
  console.log(`${existing ? 'Updated' : 'Created'} ${p}  (${story.name})`)
}
// A site root, so / isn't a 404: links to the imported sites' top pages (only when there's none yet)
if (!cmsGetPageByPath('/')) {
  const tops = [...paths].filter(p => p.split('/').length === 2).sort()
  cmsCreatePage('/', {
    title: 'Home',
    top_nav: [],
    body: [{
      _uid: randomUUID(),
      component: 'moca-container',
      margin_y: '5',
      content: [
        { _uid: randomUUID(), component: 'moca-heading', text: 'Migrated sites', level: 'h1' },
        { _uid: randomUUID(), component: 'moca-text', text: tops.map(p => `- [${p}](${p})`).join('\n') },
        { _uid: randomUUID(), component: 'moca-button', text: 'Edit pages', link: '/admin', type: 'btn-primary' },
      ],
    }],
  })
  created++
  console.log('Created /  (Home)')
}
console.log(`\n${created} created, ${updated} updated as drafts. Publish them at /admin.`)
