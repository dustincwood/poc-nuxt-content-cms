<script setup lang="ts">
// One field of a moca-form, which reads these props and renders the field itself. Written outside a form,
// it shows as a disabled preview of the field.
defineProps<{
  label?: string
  name?: string
  type?: 'text' | 'email' | 'tel' | 'textarea'
  required?: boolean
  placeholder?: string
}>()
</script>

<template>
  <label class="block mb-4">
    <span v-if="required" class="text-usu-danger">*</span>{{ label }}
    <input disabled :type="type || 'text'" :placeholder="placeholder" class="block w-full px-3 py-1.5 border border-[#ced4da] rounded">
  </label>
</template>
