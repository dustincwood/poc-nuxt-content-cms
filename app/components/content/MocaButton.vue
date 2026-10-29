<script setup lang="ts">
// Vue port of component-button (button-bs4.md)
const props = defineProps<{
  text?: string
  link?: string
  link_target?: string
  // btn-primary, btn-info, btn-bright-light, ... (see mocaButtonClass)
  type?: string
  outline?: boolean
  size?: '' | 'btn-sm' | 'btn-lg'
  centered?: boolean
  // Full width (.btn-block)
  block?: boolean
  // Fills its column's height with the label centered (.h-100.d-flex.justify-content-center.align-items-center),
  // so a row of buttons stays even when some labels wrap
  fill_height?: boolean
}>()

const buttonClass = computed(() => [
  mocaButtonClass(props.type || 'btn-white', props.outline, props.size, props.block),
  props.fill_height && 'h-full flex! items-center justify-center',
])
</script>

<template>
  <div
    v-if="text"
    :class="[block ? 'w-full' : centered ? 'text-center' : 'inline-block', fill_height && 'h-full']"
  >
    <NuxtLink :to="link || undefined" :target="link_target || undefined" :class="buttonClass">
      {{ text }}
    </NuxtLink>
  </div>
</template>
