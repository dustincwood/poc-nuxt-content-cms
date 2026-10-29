<script setup lang="ts">
// A colored header bar over a bordered list, as hand-written on usu.edu:
// <div class="card border-0"><h3 class="h4 text-white card-header bg-primary">Resources</h3>
// <ul class="list-group list-group-flush border"><li class="list-group-item"><a>...</a></li></ul></div>
// The #body slot is a bulleted list; each item becomes a row.
defineProps<{
  title?: string
  // mocaColors name for the header bar
  header_color?: string
}>()

// .list-group-flush rows inside a .border box
const list = [
  '[&_ul]:list-none! [&_ul]:p-0! [&_ul]:m-0! [&_ul]:border [&_ul]:border-usu-gray-300',
  '[&_li]:px-5 [&_li]:py-3 [&_li]:bg-white [&_li+li]:border-t [&_li+li]:border-black/[.125] [&_li_p]:mb-0',
]
</script>

<template>
  <div class="relative flex flex-col w-full min-w-0 break-words">
    <h3
      v-if="title"
      :class="[mocaHeading.h4, 'm-0 px-5 py-3 text-white! rounded-t-[calc(.25rem-1px)]', mocaColors[header_color ?? '']?.bg ?? 'bg-usu-primary']"
    >
      {{ title }}
    </h3>
    <MocaRichText v-if="$slots.body" :class="list"><slot name="body" /></MocaRichText>
  </div>
</template>
