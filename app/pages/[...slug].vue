<script setup lang="ts">
// Renders the published page at the current path (content/<path>/index.md, written by the CMS's Publish).
// Re-created per path, so navigating between two pages loads the second one
definePageMeta({ key: route => route.path })

const route = useRoute()
const path = route.path.replace(/\/+$/, '') || '/'

const { data: page } = await useAsyncData(`page:${path}`, () => queryCollection('pages').path(path).first())

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: `No published page at ${path}`, fatal: true })
}

useSeoMeta({ title: page.value.title, description: page.value.description || undefined })
</script>

<template>
  <ContentRenderer v-if="page" :value="page" />
</template>
