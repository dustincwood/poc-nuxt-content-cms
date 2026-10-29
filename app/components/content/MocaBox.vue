<script setup lang="ts">
// A plain wrapper for spacing and alignment, for hand-written <div class="mb-4"> / <div class="text-center">,
// and the styled boxes built from utilities: <div class="p-3 rounded border bg-info text-white h-100">
const props = defineProps<{
  // Bootstrap spacers 0-5
  margin_top?: MocaOption
  margin_bottom?: MocaOption
  // Space inside, above and below (.py-*): unlike margins, it doesn't collapse into neighbours' margins
  padding_y?: MocaOption
  // Space inside on all sides (.p-*)
  padding?: MocaOption
  // A Bootstrap background class (mocaBg): bg-white, bg-light, bg-info, ...
  background?: string
  border?: boolean
  rounded?: boolean
  // White text (.text-white); headings and links inside turn white too
  text_white?: boolean
  // Bootstrap .shadow
  shadow?: boolean
  // Fills its column's height (.h-100), so boxes in a row line up
  full_height?: boolean
  text_align?: '' | 'center' | 'right'
}>()

const aligns: Record<string, string> = { center: 'text-center', right: 'text-right' }
// On a dark background, or with white text, headings inside are white (MocaRichText, MocaHeading read it)
const lightText = computed(() => props.text_white || mocaDarkBg.includes(props.background ?? ''))
</script>

<template>
  <div
    :style="lightText ? { '--moca-heading': '#fff' } : undefined"
    :class="[
      mocaSpace('mt', margin_top),
      mocaSpace('mb', margin_bottom),
      mocaSpace('p', padding),
      mocaSpace('py', padding_y),
      mocaBg[background ?? ''],
      border && 'border border-usu-gray-300',
      rounded && 'rounded',
      shadow && 'shadow-[0_.5rem_1rem_rgba(0,0,0,.15)]',
      text_white && 'text-white [&_a]:text-white! [&_:is(h1,h2,h3,h4,h5,h6)]:text-white!',
      full_height && 'h-full',
      aligns[text_align ?? ''],
    ]"
  >
    <slot name="content" />
  </div>
</template>
