<script setup lang="ts">
// Vue port of component-font-awesome (font-awesome-icon-bs4.md)
const props = defineProps<{
  icon?: string
  link?: string
  link_target?: string
  // Link title; "External Link" when empty
  link_title?: string
  sr_only?: string
  // fa-{n}x multiplier; overrides a size class in icon
  size?: MocaOption
}>()

const title = computed(() => props.link_title || 'External Link')
</script>

<template>
  <NuxtLink
    v-if="link"
    :to="link"
    :target="link_target || undefined"
    :title="title"
    :aria-label="title"
    class="text-usu-info hover:text-usu-info-dark"
  >
    <MocaFaIcon :icon="icon" :size="mocaStr(size)" />
  </NuxtLink>
  <span v-else>
    <MocaFaIcon :icon="icon" :size="mocaStr(size)" />
    <span v-if="sr_only" class="sr-only">{{ sr_only }}</span>
  </span>
</template>
