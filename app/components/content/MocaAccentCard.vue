<script setup lang="ts">
// Vue port of component-accent-card (card-accent-color-bs4.md)
const props = defineProps<{
  color?: 'None' | 'Primary' | 'Info' | 'Success' | 'Warning' | 'Gray'
  title?: string
}>()

const accentColors: Record<string, string> = {
  Primary: 'bg-usu-primary',
  Info: 'bg-usu-info',
  Success: 'bg-usu-success',
  Warning: 'bg-usu-warning',
  Gray: 'bg-usu-gray-dark',
}

const accent = computed(() => accentColors[props.color ?? ''])
</script>

<template>
  <div :class="[mocaCard.base, 'mb-4 shadow-[0_.5rem_1rem_rgba(0,0,0,.15)]']">
    <div :class="mocaCard.body">
      <div v-if="title" :class="[mocaHeading.h3, 'mb-2']">{{ title }}</div>
      <MocaRichText v-if="$slots.body"><slot name="body" /></MocaRichText>
      <div class="text-right pt-2">
        <slot name="button" />
      </div>
    </div>
    <!-- .card-footer.p-2.border-0: a 1rem color bar -->
    <div v-if="accent" :class="['p-2 rounded-b-[calc(.25rem-1px)]', accent]" />
  </div>
</template>
