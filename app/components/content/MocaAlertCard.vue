<script setup lang="ts">
// Vue port of component-alert-card (card-alert-bs4.md)
const props = defineProps<{
  color?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'dark'
  header?: string
  button_text?: string
  button_link?: string
  button_link_target?: string
}>()

const color = computed(() => props.color || 'primary')

// .bg-{color} on the header; the button uses .btn-{color}
const headerColors: Record<string, string> = {
  primary: 'bg-usu-primary',
  info: 'bg-usu-info',
  success: 'bg-usu-success',
  warning: 'bg-usu-warning',
  danger: 'bg-usu-danger',
  dark: 'bg-usu-dark',
}
</script>

<template>
  <div :class="[mocaCard.base, 'mb-4']">
    <!-- .text-bold and .text-white are !important in Bootstrap, so they beat the heading styles -->
    <div :class="[mocaCard.header, mocaHeading.h4, 'font-bold! text-white!', headerColors[color]]">{{ header }}</div>
    <div :class="mocaCard.body">
      <MocaRichText v-if="$slots.body"><slot name="body" /></MocaRichText>
    </div>
    <div v-if="button_text" :class="mocaCard.footer">
      <NuxtLink
        :to="button_link || undefined"
        :target="button_link_target || undefined"
        :class="mocaButtonClass(`btn-${color}`)"
      >
        {{ button_text }}
      </NuxtLink>
    </div>
  </div>
</template>
