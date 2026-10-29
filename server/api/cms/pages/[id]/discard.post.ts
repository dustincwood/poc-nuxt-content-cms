// Throws the draft's changes away: back to the published version (and its path)
export default defineEventHandler((event) => {
  const page = cmsGetPage(getRouterParam(event, 'id')!)
  if (!page) throw createError({ statusCode: 404, statusMessage: 'No such page' })
  if (!page.published) throw createError({ statusCode: 400, statusMessage: 'This page has never been published' })
  const other = page.publishedPath ? cmsGetPageByPath(page.publishedPath) : null
  const path = page.publishedPath && (!other || other.id === page.id) ? page.publishedPath : undefined
  const saved = cmsSaveDraft(page.id, page.published, path)!
  return { ...saved, status: cmsPageStatus(saved) }
})
