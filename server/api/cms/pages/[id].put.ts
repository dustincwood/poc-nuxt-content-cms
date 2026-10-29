// Saves the working draft (and the page's path, when it changes). Nothing is published.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  if (!cmsGetPage(id)) throw createError({ statusCode: 404, statusMessage: 'No such page' })
  const body = await readBody<{ draft?: CmsPageDoc, path?: string }>(event)
  const draft = body?.draft
  if (!draft || typeof draft.title !== 'string' || !Array.isArray(draft.body)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected { draft: { title, body: [] } }' })
  }
  let path: string | undefined
  if (body.path !== undefined) {
    path = cmsNormalizePath(body.path) ?? undefined
    if (!path) throw createError({ statusCode: 400, statusMessage: 'The path may only use letters, digits, - and _ between slashes' })
    const other = cmsGetPageByPath(path)
    if (other && other.id !== id) throw createError({ statusCode: 409, statusMessage: `A page already exists at ${path}` })
  }
  const page = cmsSaveDraft(id, draft, path)!
  return { ...page, status: cmsPageStatus(page) }
})
