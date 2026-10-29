// Every page with its status, for the admin list; ?path=/x returns just that page (the footer's Admin link)
export default defineEventHandler((event) => {
  const { path } = getQuery(event)
  if (typeof path === 'string') {
    const page = cmsGetPageByPath(cmsNormalizePath(path) ?? '')
    if (!page) throw createError({ statusCode: 404, statusMessage: `No page at ${path}` })
    return [cmsPageSummary(page)]
  }
  return cmsListPages().map(cmsPageSummary)
})
