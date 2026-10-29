<script setup lang="ts">
// Vue port of component-icon-card (card-font-awesome-icon-card-bs4.md)
const props = defineProps<{
  // 'default' (white) or a Bootstrap background class: bg-primary, bg-info, ...
  color?: string
  icon?: string
  // Font Awesome fa-{n}x multiplier
  icon_size?: MocaOption
  sr_only?: string
  header?: string
  body?: string
  // Makes the body a link that covers the whole card (.stretched-link), e.g. a map, tel: or mailto: link
  body_link?: string
  body_link_target?: string
  button_text?: string
  button_link?: string
  button_link_target?: string
}>()

const colored = computed(() => !!props.color && props.color !== 'default')
const cardColor = computed(() => colored.value ? mocaBg[props.color!] : '')
// .text-white / .text-primary are !important in Bootstrap, so they beat the heading color
const textColor = computed(() => colored.value ? 'text-white!' : 'text-usu-primary!')
const iconSize = computed(() => Number(props.icon_size) > 0 ? `${Number(props.icon_size)}em` : undefined)
</script>

<template>
  <div :class="[mocaCard.base, cardColor, 'text-center']">
    <div :class="[mocaCard.body, textColor]">
      <span class="my-6" :style="{ fontSize: iconSize }"><MocaFaIcon :icon="icon" /></span>
      <span v-if="sr_only" class="sr-only">{{ sr_only }}</span>
      <h2 v-if="header" :class="[mocaHeading.h3, 'my-4', textColor]">{{ header }}</h2>
      <a
        v-if="body && body_link"
        :href="body_link"
        :target="body_link_target || undefined"
        :class="[
          'text-xl font-light text-inherit after:absolute after:inset-0 after:z-1 after:content-[\'\']',
          // usu.edu underlines content links, but not phone numbers
          !body_link.startsWith('tel:') && 'underline',
        ]"
      >{{ body }}</a>
      <p v-else-if="body" class="mb-4 text-xl font-light">{{ body }}</p>
    </div>

    <div v-if="button_text" :class="['px-5 pt-3 pb-6 rounded-b-[calc(.25rem-1px)]', cardColor]">
      <NuxtLink
        :to="button_link || undefined"
        :target="button_link_target || undefined"
        :class="mocaButtonClass(colored ? 'btn-outline-secondary' : 'btn-outline-dark')"
      >
        {{ button_text }}
      </NuxtLink>
    </div>
  </div>
</template>
