<script setup lang="ts">
// Vue port of component-step-guide (step-guide.md), styles from modular.css .step-guide.
// Its #steps slot holds moca-step components, laid out here directly and numbered from 1.
const props = defineProps<{
  // h3 when the guide sits under an h2 section heading
  heading_level?: 'h2' | 'h3'
}>()

const headingTag = computed(() => props.heading_level === 'h3' ? 'h3' : 'h2')
</script>

<template>
  <CmsChildren v-slot="{ children: steps }" :use="$slots.steps">
    <div>
      <div v-for="(step, i) in steps" :key="step.key" :cmsuid="step.props.cmsuid" class="relative flex mb-8">
        <div
          class="shrink-0 size-[50px] mr-4 bg-white border-3 border-usu-line rounded-full text-center text-[1.75rem] leading-[42px] font-bold text-usu-slate"
        >
          {{ i + 1 }}
        </div>
        <div class="min-w-0 grow">
          <MocaHeadingTag :tag="headingTag" :class="[mocaHeading[headingTag], headingTag === 'h3' ? 'mb-1' : 'mb-0', mocaColors[step.props.header_color ?? '']?.text]">
            {{ step.props.header }}
          </MocaHeadingTag>
          <MocaRichText v-if="step.slots.content"><CmsSlot :use="step.slots.content" /></MocaRichText>
          <CmsSlot :use="step.slots.blocks" />
        </div>
        <!-- The connector to the next step; none after the last -->
        <div
          v-if="i < steps.length - 1"
          class="absolute left-[2px] top-[60px] -bottom-[25px] w-[25px] border-r-3 border-usu-line"
        />
      </div>
    </div>
  </CmsChildren>
</template>
