export default defineEventHandler((event) => {
  const page = cmsGetPage(getRouterParam(event, 'id')!)
  if (!page) throw createError({ statusCode: 404, statusMessage: 'No such page' })
  return { ...page, status: cmsPageStatus(page) }
})
