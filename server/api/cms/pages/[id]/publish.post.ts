// Writes the draft to content/ as markdown and records it as the published version
export default defineEventHandler(async (event) => {
  const page = await cmsPublish(getRouterParam(event, 'id')!)
  return { ...page, status: cmsPageStatus(page) }
})
