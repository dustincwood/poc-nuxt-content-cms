import type { PropType, Slot } from 'vue'

// Renders a slot taken from a child (cmsSlotChildren) inside the parent's own template:
// <CmsSlot :use="child.slots.content" />
export default defineComponent({
  props: { use: Function as PropType<Slot> },
  setup: props => () => props.use?.(),
})
