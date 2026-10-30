// The site header and top nav that the published pages at ?paths=/a/b,/a,/ set, in that order (null for a
// path with nothing published), for resolveSiteChrome
export default defineEventHandler((event) => {
  const paths = String(getQuery(event).paths ?? '').split(',').map(p => cmsNormalizePath(p)).filter(p => p !== null)
  return cmsLiveChrome(paths)
})
