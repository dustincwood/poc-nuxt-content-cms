// Published pages, served from the CMS database at request time, so a publish is live at once with no
// rebuild (Nuxt Content only reads content/ when the site is built). The page's published JSON goes
// through the same markdown and MDC parse as content/<path>/index.md and the editor's preview.
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

// Parsed pages by path, kept while the page's publish time stays the same: a new publish changes it, so
// the next request parses the new version. Several server instances sharing a database stay correct too.
const parsed = new Map<string, { publishedAt: string, page: Promise<CmsLivePage> }>()

async function parse(path: string, doc: CmsPageDoc): Promise<CmsLivePage> {
  const { data, body } = await parseMarkdown(cmsPageToMarkdown(doc))
  return { ...cmsPageFrontmatter(doc), ...data, title: doc.title, path, body }
}

export async function cmsLivePage(path: string) {
  const record = cmsGetPublishedAt(path)
  if (!record?.published || !record.publishedAt) {
    parsed.delete(path)
    return null
  }
  let entry = parsed.get(path)
  if (entry?.publishedAt !== record.publishedAt) {
    const fresh = { publishedAt: record.publishedAt, page: parse(path, record.published) }
    parsed.set(path, fresh)
    // A failed parse isn't kept (unless a newer publish has replaced it already): the next request retries
    fresh.page.catch(() => { if (parsed.get(path) === fresh) parsed.delete(path) })
    entry = fresh
  }
  return entry.page
}

// What each path's live page sets for the site header and top nav (null where nothing is published)
export function cmsLiveChrome(paths: string[]) {
  return paths.map((path) => {
    const doc = cmsGetPublishedAt(path)?.published
    return doc ? { path, header: doc.header, top_nav: doc.top_nav } : null
  })
}
