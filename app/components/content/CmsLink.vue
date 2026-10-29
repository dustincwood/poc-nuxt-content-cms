<script setup lang="ts">
// Links in markdown (mapped from <a> in nuxt.config's mdc.components): site paths navigate client-side
defineProps<{ href?: string, target?: string }>()
</script>

<template>
  <NuxtLink :to="href" :target="target"><slot /></NuxtLink>
</template>
