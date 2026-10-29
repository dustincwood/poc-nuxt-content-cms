import type { PropType, Slot, SlotsType } from 'vue'

// The components in a slot as data (cmsSlotChildren), for a parent that lays its children out itself:
// <CmsChildren v-slot="{ children }" :use="$slots.panels">...</CmsChildren>
// `filter` keeps only some of them, e.g. panels that have content.
export default defineComponent({
  props: {
    use: Function as PropType<Slot>,
    filter: Function as PropType<(child: CmsChild) => unknown>,
  },
  slots: Object as SlotsType<{ default: { children: CmsChild[] } }>,
  setup: (props, { slots }) => () => {
    const children = cmsSlotChildren(props.use)
    return slots.default?.({ children: props.filter ? children.filter(props.filter) : children })
  },
})
