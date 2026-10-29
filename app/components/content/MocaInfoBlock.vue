<script setup lang="ts">
// Vue port of component-thumbnail, "Info Block with Image" (z_XSL_staging/_resources/xsl/_shared/components.xsl)
const props = defineProps<{
  image?: string
  image_alt?: string
  // left: image before the text; right: image after it (on small screens too, where they stack)
  image_location?: 'left' | 'right'
  header?: string
}>()

const imageRight = computed(() => props.image_location === 'right')
// Columns are .col-lg-6; whichever comes first gets .mb-4.mb-lg-0 so stacked columns are spaced
const column = 'w-full px-[15px] bs-lg:w-1/2'
const first = 'mb-6 bs-lg:mb-0'
</script>

<template>
  <div class="py-2">
    <div class="p-2 bs-sm:p-6 bs-lg:p-12 bg-usu-gray-100 shadow-[0_.5rem_1rem_rgba(0,0,0,.15)]">
      <div class="flex flex-wrap -mx-[15px]">
        <div v-if="!imageRight" :class="[column, first, 'text-center']">
          <img v-if="image" :src="image" :alt="image_alt ?? ''" class="inline-block max-w-full h-auto">
        </div>
        <div :class="[column, imageRight && first]">
          <div v-if="header" :class="[mocaHeading.h3, 'mb-2']">{{ header }}</div>
          <MocaRichText v-if="$slots.body"><slot name="body" /></MocaRichText>
          <slot name="button" />
        </div>
        <div v-if="imageRight" :class="[column, 'text-center']">
          <img v-if="image" :src="image" :alt="image_alt ?? ''" class="inline-block max-w-full h-auto">
        </div>
      </div>
    </div>
  </div>
</template>
