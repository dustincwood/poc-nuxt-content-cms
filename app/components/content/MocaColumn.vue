<script setup lang="ts">
// Bootstrap 4 column inside a moca-row. Widths are per breakpoint, like col-12 col-md col-lg-4:
// a number of twelfths, auto (.col, equal share) or content (.col-auto). Empty inherits the smaller one.
const props = defineProps<{
  width?: MocaOption
  width_sm?: MocaOption
  width_md?: MocaOption
  width_lg?: MocaOption
  width_xl?: MocaOption
  // .order-* and .order-lg-*
  order?: MocaOption
  order_lg?: MocaOption
  // Bootstrap spacers 0-5 (mt-*, mb-*)
  margin_top?: MocaOption
  margin_bottom?: MocaOption
  // .d-flex: lets a card inside fill the column's height, so cards in a row line up
  stretch?: boolean
  // lg-up: only from 992px (.d-none .d-lg-block); below-lg: only under 992px (.d-lg-none)
  display?: '' | 'lg-up' | 'below-lg'
  // .align-self-*
  align_self?: '' | 'start' | 'center' | 'end'
  text_align?: '' | 'center'
  // .mx-n5 with z-index 3: overlaps its neighbors, e.g. arrows between step cards
  overlap?: boolean
  // A Bootstrap background class (mocaBg), e.g. bg-light for a shaded half of a bordered row
  background?: string
  // Bootstrap spacer 0-5 on all sides (.p-*), replacing the 15px gutter
  padding?: MocaOption
}>()

const displays: Record<string, string> = { 'lg-up': 'hidden bs-lg:block', 'below-lg': 'bs-lg:hidden' }
const alignSelf: Record<string, string> = { start: 'self-start', center: 'self-center', end: 'self-end' }

const orders: Record<string, Record<string, string>> = {
  '': { first: 'order-first', last: 'order-last', 1: 'order-1', 2: 'order-2', 3: 'order-3' },
  'lg': { first: 'bs-lg:order-first', last: 'bs-lg:order-last', 1: 'bs-lg:order-1', 2: 'bs-lg:order-2', 3: 'bs-lg:order-3' },
}

const columnClass = computed(() => [
  'relative w-full',
  mocaStr(props.padding) ? mocaSpace('p', props.padding) : 'px-[15px]',
  mocaBg[props.background ?? ''],
  mocaColumnWidths['']![mocaStr(props.width)],
  mocaColumnWidths.sm![mocaStr(props.width_sm)],
  mocaColumnWidths.md![mocaStr(props.width_md)],
  mocaColumnWidths.lg![mocaStr(props.width_lg)],
  mocaColumnWidths.xl![mocaStr(props.width_xl)],
  orders['']![mocaStr(props.order)],
  orders.lg![mocaStr(props.order_lg)],
  mocaSpace('mt', props.margin_top),
  mocaSpace('mb', props.margin_bottom),
  // stretch's flex replaces display's block; a column hidden below lg stays hidden
  props.stretch ? (props.display === 'lg-up' ? 'hidden bs-lg:flex' : 'flex') : displays[props.display ?? ''],
  props.stretch && props.display === 'below-lg' && 'bs-lg:hidden',
  alignSelf[props.align_self ?? ''],
  props.text_align === 'center' && 'text-center',
  props.overlap && '-mx-12 z-3',
])
</script>

<template>
  <div :class="columnClass">
    <slot name="content" />
  </div>
</template>
