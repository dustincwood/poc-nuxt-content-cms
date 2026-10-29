<script setup lang="ts">
// The CMS's pages: their status, and creating, opening, publishing and deleting them
definePageMeta({ layout: false })
useHead({ title: 'Pages' })

type PageSummary = { id: string, path: string, title: string, status: CmsPageStatus, updatedAt: string, publishedAt: string | null }

const toast = useToast()
const { data: pages, refresh } = await useFetch<PageSummary[]>('/api/cms/pages', { default: () => [] })

const search = ref('')
const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? pages.value.filter(p => p.title.toLowerCase().includes(q) || p.path.includes(q)) : pages.value
})
const pending = computed(() => pages.value.filter(p => p.status !== 'published').length)
// Nesting in the list follows the path
const depth = (path: string) => path.split('/').filter(Boolean).length

const badges = {
  draft: { label: 'Never published', color: 'neutral' as const },
  published: { label: 'Published', color: 'success' as const },
  changed: { label: 'Unpublished changes', color: 'warning' as const },
}
const when = (iso: string | null) => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const failed = (e: any) => toast.add({ title: e?.data?.statusMessage ?? 'Something went wrong', color: 'error', icon: 'i-lucide-triangle-alert' })

// ---------- New page ----------

const creating = ref(false)
const form = reactive({ title: '', path: '' })
// Suggest a path from the title until one is typed
const pathEdited = ref(false)
watch(() => form.title, (t) => {
  if (!pathEdited.value) form.path = '/' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
})

async function create() {
  try {
    const page = await $fetch<PageSummary>('/api/cms/pages', { method: 'POST', body: form })
    creating.value = false
    await navigateTo(`/admin/edit?id=${page.id}`)
  }
  catch (e) { failed(e) }
}

// ---------- Publish / delete ----------

const publishingAll = ref(false)
async function publishAll() {
  publishingAll.value = true
  try {
    const { published } = await $fetch<{ published: string[] }>('/api/cms/publish-all', { method: 'POST' })
    toast.add({ title: `Published ${published.length} page${published.length === 1 ? '' : 's'}`, color: 'success', icon: 'i-lucide-check' })
    await refresh()
  }
  catch (e) { failed(e) }
  finally { publishingAll.value = false }
}

const deleting = ref<PageSummary | null>(null)
async function remove() {
  const page = deleting.value!
  deleting.value = null
  try {
    await $fetch(`/api/cms/pages/${page.id}`, { method: 'DELETE' })
    toast.add({ title: `Deleted ${page.path}`, icon: 'i-lucide-trash-2' })
    await refresh()
  }
  catch (e) { failed(e) }
}
</script>

<template>
  <div class="min-h-dvh bg-default text-default">
    <header class="flex h-14 items-center gap-3 border-b border-default px-6">
      <UIcon name="i-lucide-layout-template" class="size-5 text-primary" />
      <h1 class="font-semibold text-highlighted">Pages</h1>
      <span class="text-sm text-muted">{{ pages.length }} pages</span>
      <div class="ml-auto flex items-center gap-2">
        <UButton to="/" target="_blank" color="neutral" variant="ghost" icon="i-lucide-globe" label="View site" />
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-upload"
          :label="`Publish all changes (${pending})`"
          :disabled="!pending"
          :loading="publishingAll"
          @click="publishAll"
        />
        <UButton icon="i-lucide-plus" label="New page" @click="creating = true; pathEdited = false; form.title = ''; form.path = ''" />
      </div>
    </header>

    <main class="mx-auto max-w-5xl p-6">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Find a page by title or path" class="mb-4 w-full" />

      <div v-if="!pages.length" class="rounded-lg border border-dashed border-default p-10 text-center text-muted">
        No pages yet. Create one, or import the migrated usu.edu pages with <code class="font-mono">npm run cms:import</code>.
      </div>

      <ul v-else class="divide-y divide-default rounded-lg border border-default">
        <li v-for="p in shown" :key="p.id" class="group flex items-center gap-3 px-4 py-2.5 hover:bg-elevated/50">
          <NuxtLink :to="`/admin/edit?id=${p.id}`" class="flex min-w-0 flex-1 items-center gap-3">
            <span :style="{ width: `${Math.max(depth(p.path) - 1, 0) * 16}px` }" class="shrink-0" />
            <UIcon :name="depth(p.path) ? 'i-lucide-file-text' : 'i-lucide-house'" class="size-4 shrink-0 text-muted" />
            <span class="min-w-0">
              <span class="block truncate font-medium text-highlighted group-hover:text-primary">{{ p.title }}</span>
              <span class="block truncate font-mono text-xs text-muted">{{ p.path }}</span>
            </span>
          </NuxtLink>
          <UBadge :label="badges[p.status].label" :color="badges[p.status].color" variant="subtle" size="sm" class="shrink-0" />
          <span class="hidden w-40 shrink-0 text-right text-xs text-muted md:block">
            {{ p.publishedAt ? `Published ${when(p.publishedAt)}` : `Edited ${when(p.updatedAt)}` }}
          </span>
          <div class="flex shrink-0 gap-1">
            <UButton v-if="p.status !== 'draft'" :to="p.path" target="_blank" icon="i-lucide-external-link" color="neutral" variant="ghost" size="sm" aria-label="View" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" aria-label="Delete" @click="deleting = p" />
          </div>
        </li>
      </ul>
    </main>

    <UModal v-model:open="creating" title="New page">
      <template #body>
        <form id="new-page" class="space-y-4" @submit.prevent="create">
          <UFormField label="Title">
            <UInput v-model="form.title" autofocus class="w-full" />
          </UFormField>
          <UFormField label="Path" help="Where it's published, e.g. /advising/new-page">
            <UInput v-model="form.path" class="w-full font-mono" @input="pathEdited = true" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" label="Cancel" @click="creating = false" />
        <UButton type="submit" form="new-page" label="Create and edit" :disabled="!form.title.trim() || !form.path.trim()" />
      </template>
    </UModal>

    <UModal :open="!!deleting" :title="`Delete ${deleting?.path}?`" description="The page and its published file are removed. This can't be undone." @update:open="!$event && (deleting = null)">
      <template #footer>
        <UButton color="neutral" variant="ghost" label="Cancel" @click="deleting = null" />
        <UButton color="error" label="Delete page" @click="remove" />
      </template>
    </UModal>
  </div>
</template>
