# Nuxt Content CMS (proof of concept)

A CMS with a visual page editor on top of [Nuxt Content](https://content.nuxt.com). Pages are edited as a
tree of components, stored as JSON in SQLite, and published as Nuxt Content markdown, which the site renders.
The components are the usu.edu Modern Campus ports from `poc-storyblok`, now plain Nuxt Content components.

## Getting started

Requires Node 22.5 or later (both the CMS and Nuxt Content use Node's built-in `node:sqlite`).

```bash
npm install
npm run cms:import   # the migrated usu.edu advising pages -> CMS drafts (and a home page)
npm run dev          # https://localhost:3000
```

Then open **/admin**, use **Publish all changes**, and visit `/` or `/advising`.

## How it works

```
 Editor (/admin/edit)                    SQLite (.data/cms.sqlite)
 ┌──────────────────────┐   autosave    ┌──────────────────────────┐  each request: published JSON →
 │ component tree       │ ────────────▶ │ pages: draft JSON        │  markdown → MDC parse (cached) ──▶ site
 │ inspector            │    Publish    │        published JSON    │
 │ live preview iframe ◀┼─┐ ──────────▶ └──────────────────────────┘  and a copy: content/<path>/index.md
 └──────────────────────┘ └ draft JSON → markdown → MDC parse → same components (unsaved edits included)
```

Publishing is live on the next request, in production too: the site reads published pages from the CMS
database, not from Nuxt Content's build-time snapshot of `content/`, so nothing is rebuilt or restarted.

- **Page JSON** (`CmsPageDoc` in `shared/utils/cms-registry.ts`): title, description, site header names,
  top navigation, and `body`, a tree of blocks `{ _uid, component, ...fields }`.
- **Component registry** (`shared/utils/cms-registry.ts`): every component's fields, defaults, and where it
  may nest. Field types: text, textarea, select, boolean, icon, link (URL + `<key>_target`), image
  (URL + `<key>_alt`), markdown (rich text) and blocks (nested components). The editor is built from it.
- **JSON → markdown** (`shared/utils/cms-markdown.ts`): each block becomes an MDC block component, its
  fields as YAML props and its markdown/blocks fields as named slots:

  ```md
  ::moca-card
  ---
  header: Advising
  ---
  #body
  Rich **text**

  #button
    :::moca-button
    ---
    text: Learn more
    link: /advising
    ---
    :::
  ::
  ```

  Nested components are indented two spaces per level: MDC gives an unindented `#slot` line to the
  outermost open component. MDC reads numeric-looking props as numbers, so components accept both.
- **Components** (`app/components/content/Moca*.vue`): props named like the registry's fields; rich text and
  child components arrive as slots. Parents that lay out their children themselves (accordion panels, step
  guide steps, form fields, advisors) read them with `<CmsChildren>`.
- **Publishing** (`server/utils/cms-publish.ts`) records the draft as the page's published version and
  writes it to `content/<path>/index.md` (`content/index.md` for `/`), a readable copy for git history and
  for building a site from files.
- **Serving** (`server/utils/cms-live.ts`, `/api/cms/live`): the catch-all page asks for the page published
  at its path and renders it with Nuxt Content's `ContentRenderer`. Parsed pages are cached by publish time,
  so a new publish is picked up by the next request without any cache to clear. Header names and top nav
  come from the same data (`/api/cms/live-chrome`); a page without them inherits the nearest page above it
  (`app/middleware/site-header.global.ts`).
- **Renames**: a renamed page keeps being served at its old path until it's published at the new one.

## The editor

`/admin` lists pages with their status (never published, published, unpublished changes). In a page:

- **Components tab**: the page content and top navigation as trees. Drag a component before/after another,
  or onto one to nest it inside; Add buttons appear on the selected component and the page sections, and
  the picker only offers what that spot accepts. Row buttons move, add after, duplicate and delete.
- **Inspector** (below the tree): the selected component's fields. Rich text is markdown.
- **Preview**: renders the draft as you type, at desktop, tablet or phone width. Click a component there to
  select it. **Preview** opens it in its own tab, which keeps following the editor.
- **Page tab**: title, path, description, site header names. **Markdown tab**: exactly what Publish writes.
- Drafts save automatically. **Publish** makes the draft live; **Discard** returns to the published page.
- Shortcuts: Ctrl+Z / Ctrl+Y undo and redo, Ctrl+D duplicate, Delete remove, Alt+↑/↓ move, Ctrl+S save.

The footer's **Admin** link opens the current page in the editor.

## Migrating Modern Campus pages

`scripts/migrate-mc/migrate.mjs` (and `advisor-finder.mjs`) turn a Modern Campus `.pcf` page into block JSON
in `scripts/migrate-mc/out/`, still in the Storyblok-shaped format they were written for (rich text as
ProseMirror JSON, which is why `@storyblok/richtext` remains a dev dependency for their HTML parsing).
`scripts/migrate-mc/import.mjs` (`npm run cms:import`) converts that into CMS pages: rich text to markdown,
links and images to flat fields, usu.edu links to imported pages to site paths. `--nav` also fetches each
site's top nav from its published usu.edu page.

## Limits of the proof of concept

- **The database is the source of truth.** It lives in `.data/`, which is gitignored, so back it up or
  point `CMS_DB_PATH` somewhere durable. `content/` is a copy written on publish: editing those files by
  hand doesn't change the site (the next publish overwrites them).
- **One server**: SQLite on local disk serves one instance. Several instances need a shared database
  (e.g. Postgres or Turso) behind `server/utils/cms-db.ts`.
- **No authentication** on `/admin` or `/api/cms/*`.
- Re-running the import overwrites the imported pages' drafts.
- **Images are URLs**: there's no upload or media library yet.
