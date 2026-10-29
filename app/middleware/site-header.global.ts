// Sets the site header's names and the top nav before the page renders (the layout renders them ahead of
// the page, so a page setting them itself would be too late for the server's HTML), from the published
// page and the pages above it (resolveSiteChrome). The editor's preview sets them from the draft instead.
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin')) return
  const nuxtApp = useNuxtApp()
  const state = useSiteHeaderState()
  const nav = useTopNavState()
  const editLink = useEditLinkState()
  // The server already looked it up for the first page
  if (import.meta.client && nuxtApp.isHydrating && nuxtApp.payload.serverRendered) return

  const path = to.path.replace(/\/+$/, '') || '/'
  try {
    const sources = await publishedChromeSources(siteChromePaths(path))
    const chrome = resolveSiteChrome(sources)
    state.value = chrome.header
    nav.value = chrome.nav
    editLink.value = sources[0] ? `/admin/edit?path=${encodeURIComponent(path)}` : null
  }
  catch {
    // No header names or menu is better than no page: the header and nav show their defaults
    state.value = null
    nav.value = null
    editLink.value = null
  }
})
