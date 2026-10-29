<script setup lang="ts">
// The component picker: the components the target slot accepts, grouped and searchable
const editor = useCmsEditor()

const open = computed({
  get: () => !!editor.adding.value,
  set: (v: boolean) => { if (!v) editor.adding.value = null },
})

const groups = computed(() => {
  const target = editor.adding.value
  if (!target) return []
  const allowed = cmsComponents.filter(c => target.slot.allow.includes(c.name))
  const names = [...new Set(allowed.map(c => c.group))]
  return names.map(group => ({
    id: group,
    label: group,
    items: allowed.filter(c => c.group === group).map(c => ({
      label: c.label,
      suffix: c.name,
      icon: c.icon,
      onSelect: () => {
        editor.add(c.name, target.slot, target.index)
        editor.adding.value = null
      },
    })),
  }))
})
</script>

<template>
  <UModal v-model:open="open" :title="`Add to ${editor.adding.value?.slot.label.toLowerCase() ?? ''}`" :ui="{ content: 'max-w-lg' }">
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Search components…"
        close
        class="h-96"
        @update:open="open = $event"
      />
    </template>
  </UModal>
</template>
