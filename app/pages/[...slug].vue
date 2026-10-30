<script setup lang="ts">
// Renders the page published at the current path, read from the CMS when the page is requested
// (server/api/cms/live), so a publish shows at once without rebuilding the site.
// Re-created per path, so navigating between two pages loads the second one
definePageMeta({ key: route => route.path })

const route = useRoute()
const path = route.path.replace(/\/+$/, '') || '/'

const { data: page, error } = await useAsyncData(`page:${path}`, () => $fetch<CmsLivePage>('/api/cms/live', { query: { path } }))

if (error.value || !page.value) {
  // Not found, or the server failed: either way, an error page with its status
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: error.value?.statusMessage ?? `No published page at ${path}`, fatal: true })
}

useSeoMeta({ title: page.value.title, description: page.value.description || undefined })
</script>

<template>
  <ContentRenderer v-if="page" :value="page" />
</template>
