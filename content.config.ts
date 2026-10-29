import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// Published pages: content/<path>/index.md, written by the CMS's Publish (server/utils/cms-publish.ts) from
// the page JSON in its SQLite database. Edit pages at /admin rather than these files: a publish overwrites them.
const link = z.string().optional()

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        // The site header's names; pages without them inherit the nearest folder page's (middleware/site-header.global.ts)
        header: z.object({
          site_name: z.string().optional(),
          site_link: link,
          parent_name: z.string().optional(),
          parent_link: link,
        }).optional(),
        // nav-link / nav-dropdown / nav-columns blocks (see shared/utils/cms-registry.ts), inherited the same way
        top_nav: z.array(z.any()).optional(),
      }),
    }),
  },
})
