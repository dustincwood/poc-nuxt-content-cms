<script setup lang="ts">
// The page's own fields: title, path, and the site header names its folder's pages inherit
const editor = useCmsEditor()
const draft = editor.draft

const header = (key: keyof CmsPageHeader) => computed({
  get: () => draft.value.header?.[key] ?? '',
  set: (v: string) => { draft.value.header = { ...draft.value.header, [key]: v } },
})
const siteName = header('site_name')
const siteLink = header('site_link')
const parentName = header('parent_name')
const parentLink = header('parent_link')
const description = computed({
  get: () => draft.value.description ?? '',
  set: (v: string) => { draft.value.description = v },
})
</script>

<template>
  <div class="space-y-4 p-3">
    <UFormField label="Title" size="sm">
      <UInput v-model="draft.title" class="w-full" />
    </UFormField>
    <UFormField label="Path" help="Letters, digits, - and _ between slashes. Publishing writes the page here." size="sm">
      <UInput v-model="editor.path.value" class="w-full font-mono" @blur="editor.save()" />
    </UFormField>
    <UFormField label="Description" help="For search engines and link previews" size="sm">
      <UTextarea v-model="description" :rows="2" autoresize class="w-full" />
    </UFormField>

    <USeparator label="Site header" />
    <p class="text-xs text-muted">
      Pages below this one show these names too, unless they set their own. Leave the site name empty to inherit.
    </p>
    <UFormField label="Site name" size="sm">
      <UInput v-model="siteName" class="w-full" />
    </UFormField>
    <UFormField label="Site link" help="Empty: this page" size="sm">
      <UInput v-model="siteLink" class="w-full" />
    </UFormField>
    <UFormField label="Parent name" size="sm">
      <UInput v-model="parentName" class="w-full" />
    </UFormField>
    <UFormField label="Parent link" size="sm">
      <UInput v-model="parentLink" class="w-full" />
    </UFormField>

    <USeparator label="Top navigation" />
    <p class="text-xs text-muted">
      Edit the menu in the Navigation section of the Components tab. Pages below this one use it unless they have their own.
    </p>
  </div>
</template>
