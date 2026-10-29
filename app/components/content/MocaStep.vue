<script setup lang="ts">
// One step of a moca-step-guide. The guide lays its steps out itself (numbers and connectors) from their
// props and slots; this renders only for a step written outside a guide.
defineProps<{
  header?: string
  // mocaColors name; slate when empty
  header_color?: string
}>()
</script>

<template>
  <div class="mb-8">
    <h2 :class="[mocaHeading.h2, 'mb-0', mocaColors[header_color ?? '']?.text]">{{ header }}</h2>
    <MocaRichText v-if="$slots.content"><slot name="content" /></MocaRichText>
    <slot name="blocks" />
  </div>
</template>
