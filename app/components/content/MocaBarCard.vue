<script setup lang="ts">
// A white card with a colored title and a colored bar along its bottom edge, as hand-written on usu.edu:
// <div class="card w-100"><div class="card-body"><h3 class="text-primary">...</h3>...</div>
// <div class="bg-primary rounded-bottom mb-0 py-2"></div></div>
defineProps<{
  title?: string
  // mocaColors names (primary, blue, info, bright-light, ...)
  title_color?: string
  bar_color?: string
}>()
</script>

<template>
  <div :class="mocaCard.base">
    <div :class="mocaCard.body">
      <h3 v-if="title" :class="[mocaHeading.h3, 'mt-0 mb-2', mocaColors[title_color ?? '']?.text]">{{ title }}</h3>
      <MocaRichText v-if="$slots.body" class="[&_ul]:pl-4!"><slot name="body" /></MocaRichText>
    </div>
    <div v-if="bar_color" :class="['py-2 rounded-b-[calc(.25rem-1px)]', mocaColors[bar_color]?.bg]" />
  </div>
</template>
