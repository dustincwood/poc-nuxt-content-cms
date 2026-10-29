<script setup lang="ts">
// Vue port of component-image-with-text-overlay (image-with-text-overlay-all-sites.md)
defineProps<{
  image?: string
  image_alt?: string
  link?: string
  link_target?: string
  text?: string
  // over: caption bar on the image; top/bottom: card header above/below it
  text_location?: 'over' | 'top' | 'bottom'
  text_color?: 'default' | 'primary' | 'dark'
}>()

const headerColors: Record<string, string> = {
  primary: 'bg-usu-primary text-white!',
  dark: 'bg-usu-dark text-white!',
}

// .onHoverFloat: usu.edu adds .shadow-lg on hover, which also scales it up
const hoverFloat = 'relative overflow-hidden transition-all duration-150 ease-in-out hover:z-50 hover:scale-105 hover:shadow-[0_1rem_3rem_rgba(0,0,0,.175)]'
</script>

<template>
  <div v-if="(text_location ?? 'over') === 'over'">
    <!-- .img-content-overlay.ratio-16by9 -->
    <NuxtLink
      :to="link || undefined"
      :target="link_target || undefined"
      :class="[hoverFloat, 'block w-full pb-[56.26%] bg-cover bg-center']"
      :style="{ backgroundImage: `url('${image}')` }"
    >
      <div class="absolute inset-x-0 bottom-4 p-4 bg-usu-navy/80 text-white">
        <div :class="[mocaHeading.h3, 'my-0 text-white!']">{{ text }}</div>
      </div>
    </NuxtLink>
  </div>

  <div v-else :class="[mocaCard.base, hoverFloat]">
    <div v-if="text_location === 'top'" :class="[mocaCard.header, mocaHeading.h4, headerColors[text_color ?? '']]">
      {{ text }}
    </div>
    <!-- .stretched-link makes the whole card clickable -->
    <NuxtLink :to="link || undefined" :target="link_target || undefined" class="after:absolute after:inset-0 after:z-[1]">
      <img :src="image" :alt="image_alt ?? ''" class="block mx-auto max-w-full">
    </NuxtLink>
    <div v-if="text_location === 'bottom'" :class="[mocaCard.header, mocaHeading.h4, headerColors[text_color ?? '']]">
      {{ text }}
    </div>
  </div>
</template>
