<script setup lang="ts">
// A person from a directory feed (component 950, directoryHorizontal style), copied from the published feed:
// photo beside the name, title, department, phone, email, office and an appointment button.
// The feed linked the name and photo to the person's directory page; this card doesn't.
defineProps<{
  image?: string
  image_alt?: string
  name?: string
  // Job title (.h5); a line break in it starts a new line, as the feed's <br> does
  title?: string
  // Department or assignment (.h6, normal weight)
  department?: string
  phone?: MocaOption
  email?: string
  // Office location
  location?: string
  // Appointment link; shown as a "Schedule an Appointment" button
  schedule?: string
  schedule_target?: string
}>()
</script>

<template>
  <div class="flex -mx-[15px]">
    <div class="basis-[41.666667%] grow-0 shrink-0 max-w-[41.666667%] px-[15px]">
      <img
        v-if="image"
        :src="image"
        :alt="image_alt || name || ''"
        class="block max-w-full h-auto mb-2"
      >
    </div>
    <!-- .text-break: long email addresses wrap instead of widening the column -->
    <div class="basis-[58.333333%] grow-0 shrink-0 max-w-[58.333333%] px-[15px] wrap-anywhere">
      <h3 v-if="name" :class="[mocaHeading.h4, 'mt-0 mb-2 leading-none! font-bold!']">{{ name }}</h3>
      <p v-if="title" class="mb-2 font-condensed font-bold leading-[1.2] text-[1.176rem] text-usu-slate whitespace-pre-line">{{ title }}</p>
      <p v-if="department" class="mb-2 font-condensed leading-[1.2] text-base text-usu-slate">{{ department }}</p>
      <div v-if="phone">Phone: {{ phone }}</div>
      <div v-if="email">
        Email: <a :href="`mailto:${email}`" class="text-usu-info underline hover:text-usu-info-dark">{{ email }}</a>
      </div>
      <div v-if="location">Office Location: {{ location }}</div>
      <a v-if="schedule" :href="schedule" :target="schedule_target || undefined" :class="[mocaButtonClass('btn-info'), 'my-2']">
        Schedule an Appointment
      </a>
    </div>
  </div>
</template>
