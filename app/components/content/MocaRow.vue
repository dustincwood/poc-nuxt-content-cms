<script setup lang="ts">
// Bootstrap 4 .row: a wrapping flex row of moca-column blocks with 30px gutters
defineProps<{
  // .justify-content-*
  justify?: '' | 'start' | 'center' | 'end' | 'between' | 'around'
  // .align-items-*
  align?: '' | 'start' | 'center' | 'end'
  // Bootstrap spacer 0-5 above and below (.py-*)
  padding_y?: MocaOption
  // .border / .rounded around the row, e.g. a two-column comparison panel
  border?: boolean
  rounded?: boolean
}>()

const justifyClasses: Record<string, string> = {
  start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around',
}
const alignClasses: Record<string, string> = { start: 'items-start', center: 'items-center', end: 'items-end' }
</script>

<template>
  <div :class="['flex flex-wrap -mx-[15px]', justifyClasses[justify ?? ''], alignClasses[align ?? ''], mocaSpace('py', padding_y), border && 'border border-usu-gray-300', rounded && 'rounded overflow-hidden']">
    <slot name="columns" />
  </div>
</template>
