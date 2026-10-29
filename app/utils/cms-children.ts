import { Comment, Fragment, Text, type Slot, type VNode } from 'vue'

export interface CmsChild {
  props: Record<string, any>
  slots: Record<string, Slot | undefined>
  key: string
}

// The components in a slot as data, for parents that lay their children out themselves (accordion panels,
// steps, form fields, advisors): each child's props and its own slots, which the parent renders where it
// wants them. Call it while rendering (in the template), so the parent re-renders when the content changes.
export function cmsSlotChildren(slot?: Slot): CmsChild[] {
  const flat = (nodes: VNode[]): VNode[] => nodes.flatMap(n => n.type === Fragment ? flat(n.children as VNode[]) : [n])
  return flat(slot?.() ?? [])
    .filter(n => n.type !== Comment && n.type !== Text && typeof n.type !== 'string')
    .map((n, i) => {
      const props = { ...(n.props ?? {}) }
      return {
        props,
        slots: (n.children && typeof n.children === 'object' && !Array.isArray(n.children) ? n.children : {}) as Record<string, Slot>,
        key: String(props.cmsuid ?? i),
      }
    })
}

