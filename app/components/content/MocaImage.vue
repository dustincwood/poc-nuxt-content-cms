<script setup lang="ts">
// An image on its own, as hand-written on usu.edu: <img class="img-fluid rounded-circle w-100" ...>,
// or a paragraph holding only an image: <p class="text-center"><img width="342" ...></p>
const props = defineProps<{
  image?: string
  image_alt?: string
  // Bootstrap image class: rounded, rounded-circle, img-thumbnail (mocaImageStyles)
  image_style?: '' | 'rounded' | 'rounded-circle' | 'img-thumbnail'
  // Stretch to the column's width (.w-100); otherwise its own width, never wider than the column
  full_width?: boolean
  // Fill its column's height, cropped to fit (.h-100 with object-fit: cover)
  fill_height?: boolean
  // Display width in pixels (the img width attribute); empty keeps the image's own
  width?: MocaOption
  align?: '' | 'center' | 'right'
  // Space below as a Bootstrap spacer 0-5
  margin_bottom?: MocaOption
}>()

const aligns: Record<string, string> = { center: 'mx-auto', right: 'ml-auto' }
const width = computed(() => Number(props.width) > 0 ? `${Number(props.width)}px` : undefined)
</script>

<template>
  <img
    v-if="image"
    :src="image"
    :alt="image_alt ?? ''"
    :style="{ width }"
    :class="[
      'block max-w-full h-auto',
      full_width && 'w-full',
      fill_height && 'w-full h-full object-cover',
      aligns[align ?? ''],
      mocaImageStyles[image_style ?? ''],
      mocaSpace('mb', margin_bottom),
    ]"
  >
</template>
