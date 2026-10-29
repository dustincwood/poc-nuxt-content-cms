import mkcert from "vite-plugin-mkcert";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
  ],
  // Light only, like usu.edu: with color mode on, a visitor's dark-mode preference switched Nuxt UI's
  // text to its light dark-mode color while main.css keeps the background white
  ui: {
    colorMode: false,
  },
  content: {
    // Node's built-in SQLite: better-sqlite3 has no prebuilt binary for every Node version, and building
    // it needs Visual Studio on Windows. The CMS's own database (server/utils/cms-db.ts) uses it too.
    experimental: { sqliteConnector: 'native' },
  },
  mdc: {
    // Markdown renders as plain elements, so MocaRichText's usu.edu styles apply instead of Nuxt UI's
    // typography (its Prose* components); links still navigate client-side
    components: {
      prose: false,
      map: { a: 'CmsLink' },
    },
    headings: { anchorLinks: false },
  },
  routeRules: {
    // The editor and its preview run in the browser only: the preview renders a draft sent from the editor
    '/admin/**': { ssr: false },
  },
  devServer: {
    https: true,
  },
  vite: {
    plugins: [mkcert()],
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
})
