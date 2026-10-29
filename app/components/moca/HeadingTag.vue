<script setup lang="ts">
// Renders a plain heading element (h1-h6) from a level prop, keeping every attribute (the id for in-page
// anchors, the editor preview's cmsuid).
defineOptions({ inheritAttrs: false })
const props = defineProps<{ tag: string }>()
const attrs = useAttrs()
const slots = useSlots()
// Attributes are passed on explicitly: a functional component only inherits class, style and listeners
const Heading = () => h(props.tag, attrs, slots.default?.())
</script>

<template>
  <Heading />
</template>
