<script setup lang="ts">
// The visual page editor: the page's components as a tree in the sidebar (nest by dragging or adding
// inside), the selected one's fields below it, and a live preview of the draft beside them. Edits save as
// a draft automatically; Publish writes the page's markdown into content/, where the site serves it.
// /admin/edit?id=<page id>, or ?path=/some/page (the footer's Admin link).
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const toast = useToast()

let id = typeof route.query.id === 'string' ? route.query.id : ''
if (!id && typeof route.query.path === 'string') {
  const [found] = await $fetch<{ id: string }[]>('/api/cms/pages', { query: { path: route.query.path } }).catch(() => [])
  if (found) {
    id = found.id
    router.replace({ query: { id } })
  }
}
const initial = id ? await $fetch<CmsPageResponse>(`/api/cms/pages/${id}`).catch(() => null) : null
if (!initial) throw createError({ statusCode: 404, statusMessage: 'No such page', fatal: true })

const editor = createCmsEditor(initial)
provideCmsEditor(editor)
const { draft, page, status } = editor

useHead({ title: () => `Edit: ${draft.value.title}` })

// ---------- Sidebar ----------

const tabs = [
  { label: 'Components', value: 'components', icon: 'i-lucide-list-tree' },
  { label: 'Page', value: 'page', icon: 'i-lucide-settings-2' },
  { label: 'Markdown', value: 'markdown', icon: 'i-lucide-file-code' },
]
const tab = ref('components')
const markdown = computed(() => cmsPageToMarkdown(draft.value))

// ---------- Preview ----------

const devices = [
  { label: 'Desktop', value: 'desktop', icon: 'i-lucide-monitor', width: '100%' },
  { label: 'Tablet', value: 'tablet', icon: 'i-lucide-tablet', width: '820px' },
  { label: 'Phone', value: 'phone', icon: 'i-lucide-smartphone', width: '390px' },
]
const device = ref('desktop')
const frame = ref<HTMLIFrameElement>()
const previewUrl = `/admin/preview?id=${initial.id}`

let channel: BroadcastChannel | undefined
function post(message: CmsPreviewMessage) {
  frame.value?.contentWindow?.postMessage(message, window.location.origin)
}
function sendDraft() {
  // Plain data: a reactive proxy can't be cloned into a message
  const message: CmsPreviewMessage = { type: 'cms:draft', id: page.value.id, path: editor.path.value, draft: JSON.parse(JSON.stringify(draft.value)) }
  post(message)
  channel?.postMessage(message)
}

let sendTimer: ReturnType<typeof setTimeout> | undefined
watch([draft, editor.path], () => {
  clearTimeout(sendTimer)
  sendTimer = setTimeout(sendDraft, 120)
}, { deep: true })
watch(editor.selected, uid => post({ type: 'cms:select', uid }))
watch(editor.hovered, uid => post({ type: 'cms:hover', uid }))

function onMessage(e: MessageEvent) {
  if (e.origin !== window.location.origin || e.source !== frame.value?.contentWindow || !isCmsPreviewMessage(e.data)) return
  if (e.data.type === 'cms:ready') {
    sendDraft()
    post({ type: 'cms:select', uid: editor.selected.value })
  }
  else if (e.data.type === 'cms:select' && e.data.uid) {
    editor.selected.value = e.data.uid
    tab.value = 'components'
    // Open the tree down to it
    for (const a of editor.ancestors(e.data.uid)) editor.collapsed.delete(a._uid)
  }
  else if (e.data.type === 'cms:hover') editor.hovered.value = e.data.uid
  else if (e.data.type === 'cms:key') onKey(new KeyboardEvent('keydown', e.data))
}

// ---------- Keyboard ----------

function onKey(e: KeyboardEvent) {
  const typing = (e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable], [role=combobox]')
  const mod = e.ctrlKey || e.metaKey
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault()
    editor.save()
    return
  }
  if (typing) return
  const uid = editor.selected.value
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? editor.redo() : editor.undo() }
  else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); editor.redo() }
  else if (uid && mod && e.key.toLowerCase() === 'd') { e.preventDefault(); editor.duplicate(uid) }
  else if (uid && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); editor.remove(uid) }
  else if (uid && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); editor.shift(uid, e.key === 'ArrowUp' ? -1 : 1) }
  else if (e.key === 'Escape') editor.selected.value = null
}

// Leaving with an edit not yet saved
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (editor.unsaved.value || editor.saving.value) e.preventDefault()
}

onMounted(() => {
  channel = cmsPreviewChannel(initial.id)
  window.addEventListener('message', onMessage)
  window.addEventListener('keydown', onKey)
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => {
  channel?.close()
  window.removeEventListener('message', onMessage)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('beforeunload', onBeforeUnload)
  editor.save()
})

// ---------- Publishing ----------

const statusBadge = computed(() => ({
  draft: { label: 'Never published', color: 'neutral' as const },
  published: { label: 'Published', color: 'success' as const },
  changed: { label: 'Unpublished changes', color: 'warning' as const },
})[status.value])

const saveLabel = computed(() => editor.saving.value ? 'Saving…' : editor.unsaved.value ? 'Unsaved' : 'Draft saved')
const publishing = ref(false)

async function publish() {
  publishing.value = true
  const ok = await editor.publish()
  publishing.value = false
  if (ok) toast.add({ title: 'Published', description: `${page.value.path} is live.`, color: 'success', icon: 'i-lucide-check' })
}

const confirmDiscard = ref(false)
async function discard() {
  confirmDiscard.value = false
  await editor.discard()
  toast.add({ title: 'Changes discarded', description: 'The draft is back to the published page.', icon: 'i-lucide-undo-2' })
}
</script>

<template>
  <div class="flex h-dvh flex-col bg-default text-default">
    <!-- Top bar -->
    <header class="flex h-12 shrink-0 items-center gap-2 border-b border-default px-3">
      <UButton to="/admin" icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" aria-label="All pages" />
      <div class="min-w-0">
        <div class="truncate text-sm font-semibold text-highlighted">{{ draft.title }}</div>
        <div class="truncate font-mono text-xs text-muted">{{ editor.path.value }}</div>
      </div>
      <UBadge :label="statusBadge.label" :color="statusBadge.color" variant="subtle" size="sm" class="ml-2 shrink-0" />
      <span class="hidden shrink-0 items-center gap-1 text-xs text-muted sm:flex">
        <UIcon :name="editor.saving.value ? 'i-lucide-loader-circle' : 'i-lucide-cloud'" :class="['size-3.5', editor.saving.value && 'animate-spin']" />
        {{ saveLabel }}
      </span>

      <div class="ml-auto flex items-center gap-1">
        <UTooltip text="Undo (Ctrl+Z)">
          <UButton icon="i-lucide-undo-2" color="neutral" variant="ghost" size="sm" :disabled="!editor.canUndo.value" @click="editor.undo()" />
        </UTooltip>
        <UTooltip text="Redo (Ctrl+Y)">
          <UButton icon="i-lucide-redo-2" color="neutral" variant="ghost" size="sm" :disabled="!editor.canRedo.value" @click="editor.redo()" />
        </UTooltip>

        <div class="mx-1 hidden items-center rounded-md border border-default p-0.5 md:flex">
          <UTooltip v-for="d in devices" :key="d.value" :text="d.label">
            <UButton :icon="d.icon" size="xs" :color="device === d.value ? 'primary' : 'neutral'" :variant="device === d.value ? 'soft' : 'ghost'" @click="device = d.value" />
          </UTooltip>
        </div>

        <UTooltip text="Open the preview in a new tab">
          <UButton :to="previewUrl" target="_blank" icon="i-lucide-external-link" color="neutral" variant="ghost" size="sm" label="Preview" />
        </UTooltip>
        <UButton
          v-if="page.published"
          :to="page.publishedPath ?? undefined"
          target="_blank"
          icon="i-lucide-globe"
          color="neutral"
          variant="ghost"
          size="sm"
          label="Live"
        />
        <UButton
          v-if="status === 'changed'"
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="outline"
          size="sm"
          label="Discard"
          @click="confirmDiscard = true"
        />
        <UButton
          icon="i-lucide-upload"
          size="sm"
          label="Publish"
          :loading="publishing"
          :disabled="status === 'published'"
          @click="publish"
        />
      </div>
    </header>

    <UAlert
      v-if="editor.error.value"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="editor.error.value"
      :close="true"
      class="rounded-none"
      @update:open="editor.error.value = null"
    />

    <div class="flex min-h-0 flex-1">
      <!-- Sidebar -->
      <aside class="flex w-[400px] shrink-0 flex-col border-r border-default">
        <UTabs v-model="tab" :items="tabs" :content="false" size="sm" variant="link" class="shrink-0 px-2 pt-1" />

        <template v-if="tab === 'components'">
          <div class="min-h-0 flex-1 overflow-y-auto py-1">
            <section v-for="root in editor.rootSlots.value" :key="root.key" class="mb-2">
              <h3 class="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                <UIcon :name="root.key === 'body' ? 'i-lucide-file-text' : 'i-lucide-menu'" class="size-3.5" />
                {{ root.label }}
              </h3>
              <CmsTreeSlot :area="root" :depth="0" />
            </section>
          </div>
          <div class="h-[45%] shrink-0 overflow-y-auto border-t border-default bg-elevated/30">
            <CmsInspector />
          </div>
        </template>

        <div v-else-if="tab === 'page'" class="min-h-0 flex-1 overflow-y-auto">
          <CmsPageSettings />
        </div>

        <div v-else class="flex min-h-0 flex-1 flex-col">
          <p class="shrink-0 px-3 py-2 text-xs text-muted">
            What Publish writes to <span class="font-mono">content{{ editor.path.value === '/' ? '' : editor.path.value }}/index.md</span> (read-only: edit the components).
          </p>
          <pre class="min-h-0 flex-1 overflow-auto bg-elevated/50 p-3 font-mono text-xs leading-relaxed">{{ markdown }}</pre>
        </div>
      </aside>

      <!-- Preview -->
      <main class="flex min-w-0 flex-1 justify-center overflow-hidden bg-muted p-3">
        <iframe
          ref="frame"
          :src="previewUrl"
          title="Preview"
          class="h-full rounded-md border border-default bg-white shadow-sm transition-[width] duration-200"
          :style="{ width: devices.find(d => d.value === device)!.width }"
        />
      </main>
    </div>

    <CmsAddPicker />

    <UModal v-model:open="confirmDiscard" title="Discard unpublished changes?" description="The draft goes back to the published page. You can undo this.">
      <template #footer>
        <UButton color="neutral" variant="ghost" label="Cancel" @click="confirmDiscard = false" />
        <UButton color="warning" label="Discard changes" @click="discard" />
      </template>
    </UModal>
  </div>
</template>
