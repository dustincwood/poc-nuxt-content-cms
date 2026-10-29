// Deletes the page and its published file
export default defineEventHandler(async (event) => {
  const page = cmsGetPage(getRouterParam(event, 'id')!)
  if (!page) throw createError({ statusCode: 404, statusMessage: 'No such page' })
  cmsDeletePage(page.id)
  if (page.publishedPath && !cmsGetPageByPath(page.publishedPath)) await cmsRemoveContent(page.publishedPath)
  return { ok: true }
})
