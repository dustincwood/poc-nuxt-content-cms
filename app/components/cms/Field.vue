<script setup lang="ts">
// One field of the selected component, edited in place on the block (the editor's watcher saves it)
const props = defineProps<{
  block: CmsBlock
  field: CmsField
}>()

const label = computed(() => cmsFieldLabel(props.field))

// Select menus can't hold an empty value, so "none" stands in for ''
const NONE = '__none__'
const selectItems = computed(() => (props.field.options ?? []).map(o => ({ label: o.label, value: o.value === '' ? NONE : o.value })))
const selectValue = computed({
  get: () => {
    const v = props.block[props.field.key]
    return v === undefined || v === null || v === '' ? NONE : String(v)
  },
  set: (v: string) => { props.block[props.field.key] = v === NONE ? '' : v },
})

const text = (key: string) => computed({
  get: () => (props.block[key] ?? '') as string,
  set: (v: string) => { props.block[key] = v },
})
const value = text(props.field.key)
const alt = text(`${props.field.key}_alt`)
const newTab = computed({
  get: () => props.block[`${props.field.key}_target`] === '_blank',
  set: (v: boolean) => { props.block[`${props.field.key}_target`] = v ? '_blank' : '' },
})
const checked = computed({
  get: () => !!props.block[props.field.key],
  set: (v: boolean) => { props.block[props.field.key] = v },
})
</script>

<template>
  <USwitch v-if="field.type === 'boolean'" v-model="checked" :label="label" :description="field.help" size="sm" />

  <UFormField v-else :label="label" :help="field.help" size="sm">
    <USelect v-if="field.type === 'select'" v-model="selectValue" :items="selectItems" class="w-full" />

    <UTextarea v-else-if="field.type === 'textarea'" v-model="value" :rows="3" autoresize class="w-full" />

    <div v-else-if="field.type === 'markdown'" class="space-y-1">
      <UTextarea v-model="value" :rows="6" :maxrows="24" autoresize class="w-full" :ui="{ base: 'font-mono text-xs' }" />
      <p class="text-xs text-dimmed">
        Markdown: **bold**, *italic*, [link](/path), - lists, | tables |, ## headings
      </p>
    </div>

    <div v-else-if="field.type === 'link'" class="space-y-1.5">
      <UInput v-model="value" placeholder="/path, https://…, mailto:…" icon="i-lucide-link" class="w-full" />
      <UCheckbox v-model="newTab" label="Open in a new tab" size="sm" />
    </div>

    <div v-else-if="field.type === 'image'" class="space-y-1.5">
      <UInput v-model="value" placeholder="Image URL" icon="i-lucide-image" class="w-full" />
      <UInput v-model="alt" placeholder="Alt text (describe the image)" class="w-full" />
      <img v-if="value" :src="value" alt="" class="max-h-28 rounded border border-default object-contain">
    </div>

    <UInput v-else-if="field.type === 'icon'" v-model="value" placeholder="fa-solid fa-house" class="w-full">
      <template #trailing>
        <MocaFaIcon :icon="value" class="text-base" />
      </template>
    </UInput>

    <UInput v-else v-model="value" class="w-full" />
  </UFormField>
</template>
