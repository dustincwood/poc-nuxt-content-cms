// The site header's names and the top nav for the current page, set by middleware/site-header.global.ts
// (or the editor's preview) before the page renders, and read by the layout. null: the components show
// their own defaults.
export type SiteHeader = {
  siteName: string
  siteUrl: string
  parentName: string
  parentUrl: string
}

export const useSiteHeaderState = () => useState<SiteHeader | null>('site-header', () => null)

// The current page in the CMS editor (the footer's Admin link, as usu.edu's opens the page in Modern
// Campus); null on pages the CMS didn't publish
export const useEditLinkState = () => useState<string | null>('edit-link', () => null)

// TopNavigation's item shapes (see its demoItems)
export type NavItem = {
  label: string
  to?: string
  target?: string
  button?: boolean
  alignRight?: boolean
  mega?: boolean
  links?: NavLink[]
  columns?: { title?: string, text?: string, width?: number, linkColumns?: number, links?: NavLink[], more?: NavLink }[]
}
type NavLink = { label: string, to: string, target?: string, icon?: string } | { divider: true }

export const useTopNavState = () => useState<NavItem[] | null>('top-nav', () => null)

const navLink = (b: any): NavLink => ({
  label: b.label ?? '',
  to: b.link || '#',
  ...(b.link_target && { target: b.link_target }),
  ...(b.icon && { icon: faIconName(b.icon) }),
})

// A page's top_nav blocks (nav-link, nav-dropdown, nav-columns) -> TopNavigation items
export function navItems(blocks: any[]): NavItem[] {
  return blocks.map((b) => {
    if (b.component === 'nav-dropdown') {
      return {
        label: b.label ?? '',
        alignRight: !!b.align_right,
        links: (b.links ?? []).map((l: any) => l.component === 'nav-divider' ? { divider: true } : navLink(l)),
      }
    }
    if (b.component === 'nav-columns') {
      return {
        label: b.label ?? '',
        mega: !!b.mega,
        alignRight: !!b.align_right,
        columns: (b.columns ?? []).map((c: any) => ({
          ...(c.title && { title: c.title }),
          ...(c.text && { text: c.text }),
          ...(Number(c.width) && { width: Number(c.width) }),
          ...(Number(c.link_columns) > 1 && { linkColumns: Number(c.link_columns) }),
          links: (c.links ?? []).map(navLink),
          ...(c.more?.[0] && { more: navLink(c.more[0]) }),
        })),
      }
    }
    const link = navLink(b) as { label: string, to: string, target?: string }
    return { ...link, ...(b.button && { button: true }) }
  })
}

// What a page carries for the header and nav (its frontmatter, or a draft's fields)
export type SiteChromeSource = { path: string, header?: CmsPageHeader, top_nav?: any[] }

function headerFrom(source: SiteChromeSource): SiteHeader {
  const h = source.header!
  return {
    siteName: h.site_name!.trim(),
    // An empty site link points at the page that sets the name
    siteUrl: h.site_link || source.path,
    parentName: h.parent_name?.trim() ?? '',
    parentUrl: h.parent_link || '#',
  }
}

// /a/b/c -> /a/b/c, /a/b, /a, /
export function siteChromePaths(path: string) {
  const parts = path.split('/').filter(Boolean)
  return Array.from({ length: parts.length + 1 }, (_, i) => '/' + parts.slice(0, parts.length - i).join('/'))
}

// Modern Campus gave each folder its own _siteLogo.inc and _topNav.inc; here a page's own fields win, else
// the nearest page above it that sets them (sources: the page first, then its ancestors). The header and
// the nav are each inherited on their own (a sub-site can keep its parent's menu but name itself), and
// the header's four fields go together, so a sub-site never shows another site's parent.
export function resolveSiteChrome(sources: (SiteChromeSource | undefined)[]) {
  const named = sources.find(s => s?.header?.site_name?.trim())
  const menu = sources.find(s => s?.top_nav?.length)
  return {
    header: named ? headerFrom(named) : null,
    nav: menu ? navItems(menu.top_nav!) : null,
  }
}

// The live (published) pages at these paths, for resolveSiteChrome, from the CMS (server/api/cms/live-chrome)
export async function publishedChromeSources(paths: string[]) {
  const rows = await $fetch<(SiteChromeSource | null)[]>('/api/cms/live-chrome', { query: { paths: paths.join(',') } })
  return rows.map(r => r ?? undefined)
}
