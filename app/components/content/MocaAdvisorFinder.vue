<script setup lang="ts">
// Port of usu.edu's "Find Your Advisor" (advising/_resources/scripts/advising.js), its advisors in the
// #advisors slot (moca-advisor components, read here as data).
// Students pick a location; a location with several advisors then asks for a focus area (when any of
// them has one) or a last-name range; the first matching advisor shows. One focus area shows a list of
// advisors (#undecided) instead.
type Advisor = {
  cmsuid?: string
  name?: string
  image?: string
  image_alt?: string
  phone?: MocaOption
  email?: string
  appointment_link?: string
  // Comma-separated entries of the finder's locations
  locations?: string
  focus_area?: string
  last_name_range?: MocaOption
}

const props = defineProps<{
  location_label?: string
  // One per line
  locations?: string
  focus_area_label?: string
  focus_areas?: string
  last_name_label?: string
  undecided_option?: string
  undecided_title?: string
  error_message?: string
  button_text?: string
}>()

const uid = useId()
const lines = (text?: string) => (text ?? '').split('\n').map(s => s.trim()).filter(Boolean)
const same = (a?: MocaOption, b?: MocaOption) => mocaStr(a).trim().toLowerCase() === mocaStr(b).trim().toLowerCase()

const location = ref('')
const focusArea = ref('')
const lastName = ref('')
watch(location, () => { focusArea.value = ''; lastName.value = '' })
watch(focusArea, () => { lastName.value = '' })

// Everything the choices so far decide, from the advisors in the slot (read while rendering)
function finder(all: Advisor[]) {
  const atLocation = all.filter(a => (a.locations ?? '').split(',').some(l => same(l, location.value)))
  // Several advisors here, and they differ by focus area
  const asksFocusArea = atLocation.length > 1 && atLocation.some(a => a.focus_area?.trim())
  const undecided = asksFocusArea && !!focusArea.value && same(focusArea.value, props.undecided_option)
  const inFocusArea = asksFocusArea ? atLocation.filter(a => same(a.focus_area, focusArea.value)) : atLocation
  // Still several: they differ by last name
  const asksLastName = !undecided && inFocusArea.length > 1 && (!asksFocusArea || !!focusArea.value)
  const lastNameRanges = [...new Set(inFocusArea.map(a => mocaStr(a.last_name_range).trim()).filter(Boolean))].sort()

  // The advisors the choices narrow down to, or null while a choice is still missing
  let matches: Advisor[] | null = inFocusArea
  if (!location.value || undecided) matches = null
  else if (asksFocusArea && !focusArea.value) matches = null
  else if (asksLastName) matches = lastName.value ? inFocusArea.filter(a => same(a.last_name_range, lastName.value)) : null

  return { asksFocusArea, asksLastName, lastNameRanges, undecided, matches, advisor: matches?.[0] }
}

// Location | Focus area, then the last-name range on its own line, as on usu.edu
const advisorTitle = computed(() => [location.value, focusArea.value].filter(Boolean).join(' | '))

// Bootstrap 4 .form-control
const select = 'block w-full h-[calc(1.5em+.75rem+2px)] px-3 py-1.5 text-base leading-normal text-[#495057] bg-white border border-[#ced4da] rounded focus:border-[#80bdff] focus:outline-0 focus:shadow-[0_0_0_.2rem_rgba(0,123,255,.25)]'
const label = [mocaHeading.h4, 'inline-block mb-2 font-bold!', mocaColors['bright-light']!.text]
const link = 'text-usu-info underline hover:text-usu-info-dark'
// .form-group.col-lg-4
const field = 'w-full bs-lg:basis-[33.333333%] bs-lg:max-w-[33.333333%] grow-0 shrink-0 px-[15px] mb-4'
// .card.my-1 > .card-body > p.m-0, one per paragraph of the undecided list
const cards = '[&_p]:my-1! [&_p]:p-5 [&_p]:bg-white [&_p]:border [&_p]:border-[rgba(0,0,0,.125)] [&_p]:rounded'
</script>

<template>
  <CmsChildren v-slot="{ children }" :use="$slots.advisors">
    <!-- One finder() result per render, shared by everything below -->
    <div v-for="f in [finder(children.map(c => c.props as Advisor))]" :key="0">
      <form class="flex flex-wrap -mx-[15px]" @submit.prevent>
        <div :class="field">
          <label :class="label" :for="`location-${uid}`">{{ location_label }}</label>
          <select :id="`location-${uid}`" v-model="location" :class="select">
            <option disabled value="">Choose...</option>
            <option v-for="l in lines(locations)" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
        <div v-if="f.asksFocusArea" :class="field">
          <label :class="label" :for="`focus-${uid}`">{{ focus_area_label }}</label>
          <select :id="`focus-${uid}`" v-model="focusArea" :class="select">
            <option disabled value="">Choose...</option>
            <option v-for="a in lines(focus_areas)" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div v-if="f.asksLastName" :class="field">
          <label :class="label" :for="`last-${uid}`">{{ last_name_label }}</label>
          <select :id="`last-${uid}`" v-model="lastName" :class="select">
            <option disabled value="">Choose...</option>
            <option v-for="r in f.lastNameRanges" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
      </form>

      <div class="flex justify-center -mx-[15px]" aria-live="polite">
        <div class="w-full bs-lg:basis-[50%] bs-lg:max-w-[50%] px-[15px]">
          <div v-if="f.advisor" :cmsuid="f.advisor.cmsuid" class="flex mt-6 -mx-[15px]">
            <div class="basis-[41.666667%] grow-0 shrink-0 max-w-[41.666667%] px-[15px]">
              <!-- A photo that fails to load leaves the space blank, as on usu.edu, instead of showing its alt text -->
              <img
                v-if="f.advisor.image"
                :key="f.advisor.image"
                :src="f.advisor.image"
                :alt="f.advisor.image_alt || f.advisor.name || ''"
                class="block w-full h-auto mb-4"
                @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"
              >
            </div>
            <div class="basis-[58.333333%] grow-0 shrink-0 max-w-[58.333333%] px-[15px] wrap-anywhere">
              <h4 :class="[mocaHeading.h4, 'mt-4 mb-0']">{{ f.advisor.name }}</h4>
              <p class="mb-4">{{ advisorTitle }}<template v-if="lastName"><br>{{ lastName }}</template></p>
              <p v-if="f.advisor.phone || f.advisor.email" class="mb-4">
                <!-- Phone links keep the text color on usu.edu -->
                <template v-if="f.advisor.phone"><a :href="`tel:${f.advisor.phone}`">{{ f.advisor.phone }}</a><br></template>
                <a v-if="f.advisor.email" :href="`mailto:${f.advisor.email}`" :class="link">{{ f.advisor.email }}</a>
              </p>
              <p v-if="f.advisor.appointment_link" class="mb-4">
                <a :href="f.advisor.appointment_link" target="_blank" rel="noopener" :class="[mocaButtonClass('btn-bright-light', false, 'btn-sm'), 'mt-4']">
                  {{ button_text || 'Schedule an Appointment' }}
                </a>
              </p>
            </div>
          </div>

          <p v-else-if="f.matches" :class="[mocaHeading.h3, 'mb-2 text-center', mocaColors['bright-light']!.text]">
            {{ error_message }}
          </p>

          <div v-else-if="f.undecided" class="mt-6">
            <p :class="[mocaHeading.h3, 'mb-2 text-center']">{{ undecided_title }}</p>
            <MocaRichText v-if="$slots.undecided" :class="cards"><slot name="undecided" /></MocaRichText>
          </div>
        </div>
      </div>
    </div>
  </CmsChildren>
</template>
