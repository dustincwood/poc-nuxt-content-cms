// Publishing: a page's draft JSON -> markdown in content/<path>/index.md (content/index.md for /), which
// Nuxt Content picks up. In development its watcher updates the site at once; a production build reads
// content/ when it's built, so published changes there need a rebuild (see README).
import { mkdir, readdir, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const contentDir = resolve('content')

export function cmsContentFile(path: string) {
  return join(contentDir, ...path.split('/').filter(Boolean), 'index.md')
}

export async function cmsWriteContent(path: string, markdown: string) {
  const file = cmsContentFile(path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, markdown, 'utf8')
}

// Removes a published file, and the folders it leaves empty up to content/
export async function cmsRemoveContent(path: string) {
  const file = cmsContentFile(path)
  await rm(file, { force: true })
  for (let dir = dirname(file); dir.startsWith(contentDir) && dir !== contentDir; dir = dirname(dir)) {
    if ((await readdir(dir).catch(() => ['?'])).length) break
    await rmdir(dir).catch(() => {})
  }
}

export async function cmsPublish(id: string) {
  const page = cmsGetPage(id)
  if (!page) throw createError({ statusCode: 404, statusMessage: 'No such page' })
  await cmsWriteContent(page.path, cmsPageToMarkdown(page.draft))
  // Renamed since the last publish: the old address stops serving it, unless another page has taken it since
  if (page.publishedPath && page.publishedPath !== page.path && !cmsGetPageByPath(page.publishedPath)) {
    await cmsRemoveContent(page.publishedPath)
  }
  return cmsMarkPublished(id, page.draft, page.path)!
}
