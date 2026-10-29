<script setup lang="ts">
// Bootstrap .container (with the usu.edu widths) and its vertical spacing, e.g. "container my-5"
const props = defineProps<{
  width?: 'default' | 'narrow' | 'fluid'
  // Bootstrap spacers 0-5
  margin_y?: MocaOption
  padding_y?: MocaOption
}>()

const widthClass = computed(() => props.width === 'fluid'
  ? 'w-full mx-auto px-[15px]'
  : mocaContainer(props.width === 'narrow'))
</script>

<template>
  <div :class="[widthClass, mocaSpace('my', margin_y), mocaSpace('py', padding_y)]">
    <slot name="content" />
  </div>
</template>
