// A new, unpublished page: { path, title }
export default defineEventHandler(async (event) => {
  const body = await readBody<{ path?: string, title?: string }>(event)
  const path = cmsNormalizePath(body?.path ?? '')
  if (!path) throw createError({ statusCode: 400, statusMessage: 'The path may only use letters, digits, - and _ between slashes' })
  if (cmsGetPageByPath(path)) throw createError({ statusCode: 409, statusMessage: `A page already exists at ${path}` })
  const title = body?.title?.trim() || 'Untitled page'
  return cmsPageSummary(cmsCreatePage(path, cmsEmptyPage(title)))
})
