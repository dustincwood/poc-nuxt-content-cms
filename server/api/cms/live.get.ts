// The published page at ?path=, parsed for ContentRenderer (pages/[...slug].vue)
export default defineEventHandler(async (event) => {
  const path = cmsNormalizePath(String(getQuery(event).path ?? ''))
  const page = path && await cmsLivePage(path)
  if (!page) throw createError({ statusCode: 404, statusMessage: `No published page at ${getQuery(event).path}` })
  return page
})
