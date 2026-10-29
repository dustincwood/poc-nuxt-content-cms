// Messages between the editor (pages/admin/edit.vue) and its preview (pages/admin/preview.vue): to the
// preview iframe by postMessage, and to preview tabs opened separately by a BroadcastChannel.
export type CmsPreviewMessage =
  // The draft as it is now, saved or not
  | { type: 'cms:draft', id: string, path: string, draft: CmsPageDoc }
  // The editor's selection and hover, to outline in the preview; from the preview, a click or hover there
  | { type: 'cms:select', uid: string | null }
  | { type: 'cms:hover', uid: string | null }
  // A shortcut pressed while the preview has focus, for the editor to handle
  | { type: 'cms:key', key: string, ctrlKey: boolean, metaKey: boolean, shiftKey: boolean, altKey: boolean }
  // The preview has loaded and wants the draft
  | { type: 'cms:ready' }

export const cmsPreviewChannel = (id: string) => new BroadcastChannel(`cms-preview:${id}`)

export const isCmsPreviewMessage = (data: unknown): data is CmsPreviewMessage =>
  !!data && typeof data === 'object' && typeof (data as any).type === 'string' && (data as any).type.startsWith('cms:')
