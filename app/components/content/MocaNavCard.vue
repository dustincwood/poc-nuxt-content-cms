<script setup lang="ts">
// Vue port of component-nav-card (card-navigation-bs4.md)
defineProps<{
  color?: 'None' | 'Primary' | 'Info'
  title?: string
}>()

const accentColors: Record<string, string> = {
  Primary: 'bg-usu-primary',
  Info: 'bg-usu-info',
}
</script>

<template>
  <div :class="[mocaCard.base, 'mb-4']">
    <div :class="mocaCard.body">
      <div v-if="title" :class="[mocaHeading.h3, 'mb-2 font-bold!']">{{ title }}</div>
      <MocaRichText v-if="$slots.body"><slot name="body" /></MocaRichText>
    </div>
    <!-- .nav-card footer: no top border, button aligned right -->
    <div class="px-5 py-3 flex flex-wrap justify-end">
      <slot name="button" />
    </div>
    <!-- .card-footer.p-2.border-0: a 1rem color bar (white when the color is None) -->
    <div :class="['p-2 rounded-b-[calc(.25rem-1px)]', accentColors[color ?? '']]" />
  </div>
</template>
