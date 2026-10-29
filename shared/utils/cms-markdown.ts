// Page JSON (CmsPageDoc) -> Nuxt Content markdown (MDC). Publish writes this to content/<path>/index.md and
// the editor's preview renders the same text, so what the preview shows is what publishing produces.
//
// Each block becomes a block component, its props as YAML and its markdown/blocks fields as named slots;
// children nest with one more colon per level, indented two spaces per level:
//
//   ::moca-card
//   ---
//   header: Advising
//   ---
//   #body
//   Rich **text**
//
//   #button
//     :::moca-button
//     ---
//     text: Learn more
//     link: /advising
//     ---
//     :::
//   ::
//
// The indent isn't cosmetic: MDC (remark-mdc 3.x) gives an unindented #slot line to the outermost open
// component, so a nested component's slots must sit at its own fence's indentation.
// MDC also reads numeric-looking prop values as numbers ("6" -> 6), so components coerce with String().
import { stringify } from 'yaml'

export interface CmsMarkdownOptions {
  // Adds each block's uid as a cmsuid attribute, so the preview can map clicks back to the tree
  uids?: boolean
}

const yaml = (value: unknown) => stringify(value, { lineWidth: 0 }).trimEnd()

// Values worth writing: empty strings and lists are the same as unset. false only matters where it
// overrides a true default (a form's honeypot).
function propValue(value: unknown, field?: CmsField) {
  if (value === undefined || value === null || value === '') return undefined
  if (value === false) return field?.default === true ? false : undefined
  return value
}

// The prop keys a field writes: links and images carry a companion (target, alt)
function propKeys(field: CmsField) {
  if (field.type === 'link') return [field.key, `${field.key}_target`]
  if (field.type === 'image') return [field.key, `${field.key}_alt`]
  return [field.key]
}

// Rich text inside a component: a line starting with "::" would close it, and "#word" would start a slot.
// MDC finds those before markdown escapes apply, so they become character references.
export function cmsEscapeSlotMarkdown(markdown: string) {
  return markdown.trim()
    .replace(/^(\s*):(?=:)/gm, '$1&#58;')
    .replace(/^(\s*)#(?=[\w-])/gm, '$1&#35;')
}

export function cmsBlockProps(block: CmsBlock, options: CmsMarkdownOptions = {}) {
  const def = cmsComponentMap[block.component]
  const props: Record<string, unknown> = {}
  if (def) {
    for (const field of def.fields) {
      if (cmsIsSlot(field)) continue
      for (const key of propKeys(field)) {
        const value = propValue(block[key], key === field.key ? field : undefined)
        if (value !== undefined) props[key] = value
      }
    }
  }
  else {
    // A component the registry doesn't know: keep its plain values rather than dropping them
    for (const [key, value] of Object.entries(block)) {
      if (key === '_uid' || key === 'component' || (typeof value === 'object' && value !== null)) continue
      const v = propValue(value)
      if (v !== undefined) props[key] = v
    }
  }
  // Not data-*: MDC camel-cases prop names, and Vue would write it back as a "datacmsuid" attribute
  if (options.uids) props.cmsuid = block._uid
  return props
}

export function cmsBlockToMarkdown(block: CmsBlock, depth = 0, options: CmsMarkdownOptions = {}): string {
  const fence = ':'.repeat(depth + 2)
  const indent = (text: string) => text.split('\n').map(l => l ? '  '.repeat(depth) + l : l).join('\n')
  const parts = [indent(`${fence}${block.component}`)]

  const props = cmsBlockProps(block, options)
  if (Object.keys(props).length) parts.push(indent(`---\n${yaml(props)}\n---`))

  for (const field of cmsComponentMap[block.component]?.fields ?? []) {
    if (field.type === 'markdown') {
      const text = typeof block[field.key] === 'string' ? cmsEscapeSlotMarkdown(block[field.key] as string) : ''
      // A blank line after it, so a closing table row or list item can't run on into the next line
      if (text) parts.push(indent(`#${field.key}\n${text}\n`))
    }
    else if (field.type === 'blocks') {
      const children = (block[field.key] as CmsBlock[] | undefined) ?? []
      if (children.length) parts.push(indent(`#${field.key}`), children.map(c => cmsBlockToMarkdown(c, depth + 1, options)).join('\n\n'))
    }
  }

  parts.push(indent(fence))
  return parts.join('\n')
}

// Top nav and header live in frontmatter as data. Nav blocks drop their uids (only the editor needs them).
function navData(blocks: CmsBlock[]): Record<string, unknown>[] {
  return blocks.map(({ _uid, component, ...fields }) => {
    const out: Record<string, unknown> = { component }
    for (const [key, value] of Object.entries(fields)) {
      if (Array.isArray(value)) out[key] = navData(value as CmsBlock[])
      else if (propValue(value) !== undefined) out[key] = value
    }
    return out
  })
}

export function cmsPageFrontmatter(page: CmsPageDoc) {
  const data: Record<string, unknown> = { title: page.title }
  if (page.description) data.description = page.description
  const header = Object.fromEntries(Object.entries(page.header ?? {}).filter(([, v]) => typeof v === 'string' && v.trim()))
  if (Object.keys(header).length) data.header = header
  if (page.top_nav?.length) data.top_nav = navData(page.top_nav)
  return data
}

export function cmsPageToMarkdown(page: CmsPageDoc, options: CmsMarkdownOptions = {}) {
  const body = page.body.map(b => cmsBlockToMarkdown(b, 0, options)).join('\n\n')
  return `---\n${yaml(cmsPageFrontmatter(page))}\n---\n\n${body}\n`
}
