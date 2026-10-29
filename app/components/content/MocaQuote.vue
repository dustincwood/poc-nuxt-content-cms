<script setup lang="ts">
// Vue port of component-block-quote (quote-block-bs4.md)
defineProps<{
  // Not `style`: Vue reserves that for inline CSS
  quote_style?: 'default' | 'bars'
  quote?: string
  author?: string
}>()

// div.icon-hr: the icon centered between two thin rules
const iconHr = 'flex items-center before:grow before:border-b before:border-usu-gray-300 after:grow after:border-b after:border-usu-gray-300'
// .blockquote-footer (Bootstrap's ::before em dash is written into the template)
const footer = 'block text-[80%] text-usu-muted'
</script>

<template>
  <blockquote v-if="quote_style === 'bars'" class="mb-4 text-xl">
    <div :class="[iconHr, 'mb-4']">
      <UIcon name="i-fa6-solid-quote-left" class="mx-4 size-[1em] text-[2em] text-usu-bright-light" />
    </div>
    <p class="mb-4 italic">{{ quote }}</p>
    <footer v-if="author" :class="[footer, 'text-right']">&mdash;&nbsp;{{ author }}</footer>
    <div :class="[iconHr, 'mt-4']">
      <UIcon name="i-fa6-solid-quote-right" class="mx-4 size-[1em] text-[2em] text-usu-bright-light" />
    </div>
  </blockquote>
  <blockquote v-else class="mb-4 text-xl">
    <p class="my-0">"{{ quote }}"</p>
    <footer v-if="author" :class="footer">&mdash;&nbsp;{{ author }}</footer>
  </blockquote>
</template>
