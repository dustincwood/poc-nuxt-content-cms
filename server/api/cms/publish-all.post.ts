// Publishes every page whose draft differs from what's published (e.g. after scripts/migrate-mc/import.mjs)
export default defineEventHandler(async () => {
  const pending = cmsListPages().filter(p => cmsPageStatus(p) !== 'published')
  for (const page of pending) await cmsPublish(page.id)
  return { published: pending.map(p => p.path) }
})
