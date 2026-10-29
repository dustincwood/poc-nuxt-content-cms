<script setup lang="ts">
// A page's draft, rendered the way Publish would: draft JSON -> markdown (cmsPageToMarkdown) -> MDC ->
// the same components, in the site layout. Inside the editor's iframe it follows every edit as it's made
// (postMessage) and maps clicks back to the tree; opened in its own tab it follows the editor through a
// BroadcastChannel. Nothing here is published.
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const route = useRoute()
const id = String(route.query.id ?? '')
const embedded = import.meta.client && window.parent !== window

const page = await $fetch<CmsPageResponse>(`/api/cms/pages/${id}`).catch(() => null)
if (!page) throw createError({ statusCode: 404, statusMessage: 'No such page', fatal: true })

const draft = shallowRef<CmsPageDoc>(page.draft)
const path = ref(page.path)
const rendered = shallowRef<Record<string, any> | null>(null)
const renderError = ref<string | null>(null)

// The latest draft wins: a slow parse never overwrites a newer one
let renderCount = 0
async function render() {
  const n = ++renderCount
  try {
    const parsed = await parseMarkdown(cmsPageToMarkdown(draft.value, { uids: true }))
    if (n !== renderCount) return
    rendered.value = { ...parsed.data, body: parsed.body }
    renderError.value = null
  }
  catch (e: any) {
    if (n === renderCount) renderError.value = e?.message ?? String(e)
  }
}

// Header and nav: the draft's own, else the published pages above it
const header = useSiteHeaderState()
const nav = useTopNavState()
async function setChrome() {
  const above = siteChromePaths(path.value).slice(1)
  const sources = await publishedChromeSources(above).catch(() => [])
  const chrome = resolveSiteChrome([{ path: path.value, header: draft.value.header, top_nav: draft.value.top_nav }, ...sources])
  header.value = chrome.header
  nav.value = chrome.nav
}

watch(draft, () => { render(); setChrome() }, { immediate: true })
useHead({ title: () => `Preview: ${draft.value.title}` })

// ---------- The editor ----------

const selected = ref<string | null>(null)
const hovered = ref<string | null>(null)

function receive(data: unknown) {
  if (!isCmsPreviewMessage(data)) return
  if (data.type === 'cms:draft' && data.id === id) {
    draft.value = data.draft
    path.value = data.path
  }
  else if (data.type === 'cms:select') selected.value = data.uid
  else if (data.type === 'cms:hover') hovered.value = data.uid
}

const toEditor = (message: CmsPreviewMessage) => window.parent.postMessage(message, window.location.origin)

// Outlines on the hovered and selected components (their root elements carry cmsuid)
function mark(attr: string, uid: string | null, scroll = false) {
  document.querySelectorAll(`[${attr}]`).forEach(el => el.removeAttribute(attr))
  if (!uid) return
  const el = document.querySelector(`[cmsuid="${CSS.escape(uid)}"]`)
  el?.setAttribute(attr, '')
  if (scroll) el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}
watch(selected, uid => nextTick(() => mark('data-cms-selected', uid, true)))
watch(hovered, uid => mark('data-cms-hover', uid))
// Re-rendering replaces the elements, so the marks are put back
watch(rendered, () => nextTick(() => { mark('data-cms-selected', selected.value); mark('data-cms-hover', hovered.value) }))

const uidAt = (target: EventTarget | null) => (target as Element | null)?.closest?.('[cmsuid]')?.getAttribute('cmsuid') ?? null

let channel: BroadcastChannel | undefined
onMounted(() => {
  if (embedded) {
    window.addEventListener('message', (e) => { if (e.origin === window.location.origin) receive(e.data) })
    // In the editor a click selects the component instead of following links or pressing buttons
    document.addEventListener('click', (e) => {
      const uid = uidAt(e.target)
      if (!uid) return
      e.preventDefault()
      e.stopPropagation()
      selected.value = uid
      toEditor({ type: 'cms:select', uid })
    }, true)
    document.addEventListener('mouseover', (e) => {
      const uid = uidAt(e.target)
      if (uid === hovered.value) return
      hovered.value = uid
      toEditor({ type: 'cms:hover', uid })
    })
    // After a click here the preview has focus: pass the editor's shortcuts on (not keys typed into a form)
    document.addEventListener('keydown', (e) => {
      if ((e.target as Element)?.closest?.('input, textarea, select, [contenteditable]')) return
      const mod = e.ctrlKey || e.metaKey
      const shortcut = (mod && 'zysd'.includes(e.key.toLowerCase())) || e.key === 'Delete' || e.key === 'Escape'
        || (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown'))
      if (!shortcut) return
      e.preventDefault()
      toEditor({ type: 'cms:key', key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey })
    })
    toEditor({ type: 'cms:ready' })
  }
  else {
    channel = cmsPreviewChannel(id)
    channel.onmessage = e => receive(e.data)
  }
})
onBeforeUnmount(() => channel?.close())
</script>

<template>
  <div>
    <div v-if="!embedded" class="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-100 px-4 py-2 text-sm text-amber-950">
      <UIcon name="i-lucide-eye" class="size-4" />
      Preview of the draft of <span class="font-mono">{{ path }}</span>. It follows the editor as you work; it isn't published.
      <NuxtLink :to="`/admin/edit?id=${id}`" class="underline">Back to the editor</NuxtLink>
    </div>
    <UAlert
      v-if="renderError"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="This draft's markdown couldn't be rendered"
      :description="renderError"
      class="m-4"
    />
    <ContentRenderer v-if="rendered" :value="rendered" />
  </div>
</template>

<style>
[data-cms-hover] {
  outline: 2px dashed var(--ui-primary);
  outline-offset: -2px;
  cursor: pointer;
}
[data-cms-selected] {
  outline: 2px solid var(--ui-primary);
  outline-offset: -2px;
}
</style>
