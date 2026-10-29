<script setup lang="ts">
// The selected component's fields. Its nested components (blocks fields) are edited in the tree, so they
// show here as a count with a way to add one.
const editor = useCmsEditor()

const location = editor.selectedLocation
const block = computed(() => location.value?.block)
const def = computed(() => block.value && cmsComponentMap[block.value.component])
const fields = computed(() => def.value?.fields.filter(f => f.type !== 'blocks') ?? [])
const slots = computed(() => (block.value ? cmsBlockSlots(block.value) : []))
const trail = computed(() => (block.value ? editor.ancestors(block.value._uid) : []))
</script>

<template>
  <div v-if="block" class="space-y-4 p-3">
    <!-- Where it is: click a parent to select it -->
    <nav v-if="trail.length" class="flex flex-wrap items-center gap-0.5 text-xs text-muted">
      <template v-for="a in trail" :key="a._uid">
        <button type="button" class="hover:text-primary" @click="editor.selected.value = a._uid">
          {{ cmsComponentMap[a.component]?.label ?? a.component }}
        </button>
        <UIcon name="i-lucide-chevron-right" class="size-3" />
      </template>
    </nav>

    <div class="flex items-center gap-2">
      <UIcon :name="def?.icon ?? 'i-lucide-circle-help'" class="size-5 text-primary" />
      <h2 class="font-semibold text-highlighted">{{ def?.label ?? block.component }}</h2>
      <UBadge :label="block.component" color="neutral" variant="subtle" size="sm" class="ml-auto font-mono" />
    </div>

    <UAlert
      v-if="!def"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Unknown component"
      description="It isn't in shared/utils/cms-registry.ts, so its fields can't be edited. Its plain values are kept when published."
    />

    <CmsField v-for="f in fields" :key="`${block._uid}:${f.key}`" :block="block" :field="f" />

    <div v-for="s in slots" :key="s.key" class="flex items-center justify-between rounded border border-default px-3 py-2 text-sm">
      <span>
        <span class="font-medium">{{ s.label }}</span>
        <span class="text-muted"> · {{ cmsSlotBlocks(s).length }}{{ s.max ? ` of ${s.max}` : '' }} nested</span>
      </span>
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-plus"
        label="Add"
        :disabled="s.max !== undefined && cmsSlotBlocks(s).length >= s.max"
        @click="editor.adding.value = { slot: s }"
      />
    </div>
  </div>

  <div v-else class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted">
    <UIcon name="i-lucide-mouse-pointer-click" class="size-6" />
    Select a component in the tree or click one in the preview to edit it.
  </div>
</template>
