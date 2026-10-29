<script setup lang="ts">
// One place blocks can go in the tree (the page's content or nav, or a component's blocks field): its
// blocks, and a way to add more. An empty slot is a drop target of its own.
// Add buttons show on the page's own sections and on the selected component, so the tree isn't lined with
// them; an empty slot also shows while a block that could go in it is dragged.
const props = defineProps<{
  area: CmsSlotRef
  depth: number
  // Name the slot (when its component has more than one)
  labelled?: boolean
}>()

const editor = useCmsEditor()
const blocks = computed(() => cmsSlotBlocks(props.area))
const full = computed(() => props.area.max !== undefined && blocks.value.length >= props.area.max)
const over = ref(false)
// The page's sections (owned by the page, not a block) or the selected block's slots
const active = computed(() => !('_uid' in props.area.owner) || editor.selected.value === props.area.owner._uid)

const accepts = () => !!editor.dragging.value && editor.canPlace(editor.dragging.value.component, props.area, editor.dragging.value.uid)

function onDragOver(e: DragEvent) {
  if (!accepts()) return
  e.preventDefault()
  over.value = true
}

function onDrop() {
  over.value = false
  if (editor.dragging.value && accepts()) editor.moveTo(editor.dragging.value.uid, props.area, blocks.value.length)
  editor.dragging.value = null
}

const indent = computed(() => ({ paddingLeft: `${props.depth * 14 + 8}px` }))
</script>

<template>
  <div>
    <div v-if="labelled && (blocks.length || active)" class="flex items-center gap-1 pr-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-dimmed" :style="indent">
      <span class="truncate">{{ area.label }}</span>
    </div>

    <CmsTreeNode
      v-for="(block, index) in blocks"
      :key="block._uid"
      :block="block"
      :area="area"
      :index="index"
      :depth="depth"
    />

    <div v-if="active || (!blocks.length && accepts())" :style="indent" class="pr-2">
      <button
        v-if="!blocks.length"
        type="button"
        :class="[
          'my-0.5 flex w-full items-center gap-1.5 rounded border border-dashed px-2 py-1 text-xs text-muted hover:border-primary hover:text-primary',
          over ? 'border-primary bg-primary/10 text-primary' : 'border-default',
        ]"
        @click="editor.adding.value = { slot: area }"
        @dragover="onDragOver"
        @dragleave="over = false"
        @drop.prevent="onDrop"
      >
        <UIcon name="i-lucide-plus" class="size-3.5" />
        {{ editor.dragging.value ? 'Drop here' : `Add to ${area.label.toLowerCase()}` }}
      </button>
      <button
        v-else-if="!full"
        type="button"
        class="my-0.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-dimmed hover:bg-elevated hover:text-primary"
        @click="editor.adding.value = { slot: area }"
      >
        <UIcon name="i-lucide-plus" class="size-3.5" />
        Add
      </button>
    </div>
  </div>
</template>
