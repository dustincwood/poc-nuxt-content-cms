<script setup lang="ts">
// Vue port of component-card-block (card-bs4.md)
const props = defineProps<{
  // Bootstrap background class for the header: bg-primary, bg-info, bg-gray-darker, ...
  color?: string
  header?: string
  image?: string
  image_alt?: string
  image_location?: 'card-img-top' | 'card-img-bottom'
  image_link?: string
  image_link_target?: string
  // Bootstrap .shadow
  shadow?: boolean
}>()

const slots = useSlots()
const imageOnTop = computed(() => props.image_location !== 'card-img-bottom')

const headerClass = computed(() => [
  mocaCard.header,
  mocaHeading.h4,
  mocaBg[props.color ?? ''],
  // Dark headers get white bold text (Bootstrap's !important utilities)
  ['bg-primary', 'bg-gray-darker', 'bg-info'].includes(props.color ?? '') && 'text-white! font-bold!',
  // A header-only card drops the header's bottom border
  !slots.body && !slots.button && 'border-b-0! mb-1!',
])

const imageClass = computed(() => [
  'block w-full h-auto max-w-full shrink-0',
  imageOnTop.value ? 'rounded-t-[calc(.25rem-1px)]' : 'rounded-b-[calc(.25rem-1px)]',
])
</script>

<template>
  <div
    v-if="header || $slots.body || image"
    :class="[mocaCard.base, shadow && 'shadow-[0_.5rem_1rem_rgba(0,0,0,.15)]']"
  >
    <template v-if="image && imageOnTop">
      <NuxtLink v-if="image_link" :to="image_link" :target="image_link_target || undefined">
        <img :src="image" :alt="image_alt ?? ''" :class="imageClass">
      </NuxtLink>
      <img v-else :src="image" :alt="image_alt ?? ''" :class="imageClass">
    </template>

    <div v-if="header" :class="headerClass">{{ header }}</div>

    <template v-if="image && !imageOnTop">
      <NuxtLink v-if="image_link" :to="image_link" :target="image_link_target || undefined">
        <img :src="image" :alt="image_alt ?? ''" :class="imageClass">
      </NuxtLink>
      <img v-else :src="image" :alt="image_alt ?? ''" :class="imageClass">
    </template>

    <!-- Rendered when there is a button too, so cards in a row stay the same height -->
    <div v-if="$slots.body || $slots.button" :class="mocaCard.body">
      <MocaRichText v-if="$slots.body"><slot name="body" /></MocaRichText>
    </div>

    <!-- .nav-card footer: no top border, button aligned right -->
    <div v-if="$slots.button" class="px-5 py-3 flex flex-wrap justify-end rounded-b-[calc(.25rem-1px)]">
      <slot name="button" />
    </div>
  </div>
</template>
