<script setup lang="ts">
// One panel of a moca-accordion. The accordion lays its panels out itself from their title and #content
// slot; this renders only for a panel written outside an accordion.
defineProps<{ title?: string }>()
</script>

<template>
  <div class="my-4">
    <h2 :class="[mocaHeading.h4, 'mb-2']">{{ title }}</h2>
    <MocaRichText v-if="$slots.content"><slot name="content" /></MocaRichText>
  </div>
</template>
