<script setup lang="ts">
// A colored card whose title is the link (the whole card is clickable), as hand-written on usu.edu:
// - color-blend: <div class="card bg-info color-blend text-white onHoverFloat"> with the icon floated right
//   and text under the title
// - info: <div class="card bg-info p-3 rounded onHoverFloat"> with the icon in a narrow column on the left
const props = defineProps<{
  title?: string
  link?: string
  link_target?: string
  text?: string
  // Font Awesome classes, e.g. fa-solid fa-calendar fa-2x
  icon?: string
  icon_position?: 'right' | 'left'
  background?: 'color-blend' | 'info' | 'primary'
  title_size?: 'h3' | 'h4'
}>()

const backgrounds: Record<string, string> = {
  'color-blend': 'bg-linear-to-r from-usu-blend to-usu-slate',
  'info': 'bg-usu-info',
  'primary': 'bg-usu-primary',
}

const iconLeft = computed(() => props.icon_position === 'left')
const titleClass = computed(() => [
  mocaHeading[props.title_size || 'h3'],
  'my-0 text-white! underline',
  'after:absolute after:inset-0 after:z-1',
])
// .onHoverFloat: usu.edu adds .shadow-lg on hover, which also scales it up
const hoverFloat = 'transition-all duration-150 ease-in-out hover:z-50 hover:scale-105 hover:shadow-[0_1rem_3rem_rgba(0,0,0,.175)]'
</script>

<template>
  <div
    :class="[
      'relative flex flex-col w-full h-full overflow-hidden text-white rounded border border-black/[.125]',
      backgrounds[background ?? ''] ?? backgrounds.info,
      iconLeft ? 'justify-center p-4' : '',
      hoverFloat,
    ]"
  >
    <!-- Icon in a narrow column beside the title (.col-2 / .col-10) -->
    <div v-if="iconLeft" class="flex items-center -mx-[15px]">
      <div class="basis-[16.666667%] max-w-[16.666667%] px-[15px] text-center">
        <MocaFaIcon :icon="icon" />
      </div>
      <div class="basis-[83.333333%] max-w-[83.333333%] px-[15px]">
        <NuxtLink :to="link || undefined" :target="link_target || undefined" :class="titleClass">{{ title }}</NuxtLink>
      </div>
    </div>

    <!-- Icon floated right of the title, text below (.card-body) -->
    <div v-else class="p-5">
      <div class="float-right ml-2">
        <MocaFaIcon :icon="icon" />
      </div>
      <NuxtLink :to="link || undefined" :target="link_target || undefined" :class="titleClass">{{ title }}</NuxtLink>
      <p v-if="text" class="mt-2 mb-4">{{ text }}</p>
    </div>
  </div>
</template>
