<script setup lang="ts">
// A component instance in the tree: select it, drag it (before/after another, or inside one that has a
// blocks field), and reorder, duplicate or delete it. Its blocks fields are its children.
const props = defineProps<{
  block: CmsBlock
  area: CmsSlotRef
  index: number
  depth: number
}>()

const editor = useCmsEditor()
const def = computed(() => cmsComponentMap[props.block.component])
const slots = computed(() => cmsBlockSlots(props.block))
const summary = computed(() => cmsBlockSummary(props.block))
const childCount = computed(() => slots.value.reduce((n, s) => n + cmsSlotBlocks(s).length, 0))
const expanded = computed(() => !editor.collapsed.has(props.block._uid))
const isSelected = computed(() => editor.selected.value === props.block._uid)
const siblings = computed(() => cmsSlotBlocks(props.area).length)

function toggle() {
  if (expanded.value) editor.collapsed.add(props.block._uid)
  else editor.collapsed.delete(props.block._uid)
}

// ---------- Drag and drop ----------

const dropAt = ref<CmsDropPosition | null>(null)

function onDragStart(e: DragEvent) {
  editor.dragging.value = { uid: props.block._uid, component: props.block.component }
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.block._uid)
}

// The top quarter drops before, the bottom quarter after, the middle inside (when it can hold it)
function positionFor(e: DragEvent): CmsDropPosition | null {
  const drag = editor.dragging.value
  if (!drag) return null
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = (e.clientY - rect.top) / rect.height
  const tries: CmsDropPosition[] = y < 0.25 ? ['before', 'inside'] : y > 0.75 ? ['after', 'inside'] : ['inside', y < 0.5 ? 'before' : 'after']
  return tries.find(p => editor.dropTarget(drag.component, drag.uid, props.block._uid, p)) ?? null
}

function onDragOver(e: DragEvent) {
  dropAt.value = positionFor(e)
  if (dropAt.value) e.preventDefault()
}

function onDrop() {
  if (editor.dragging.value && dropAt.value) {
    editor.drop(editor.dragging.value.uid, props.block._uid, dropAt.value)
    if (dropAt.value === 'inside') editor.collapsed.delete(props.block._uid)
  }
  dropAt.value = null
  editor.dragging.value = null
}

// Keep the selected row in view when it's chosen in the preview
const row = ref<HTMLElement>()
watch(isSelected, (now) => {
  if (now) nextTick(() => row.value?.scrollIntoView({ block: 'nearest' }))
})

const indent = computed(() => ({ paddingLeft: `${props.depth * 14 + 4}px` }))
</script>

<template>
  <div>
    <div
      ref="row"
      draggable="true"
      :data-uid="block._uid"
      :style="indent"
      :class="[
        'group relative flex h-8 cursor-pointer items-center gap-1 rounded pr-1 text-sm select-none',
        isSelected ? 'bg-primary/10 text-highlighted' : editor.hovered.value === block._uid ? 'bg-elevated' : 'hover:bg-elevated',
        editor.dragging.value?.uid === block._uid && 'opacity-40',
        dropAt === 'inside' && 'ring-2 ring-primary ring-inset',
      ]"
      @click="editor.selected.value = block._uid"
      @mouseenter="editor.hovered.value = block._uid"
      @mouseleave="editor.hovered.value === block._uid && (editor.hovered.value = null)"
      @dragstart.stop="onDragStart"
      @dragend="editor.dragging.value = null; dropAt = null"
      @dragover.stop="onDragOver"
      @dragleave="dropAt = null"
      @drop.stop.prevent="onDrop"
    >
      <!-- Drop line before/after -->
      <div v-if="dropAt === 'before'" class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-primary" />
      <div v-if="dropAt === 'after'" class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-primary" />

      <button
        v-if="slots.length"
        type="button"
        class="flex size-5 shrink-0 items-center justify-center rounded text-dimmed hover:text-default"
        :aria-label="expanded ? 'Collapse' : 'Expand'"
        @click.stop="toggle"
      >
        <UIcon :name="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="size-3.5" />
      </button>
      <span v-else class="w-5 shrink-0" />

      <UIcon :name="def?.icon ?? 'i-lucide-circle-help'" class="size-4 shrink-0 text-muted" />
      <span class="shrink-0 font-medium">{{ def?.label ?? block.component }}</span>
      <span v-if="summary" class="min-w-0 truncate text-muted">{{ summary }}</span>
      <span v-else-if="slots.length && !expanded && childCount" class="text-xs text-dimmed">{{ childCount }}</span>

      <!-- Actions -->
      <div :class="['ml-auto flex shrink-0 items-center', isSelected ? 'flex' : 'hidden group-hover:flex']" @click.stop>
        <UTooltip text="Move up">
          <UButton icon="i-lucide-arrow-up" size="xs" color="neutral" variant="ghost" :disabled="index === 0" @click="editor.shift(block._uid, -1)" />
        </UTooltip>
        <UTooltip text="Move down">
          <UButton icon="i-lucide-arrow-down" size="xs" color="neutral" variant="ghost" :disabled="index === siblings - 1" @click="editor.shift(block._uid, 1)" />
        </UTooltip>
        <UTooltip text="Add after">
          <UButton icon="i-lucide-plus" size="xs" color="neutral" variant="ghost" :disabled="!editor.canPlace(block.component, area)" @click="editor.adding.value = { slot: area, index: index + 1 }" />
        </UTooltip>
        <UTooltip text="Duplicate">
          <UButton icon="i-lucide-copy" size="xs" color="neutral" variant="ghost" :disabled="!editor.canPlace(block.component, area)" @click="editor.duplicate(block._uid)" />
        </UTooltip>
        <UTooltip text="Delete">
          <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost" @click="editor.remove(block._uid)" />
        </UTooltip>
      </div>
    </div>

    <template v-if="slots.length && expanded">
      <CmsTreeSlot v-for="s in slots" :key="s.key" :area="s" :depth="depth + 1" :labelled="slots.length > 1" />
    </template>
  </div>
</template>
