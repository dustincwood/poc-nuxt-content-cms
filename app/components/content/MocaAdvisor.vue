<script setup lang="ts">
// One advisor of a moca-advisor-finder, which reads these props as data; renders nothing on its own
defineProps<{
  name?: string
  image?: string
  image_alt?: string
  phone?: MocaOption
  email?: string
  appointment_link?: string
  locations?: string
  focus_area?: string
  last_name_range?: MocaOption
}>()
</script>

<template>
  <span hidden>{{ name }}</span>
</template>
