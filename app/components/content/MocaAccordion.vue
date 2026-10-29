<script setup lang="ts">
// Vue port of component-transform (accordion-and-tabs-up-to-15-bs4.md).
// display: accordion (default), tabs, or pills. Its #panels slot holds moca-accordion-panel components,
// laid out here from their title prop and #content slot.
// Tabs collapse into an accordion below 992px, as .tab-content-responsive does on usu.edu.
defineProps<{
  display?: 'accordion' | 'tabs' | 'pills'
}>()

const id = useId()

// Accordion shows panels with a title or content; tabs and pills only panels with content
const shownInAccordion = (p: CmsChild) => p.props.title || p.slots.content
const hasContent = (p: CmsChild) => p.slots.content

// Accordion: all closed, one open at a time (data-parent)
const openPanel = ref<string | null>(null)
// Tabs and pills: the first is active until one is chosen. Below 992px, tab panes are an accordion with
// the first open (undefined) until one is toggled.
const activePanel = ref<string | null>(null)
const openTabPanel = ref<string | null | undefined>(undefined)

// Falls back to the first panel if the active one is removed while editing
const active = (panels: CmsChild[]) => panels.some(p => p.key === activePanel.value) ? activePanel.value : panels[0]?.key
const tabOpen = (panels: CmsChild[], key: string) => (openTabPanel.value === undefined ? panels[0]?.key : openTabPanel.value) === key

function toggleAccordion(key: string) {
  openPanel.value = openPanel.value === key ? null : key
}

function toggleTab(panels: CmsChild[], key: string) {
  openTabPanel.value = tabOpen(panels, key) ? null : key
}

const collapseClass = (open: boolean) => [
  'grid transition-[grid-template-rows] duration-[350ms] ease-in-out',
  open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
]

// .accordion .card-header .btn and .tab-content .card .btn[data-toggle=collapse]
const headerButton = 'flex grow w-full justify-between gap-2 px-3 py-1.5 text-left font-condensed font-normal text-[1.1rem] leading-normal text-usu-navy cursor-pointer focus:underline focus:outline-none aria-expanded:focus:no-underline'
</script>

<template>
  <!-- Tabs -->
  <CmsChildren v-if="display === 'tabs'" v-slot="{ children: panels }" :use="$slots.panels" :filter="hasContent">
    <div>
      <ul class="hidden bs-lg:flex flex-wrap border-b border-usu-gray-300" role="tablist">
        <li v-for="(panel, i) in panels" :key="panel.key" class="-mb-px" role="presentation">
          <button
            :id="`${id}-tab-${i}`"
            type="button"
            role="tab"
            :aria-selected="active(panels) === panel.key"
            :aria-controls="`${id}-pane-${i}`"
            :class="[
              'block px-4 py-2 border rounded-t font-condensed text-[1.1rem] cursor-pointer',
              active(panels) === panel.key
                ? 'text-usu-gray-darker bg-white border-usu-gray-300 border-b-white'
                : 'text-usu-info border-transparent hover:bg-usu-gray-200 hover:text-usu-slate hover:border-usu-gray-200 hover:border-b-usu-gray-300 focus:bg-usu-gray-200 focus:text-usu-slate',
            ]"
            @click="activePanel = panel.key"
          >
            {{ panel.props.title || `Tab Title ${i + 1}` }}
          </button>
        </li>
      </ul>

      <div>
        <div
          v-for="(panel, i) in panels"
          :id="`${id}-pane-${i}`"
          :key="panel.key"
          :cmsuid="panel.props.cmsuid"
          role="tabpanel"
          :aria-labelledby="`${id}-tab-${i}`"
          :class="[
            'relative flex flex-col bg-white border border-black/[.125] rounded mb-[5px] bs-lg:mb-0 bs-lg:border-t-0',
            active(panels) !== panel.key && 'bs-lg:hidden',
          ]"
        >
          <div class="bs-lg:hidden border-b border-black/[.125]">
            <div class="m-0">
              <button
                type="button"
                :class="headerButton"
                :aria-expanded="tabOpen(panels, panel.key)"
                @click="toggleTab(panels, panel.key)"
              >
                {{ panel.props.title || `Tab Title ${i + 1}` }}
                <UIcon
                  name="i-fa6-solid-caret-down"
                  :class="['self-center shrink-0 size-[1em]', tabOpen(panels, panel.key) && 'rotate-180']"
                />
              </button>
            </div>
          </div>
          <div :class="[collapseClass(tabOpen(panels, panel.key)), 'bs-lg:grid-rows-[1fr]', !tabOpen(panels, panel.key) && 'max-bs-lg:invisible']">
            <div class="overflow-hidden">
              <MocaRichText class="p-5"><CmsSlot :use="panel.slots.content" /></MocaRichText>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CmsChildren>

  <!-- Pills -->
  <CmsChildren v-else-if="display === 'pills'" v-slot="{ children: panels }" :use="$slots.panels" :filter="hasContent">
    <div class="flex flex-wrap -mx-[15px]">
      <div class="w-full px-[15px] bs-lg:w-1/4">
        <div class="flex flex-col font-condensed text-[1.1rem]" role="tablist" aria-orientation="vertical">
          <button
            v-for="(panel, i) in panels"
            :id="`${id}-pill-${i}`"
            :key="panel.key"
            type="button"
            role="tab"
            :aria-selected="active(panels) === panel.key"
            :aria-controls="`${id}-pill-pane-${i}`"
            :class="[
              'block px-4 py-2 rounded text-left cursor-pointer',
              active(panels) === panel.key ? 'text-white bg-usu-blue-dark' : 'text-usu-info hover:text-usu-info-dark',
            ]"
            @click="activePanel = panel.key"
          >
            {{ panel.props.title || `Pill Title ${i + 1}` }}
          </button>
        </div>
      </div>
      <div class="w-full px-[15px] bs-lg:w-3/4">
        <template v-for="(panel, i) in panels" :key="panel.key">
          <div
            v-if="active(panels) === panel.key"
            :id="`${id}-pill-pane-${i}`"
            :cmsuid="panel.props.cmsuid"
            role="tabpanel"
            :aria-labelledby="`${id}-pill-${i}`"
          >
            <MocaRichText><CmsSlot :use="panel.slots.content" /></MocaRichText>
          </div>
        </template>
      </div>
    </div>
  </CmsChildren>

  <!-- Accordion (.accordion.accordion-caret) -->
  <CmsChildren v-else v-slot="{ children: panels }" :use="$slots.panels" :filter="shownInAccordion">
    <div>
      <div
        v-for="(panel, i) in panels"
        :key="panel.key"
        :cmsuid="panel.props.cmsuid"
        class="relative flex flex-col my-4 bg-white overflow-hidden"
      >
        <div class="p-1 bg-usu-gray-200">
          <h2 class="m-0">
            <button
              :id="`${id}-heading-${i}`"
              type="button"
              :class="[headerButton, 'hover:text-usu-info focus:text-usu-info']"
              :aria-expanded="openPanel === panel.key"
              :aria-controls="`${id}-collapse-${i}`"
              @click="toggleAccordion(panel.key)"
            >
              {{ panel.props.title || `Accordion Title ${i + 1}` }}
              <UIcon
                name="i-fa6-solid-caret-down"
                :class="['self-center shrink-0 size-[1em] text-usu-gray-dark transition-transform duration-500', openPanel === panel.key && 'rotate-180']"
              />
            </button>
          </h2>
        </div>
        <div
          :id="`${id}-collapse-${i}`"
          role="region"
          :aria-labelledby="`${id}-heading-${i}`"
          :inert="openPanel !== panel.key"
          :class="collapseClass(openPanel === panel.key)"
        >
          <div class="overflow-hidden">
            <MocaRichText v-if="panel.slots.content" class="p-5 bg-usu-gray-100"><CmsSlot :use="panel.slots.content" /></MocaRichText>
          </div>
        </div>
      </div>
    </div>
  </CmsChildren>
</template>
