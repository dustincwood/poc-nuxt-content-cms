// The CMS's own database: each page's JSON (shared/utils/cms-registry.ts CmsPageDoc) as a working draft and
// as last published. Node's built-in SQLite, in .data/cms.sqlite (or CMS_DB_PATH).
// Plain TypeScript with explicit imports, so scripts/migrate-mc/import.mjs can load it with Node's type
// stripping as well as Nitro.
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { CmsPageDoc, CmsPageStatus } from '../../shared/utils/cms-registry.ts'

export interface CmsPageRecord {
  id: string
  path: string
  draft: CmsPageDoc
  // null until first published
  published: CmsPageDoc | null
  // The path the published file was written for; differs from path after a rename until the next publish
  publishedPath: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

const schema = `
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  draft TEXT NOT NULL,
  published TEXT,
  published_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
)`

let db: DatabaseSync | undefined

export function cmsDb() {
  if (!db) {
    const file = resolve(process.env.CMS_DB_PATH ?? '.data/cms.sqlite')
    mkdirSync(dirname(file), { recursive: true })
    db = new DatabaseSync(file)
    db.exec(schema)
  }
  return db
}

// '/', '/advising', '/advising/conference': lowercase segments of letters, digits, - and _
export function cmsNormalizePath(input: string) {
  const path = '/' + input.trim().toLowerCase().split('/').filter(Boolean).join('/')
  return /^\/([a-z0-9_-]+(\/[a-z0-9_-]+)*)?$/.test(path) ? path : null
}

function toRecord(row: Record<string, unknown>): CmsPageRecord {
  return {
    id: row.id as string,
    path: row.path as string,
    draft: JSON.parse(row.draft as string),
    published: row.published ? JSON.parse(row.published as string) : null,
    publishedPath: (row.published_path as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    publishedAt: (row.published_at as string) ?? null,
  }
}

export function cmsPageStatus(page: CmsPageRecord): CmsPageStatus {
  if (!page.published) return 'draft'
  return page.publishedPath === page.path && JSON.stringify(page.published) === JSON.stringify(page.draft) ? 'published' : 'changed'
}

export function cmsListPages() {
  return cmsDb().prepare('SELECT * FROM pages ORDER BY path').all().map(toRecord)
}

export function cmsGetPage(id: string) {
  const row = cmsDb().prepare('SELECT * FROM pages WHERE id = ?').get(id)
  return row ? toRecord(row) : null
}

export function cmsGetPageByPath(path: string) {
  const row = cmsDb().prepare('SELECT * FROM pages WHERE path = ?').get(path)
  return row ? toRecord(row) : null
}

// The page live at a path: published there. After a rename, until the page is published again, its
// old path still serves it; if another page has since been published at that path, that one wins.
export function cmsGetPublishedAt(path: string) {
  const row = cmsDb().prepare(`SELECT * FROM pages WHERE published_path = ? AND published IS NOT NULL
    ORDER BY (path = published_path) DESC, published_at DESC LIMIT 1`).get(path)
  return row ? toRecord(row) : null
}

export function cmsCreatePage(path: string, draft: CmsPageDoc) {
  const now = new Date().toISOString()
  const id = randomUUID()
  cmsDb().prepare('INSERT INTO pages (id, path, draft, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, path, JSON.stringify(draft), now, now)
  return cmsGetPage(id)!
}

export function cmsSaveDraft(id: string, draft: CmsPageDoc, path?: string) {
  const now = new Date().toISOString()
  if (path) cmsDb().prepare('UPDATE pages SET draft = ?, path = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(draft), path, now, id)
  else cmsDb().prepare('UPDATE pages SET draft = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(draft), now, id)
  return cmsGetPage(id)
}

export function cmsMarkPublished(id: string, published: CmsPageDoc, path: string) {
  cmsDb().prepare('UPDATE pages SET published = ?, published_path = ?, published_at = ? WHERE id = ?')
    .run(JSON.stringify(published), path, new Date().toISOString(), id)
  return cmsGetPage(id)
}

export function cmsDeletePage(id: string) {
  cmsDb().prepare('DELETE FROM pages WHERE id = ?').run(id)
}

// What the admin list shows of a page
export function cmsPageSummary(page: CmsPageRecord) {
  return {
    id: page.id,
    path: page.path,
    title: page.draft.title,
    status: cmsPageStatus(page),
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt,
  }
}
