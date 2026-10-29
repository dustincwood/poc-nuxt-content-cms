<script setup lang="ts">
// Vue port of component-contact-block (z_XSL_staging/_resources/xsl/_shared/components.xsl)
const props = defineProps<{
  name?: string
  // Job title or role, shown under the name
  description?: string
  // horizontal: photo in a third-width column beside the details; vertical: photo above
  orientation?: 'horizontal' | 'vertical'
  image?: string
  image_alt?: string
  image_style?: '' | 'rounded' | 'rounded-circle' | 'img-thumbnail'
  location?: string
  phone?: MocaOption
  fax?: MocaOption
  email?: string
  address_name?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip?: MocaOption
  // Appointment link; shown as a "Schedule an Appointment" button
  schedule?: string
  schedule_target?: string
}>()

const vertical = computed(() => props.orientation === 'vertical')
const hasAddress = computed(() => !!(props.address_line1 || props.address_line2 || props.city || props.state || mocaStr(props.zip)))

// Content links are underlined on usu.edu (main#content a)
const link = 'text-usu-info underline hover:text-usu-info-dark'
</script>

<template>
  <div>
    <div v-if="name" :class="[mocaHeading.h3, 'mb-2']">{{ name }}</div>
    <p v-if="description" class="mb-4">{{ description }}</p>

    <div class="flex flex-wrap -mx-[15px]">
      <div v-if="image" :class="vertical ? 'p-4' : 'w-full px-[15px] pb-2 bs-sm:w-1/3'">
        <img
          :src="image"
          :alt="image_alt ?? ''"
          :class="['max-w-full h-auto', mocaImageStyles[image_style ?? '']]"
        >
      </div>
      <div :class="vertical ? 'w-full px-[15px] bs-sm:w-2/3' : 'flex-1 basis-0 max-w-full px-[15px]'">
        <p class="mb-4">
          <template v-if="location"><strong>Office Location: </strong>{{ location }}<br></template>
          <template v-if="phone"><strong>Phone: </strong><a :href="`tel:${phone}`" :class="link">{{ phone }}</a><br></template>
          <template v-if="fax"><strong>Fax: </strong><a :href="`tel:${fax}`" :class="link">{{ fax }}</a><br></template>
          <template v-if="email"><strong>Email: </strong><a :href="`mailto:${email}`" :class="link">{{ email }}</a></template>
        </p>

        <p v-if="hasAddress" class="mb-4">
          <strong>Mailing Address:</strong><br>
          <template v-if="address_name">{{ address_name }}<br></template>
          <template v-if="address_line1">{{ address_line1 }}<br></template>
          <template v-if="address_line2">{{ address_line2 }}<br></template>
          {{ city }}{{ city && state ? ', ' : '' }}{{ state }}{{ city || state ? ' ' : '' }}
          <template v-if="zip">{{ zip }}<br></template>
        </p>

        <NuxtLink v-if="schedule" :to="schedule" :target="schedule_target || undefined" :class="[mocaButtonClass('btn-info'), 'my-2']">
          Schedule an Appointment
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
