// The visual editor's state for one page: the draft being edited, the selected component, tree operations
// (add, move, nest, duplicate, remove), undo/redo, and saving. Created by pages/admin/edit.vue and shared
// with its components through provide/inject.
import type { InjectionKey } from 'vue'

export interface CmsPageResponse {
  id: string
  path: string
  draft: CmsPageDoc
  published: CmsPageDoc | null
  publishedPath: string | null
  publishedAt: string | null
  status: CmsPageStatus
}

// Where blocks live: an owner's array field (the page's body or top_nav, or a block's blocks field)
export interface CmsSlotRef {
  owner: Record<string, any>
  key: string
  // Components it accepts, and how many
  allow: string[]
  max?: number
  label: string
}

export interface CmsLocation {
  block: CmsBlock
  slot: CmsSlotRef
  index: number
  // The block whose slot it's in; null at the page's top level
  parent: CmsBlock | null
}

export type CmsDropPosition = 'before' | 'after' | 'inside'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// A block's nested slots (its blocks fields), in registry order
export function cmsBlockSlots(block: CmsBlock): CmsSlotRef[] {
  return (cmsComponentMap[block.component]?.fields ?? [])
    .filter(f => f.type === 'blocks')
    .map(f => ({ owner: block, key: f.key, allow: cmsAllowed(f), max: f.max, label: cmsFieldLabel(f) }))
}

// A slot's blocks; reading never adds the array, so opening a page doesn't count as a change
export function cmsSlotBlocks(slot: CmsSlotRef): CmsBlock[] {
  return Array.isArray(slot.owner[slot.key]) ? slot.owner[slot.key] : []
}

function withNewUids(block: CmsBlock): CmsBlock {
  const copy: CmsBlock = { ...block, _uid: cmsUid() }
  for (const [key, value] of Object.entries(copy)) {
    if (Array.isArray(value)) copy[key] = value.map(v => (v && typeof v === 'object' && 'component' in v ? withNewUids(v) : v))
  }
  return copy
}

export function createCmsEditor(initial: CmsPageResponse) {
  const page = ref<CmsPageResponse>(initial)
  const draft = ref<CmsPageDoc>(clone(initial.draft))
  draft.value.top_nav ??= []
  draft.value.header ??= {}
  const path = ref(initial.path)
  const selected = ref<string | null>(null)
  const hovered = ref<string | null>(null)
  const collapsed = reactive(new Set<string>())
  // The component picker, while open: the slot it adds to and where
  const adding = ref<{ slot: CmsSlotRef, index?: number } | null>(null)
  // The block being dragged in the tree
  const dragging = ref<{ uid: string, component: string } | null>(null)

  const rootSlots = computed<CmsSlotRef[]>(() => [
    { owner: draft.value, key: 'body', allow: cmsRootAllow.body, label: 'Page content' },
    { owner: draft.value, key: 'top_nav', allow: cmsRootAllow.top_nav, label: 'Top navigation' },
  ])

  // ---------- Finding blocks ----------

  function locate(uid: string): CmsLocation | null {
    const search = (slot: CmsSlotRef, parent: CmsBlock | null): CmsLocation | null => {
      const list = cmsSlotBlocks(slot)
      for (let index = 0; index < list.length; index++) {
        const block = list[index]!
        if (block._uid === uid) return { block, slot, index, parent }
        for (const child of cmsBlockSlots(block)) {
          const found = search(child, block)
          if (found) return found
        }
      }
      return null
    }
    for (const root of rootSlots.value) {
      const found = search(root, null)
      if (found) return found
    }
    return null
  }

  const selectedLocation = computed(() => (selected.value ? locate(selected.value) : null))

  // The chain of blocks from the top down to uid, for the inspector's breadcrumb
  function ancestors(uid: string): CmsBlock[] {
    const chain: CmsBlock[] = []
    for (let loc = locate(uid); loc?.parent; loc = locate(loc.parent._uid)) chain.unshift(loc.parent)
    return chain
  }

  function contains(block: CmsBlock, uid: string): boolean {
    return cmsBlockSlots(block).some(s => cmsSlotBlocks(s).some(b => b._uid === uid || contains(b, uid)))
  }

  // ---------- Changing the tree ----------

  // The slot's array, created when something is first put in it
  function slotList(slot: CmsSlotRef): CmsBlock[] {
    if (!Array.isArray(slot.owner[slot.key])) slot.owner[slot.key] = []
    return slot.owner[slot.key]
  }

  function canPlace(component: string, slot: CmsSlotRef, movingUid?: string) {
    if (!slot.allow.includes(component)) return false
    const count = cmsSlotBlocks(slot).filter(b => b._uid !== movingUid).length
    return slot.max === undefined || count < slot.max
  }

  function insert(slot: CmsSlotRef, index: number, block: CmsBlock) {
    slotList(slot).splice(index, 0, block)
    selected.value = block._uid
    // Show the new block: expand everything above it
    for (const a of ancestors(block._uid)) collapsed.delete(a._uid)
  }

  function add(component: string, slot: CmsSlotRef, index = cmsSlotBlocks(slot).length) {
    if (!canPlace(component, slot)) return
    insert(slot, index, cmsNewBlock(component))
  }

  function remove(uid: string) {
    const loc = locate(uid)
    if (!loc) return
    slotList(loc.slot).splice(loc.index, 1)
    if (selected.value === uid || (selected.value && contains(loc.block, selected.value))) {
      const list = slotList(loc.slot)
      selected.value = list[Math.min(loc.index, list.length - 1)]?._uid ?? loc.parent?._uid ?? null
    }
  }

  function duplicate(uid: string) {
    const loc = locate(uid)
    if (!loc || !canPlace(loc.block.component, loc.slot)) return
    insert(loc.slot, loc.index + 1, withNewUids(clone(loc.block)))
  }

  // Up or down among its siblings
  function shift(uid: string, by: -1 | 1) {
    const loc = locate(uid)
    if (!loc) return
    const list = slotList(loc.slot)
    const to = loc.index + by
    if (to < 0 || to >= list.length) return
    list.splice(to, 0, ...list.splice(loc.index, 1))
  }

  // Where a drop on `target` at `position` would put a block: the slot and index, or null if it can't go there
  function dropTarget(movingComponent: string, movingUid: string | null, targetUid: string, position: CmsDropPosition) {
    const target = locate(targetUid)
    if (!target) return null
    if (movingUid && (movingUid === targetUid || contains(locate(movingUid)!.block, targetUid))) return null
    if (position === 'inside') {
      const slot = cmsBlockSlots(target.block).find(s => canPlace(movingComponent, s, movingUid ?? undefined))
      return slot ? { slot, index: cmsSlotBlocks(slot).length } : null
    }
    if (!canPlace(movingComponent, target.slot, movingUid ?? undefined)) return null
    return { slot: target.slot, index: target.index + (position === 'after' ? 1 : 0) }
  }

  function moveTo(uid: string, slot: CmsSlotRef, index: number) {
    const loc = locate(uid)
    // Never into itself or anything inside it
    if (!loc || !canPlace(loc.block.component, slot, uid) || slot.owner === loc.block || contains(loc.block, slot.owner._uid)) return false
    const list = slotList(slot)
    // Removing it first shifts later positions in the same list down by one
    const sameList = slotList(loc.slot) === list
    slotList(loc.slot).splice(loc.index, 1)
    list.splice(sameList && loc.index < index ? index - 1 : index, 0, loc.block)
    selected.value = uid
    return true
  }

  function drop(uid: string, targetUid: string, position: CmsDropPosition) {
    const loc = locate(uid)
    const target = loc && dropTarget(loc.block.component, uid, targetUid, position)
    if (target) moveTo(uid, target.slot, target.index)
  }

  // ---------- Undo / redo ----------

  // Snapshots of the draft before each change; quick successive edits (typing) are one step
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])
  let last = JSON.stringify(draft.value)
  let coalescing: ReturnType<typeof setTimeout> | undefined
  let restoring = false

  watch(draft, () => {
    const now = JSON.stringify(draft.value)
    if (restoring || now === last) return
    if (!coalescing) {
      undoStack.value.push(last)
      if (undoStack.value.length > 200) undoStack.value.shift()
      redoStack.value = []
    }
    clearTimeout(coalescing)
    coalescing = setTimeout(() => { coalescing = undefined; last = JSON.stringify(draft.value) }, 600)
    last = now
    scheduleSave()
  }, { deep: true })

  function restore(from: Ref<string[]>, to: Ref<string[]>) {
    const snapshot = from.value.pop()
    if (!snapshot) return
    clearTimeout(coalescing)
    coalescing = undefined
    to.value.push(JSON.stringify(draft.value))
    restoring = true
    draft.value = JSON.parse(snapshot)
    last = snapshot
    nextTick(() => { restoring = false })
    if (selected.value && !locate(selected.value)) selected.value = null
    scheduleSave()
  }
  const undo = () => restore(undoStack, redoStack)
  const redo = () => restore(redoStack, undoStack)

  // ---------- Saving and publishing ----------

  const saving = ref(false)
  const unsaved = ref(false)
  const error = ref<string | null>(null)
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  function scheduleSave() {
    unsaved.value = true
    clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 800)
  }

  const apiError = (e: any) => e?.data?.statusMessage ?? e?.statusMessage ?? e?.message ?? 'Request failed'

  async function save() {
    clearTimeout(saveTimer)
    if (!unsaved.value && path.value === page.value.path) return true
    saving.value = true
    unsaved.value = false
    try {
      page.value = await $fetch<CmsPageResponse>(`/api/cms/pages/${page.value.id}`, {
        method: 'PUT',
        body: { draft: draft.value, ...(path.value !== page.value.path && { path: path.value }) },
      })
      path.value = page.value.path
      error.value = null
      return true
    }
    catch (e) {
      unsaved.value = true
      error.value = apiError(e)
      return false
    }
    finally {
      saving.value = false
    }
  }

  async function publish() {
    if (!(await save())) return false
    try {
      page.value = await $fetch<CmsPageResponse>(`/api/cms/pages/${page.value.id}/publish`, { method: 'POST' })
      error.value = null
      return true
    }
    catch (e) {
      error.value = apiError(e)
      return false
    }
  }

  // Back to the published version (one undo step, like any other change)
  async function discard() {
    if (!page.value.published) return
    clearTimeout(saveTimer)
    try {
      const reverted = await $fetch<CmsPageResponse>(`/api/cms/pages/${page.value.id}/discard`, { method: 'POST' })
      draft.value = { top_nav: [], header: {}, ...clone(reverted.draft) }
      path.value = reverted.path
      page.value = reverted
      await nextTick()
      unsaved.value = false
      clearTimeout(saveTimer)
      if (selected.value && !locate(selected.value)) selected.value = null
    }
    catch (e) {
      error.value = apiError(e)
    }
  }

  // Unsaved edits count as changes too; the server's status covers the rest
  const status = computed<CmsPageStatus>(() => {
    if (!page.value.published) return 'draft'
    return unsaved.value || saving.value ? 'changed' : page.value.status
  })

  return {
    page, draft, path, selected, hovered, collapsed, adding, dragging, rootSlots, selectedLocation,
    locate, ancestors, canPlace, add, remove, duplicate, shift, dropTarget, drop, moveTo,
    undo, redo, canUndo: computed(() => undoStack.value.length > 0), canRedo: computed(() => redoStack.value.length > 0),
    saving, unsaved, error, status, save, publish, discard,
  }
}

export type CmsEditor = ReturnType<typeof createCmsEditor>

const key: InjectionKey<CmsEditor> = Symbol('cms-editor')
export const provideCmsEditor = (editor: CmsEditor) => provide(key, editor)
export const useCmsEditor = () => inject(key)!
