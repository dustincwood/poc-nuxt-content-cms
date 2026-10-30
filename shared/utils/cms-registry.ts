// The CMS's components: what the editor offers, the fields it shows for each, and where they may nest.
// Every component here (except the nav-* ones, which only live in a page's top_nav frontmatter) is a Vue
// component in app/components/content, rendered from the markdown that shared/utils/cms-markdown.ts writes.
//
// Field kinds:
// - text, textarea, select, boolean, icon: a prop of the same name
// - link: a URL prop, plus `<key>_target` ('_blank' or empty)
// - image: a URL prop, plus `<key>_alt`
// - markdown: rich text, written as the component's `#<key>` slot
// - blocks: nested components, written as the component's `#<key>` slot. `allow` limits which; `max` how many.
//   This is how components nest: a block's blocks fields are its children in the editor's tree.

export type CmsFieldType = 'text' | 'textarea' | 'select' | 'boolean' | 'icon' | 'link' | 'image' | 'markdown' | 'blocks'

export interface CmsField {
  key: string
  type: CmsFieldType
  label?: string
  help?: string
  options?: { value: string, label: string }[]
  default?: string | boolean
  allow?: string[]
  max?: number
}

export interface CmsComponent {
  name: string
  label: string
  icon: string
  group: 'Layout' | 'Content' | 'Cards' | 'Media' | 'Interactive' | 'Navigation'
  fields: CmsField[]
  // The field whose value names an instance in the tree, e.g. a heading's text
  summary?: string
  // Only offered inside a parent whose blocks field allows it (accordion panels, columns, ...)
  childOnly?: boolean
  // Only for the page's top navigation, never the body
  nav?: boolean
}

export interface CmsBlock {
  _uid: string
  component: string
  [key: string]: unknown
}

export interface CmsPageHeader {
  site_name?: string
  site_link?: string
  parent_name?: string
  parent_link?: string
}

// draft: never published; changed: the draft (or its path) differs from what's published
export type CmsPageStatus = 'draft' | 'published' | 'changed'

// A page as the editor edits it and the database stores it (the draft and the published copy)
export interface CmsPageDoc {
  title: string
  description?: string
  header?: CmsPageHeader
  top_nav?: CmsBlock[]
  body: CmsBlock[]
}

// '|a|b' -> options '' (None), a, b
const opts = (values: string, labels: Record<string, string> = {}) =>
  values.split('|').map(value => ({ value, label: labels[value] ?? (value === '' ? 'None' : value) }))
const spacer = opts('|0|1|2|3|4|5', { '': 'Default', '0': '0', '1': '1 (.25rem)', '2': '2 (.5rem)', '3': '3 (1rem)', '4': '4 (1.5rem)', '5': '5 (3rem)' })
const colorNames = opts('|primary|blue|blue-dark|info|bright-light|success|warning|danger|dark|white', { '': 'Default' })
const bgClasses = opts('|bg-white|bg-light|bg-secondary|bg-primary|bg-info|bg-success|bg-warning|bg-danger|bg-dark|bg-gray-dark|bg-gray-darker')
const columnWidth = opts('|auto|content|1|2|3|4|5|6|7|8|9|10|11|12', { '': 'Inherit', 'auto': 'Equal share', 'content': 'Fit content' })
const imageStyle = opts('|rounded|rounded-circle|img-thumbnail')
const button: CmsField = { key: 'button', type: 'blocks', allow: ['moca-button'], max: 1 }

export const cmsComponents: CmsComponent[] = [
  // Layout
  {
    name: 'moca-container', label: 'Container', icon: 'i-lucide-square-dashed', group: 'Layout',
    fields: [
      { key: 'width', type: 'select', options: opts('default|narrow|fluid'), default: 'default' },
      { key: 'margin_y', type: 'select', label: 'Margin (top & bottom)', options: spacer },
      { key: 'padding_y', type: 'select', label: 'Padding (top & bottom)', options: spacer },
      { key: 'content', type: 'blocks' },
    ],
  },
  {
    name: 'moca-band', label: 'Band', icon: 'i-lucide-rectangle-horizontal', group: 'Layout',
    fields: [
      { key: 'background', type: 'select', options: opts('bg-primary|bg-info|bg-dark|bg-blue-dark|bg-light|bg-gray-200|bg-white'), default: 'bg-light' },
      { key: 'padding_y', type: 'select', label: 'Padding (top & bottom)', options: spacer },
      { key: 'pattern', type: 'select', options: opts('|topographic') },
      { key: 'content', type: 'blocks' },
    ],
  },
  {
    name: 'moca-row', label: 'Row', icon: 'i-lucide-columns-3', group: 'Layout',
    fields: [
      { key: 'justify', type: 'select', options: opts('|start|center|end|between|around', { '': 'Default' }) },
      { key: 'align', type: 'select', label: 'Align items', options: opts('|start|center|end', { '': 'Default' }) },
      { key: 'padding_y', type: 'select', label: 'Padding (top & bottom)', options: spacer },
      { key: 'border', type: 'boolean' },
      { key: 'rounded', type: 'boolean' },
      { key: 'columns', type: 'blocks', allow: ['moca-column'] },
    ],
  },
  {
    name: 'moca-column', label: 'Column', icon: 'i-lucide-rectangle-vertical', group: 'Layout', childOnly: true,
    fields: [
      { key: 'width', type: 'select', label: 'Width (phones)', options: columnWidth, help: 'Twelfths of the row' },
      { key: 'width_sm', type: 'select', label: 'Width from 576px', options: columnWidth },
      { key: 'width_md', type: 'select', label: 'Width from 768px', options: columnWidth },
      { key: 'width_lg', type: 'select', label: 'Width from 992px', options: columnWidth },
      { key: 'width_xl', type: 'select', label: 'Width from 1200px', options: columnWidth },
      { key: 'order', type: 'select', options: opts('|first|last|1|2|3', { '': 'Default' }) },
      { key: 'order_lg', type: 'select', label: 'Order from 992px', options: opts('|first|last|1|2|3', { '': 'Default' }) },
      { key: 'margin_top', type: 'select', options: spacer },
      { key: 'margin_bottom', type: 'select', options: spacer },
      { key: 'padding', type: 'select', help: 'Replaces the 15px gutter', options: spacer },
      { key: 'background', type: 'select', options: bgClasses },
      { key: 'display', type: 'select', options: opts('|lg-up|below-lg', { '': 'Always', 'lg-up': 'From 992px only', 'below-lg': 'Below 992px only' }) },
      { key: 'align_self', type: 'select', options: opts('|start|center|end', { '': 'Default' }) },
      { key: 'text_align', type: 'select', options: opts('|center', { '': 'Default' }) },
      { key: 'stretch', type: 'boolean', help: 'Lets a card inside fill the column height' },
      { key: 'overlap', type: 'boolean', help: 'Overlaps its neighbors, e.g. arrows between step cards' },
      { key: 'content', type: 'blocks' },
    ],
  },
  {
    name: 'moca-box', label: 'Box', icon: 'i-lucide-box', group: 'Layout',
    fields: [
      { key: 'margin_top', type: 'select', options: spacer },
      { key: 'margin_bottom', type: 'select', options: spacer },
      { key: 'padding', type: 'select', options: spacer },
      { key: 'padding_y', type: 'select', label: 'Padding (top & bottom)', options: spacer },
      { key: 'background', type: 'select', options: bgClasses },
      { key: 'text_align', type: 'select', options: opts('|center|right', { '': 'Default' }) },
      { key: 'border', type: 'boolean' },
      { key: 'rounded', type: 'boolean' },
      { key: 'text_white', type: 'boolean', label: 'White text' },
      { key: 'shadow', type: 'boolean' },
      { key: 'full_height', type: 'boolean', help: 'Fills its column, so boxes in a row line up' },
      { key: 'content', type: 'blocks' },
    ],
  },
  {
    name: 'moca-titled-box', label: 'Titled box', icon: 'i-lucide-panel-top', group: 'Layout', summary: 'title',
    fields: [
      { key: 'title', type: 'text' },
      { key: 'title_color', type: 'select', options: opts('info|primary|slate|white'), default: 'info' },
      { key: 'title_bold', type: 'boolean' },
      { key: 'border_color', type: 'select', options: opts('|bright-light|info|primary', { '': 'Gray' }) },
      { key: 'margin_top', type: 'select', options: spacer, default: '5' },
      { key: 'margin_bottom', type: 'select', options: spacer, default: '5' },
      { key: 'content', type: 'blocks' },
    ],
  },

  // Content
  {
    name: 'moca-heading', label: 'Heading', icon: 'i-lucide-heading', group: 'Content', summary: 'text',
    fields: [
      { key: 'text', type: 'text' },
      { key: 'level', type: 'select', options: opts('h1|h2|h3|h4|h5|h6'), default: 'h2' },
      { key: 'color', type: 'select', options: colorNames },
      { key: 'align', type: 'select', options: opts('|center', { '': 'Default' }) },
      { key: 'bold', type: 'boolean' },
      { key: 'rules', type: 'boolean', help: 'Thin lines left and right, from 768px up' },
      { key: 'margin_top', type: 'select', options: spacer },
      { key: 'margin_bottom', type: 'select', options: spacer },
      { key: 'anchor', type: 'text', help: 'id for in-page links (#anchor)' },
    ],
  },
  {
    name: 'moca-text', label: 'Text', icon: 'i-lucide-text', group: 'Content', summary: 'text',
    fields: [
      { key: 'text', type: 'markdown' },
      { key: 'text_style', type: 'select', label: 'Style', options: opts('|lead', { '': 'Default', 'lead': 'Lead (larger, light)' }) },
      { key: 'table_style', type: 'select', options: opts('|plain|striped', { '': 'None' }) },
      { key: 'table_head', type: 'select', options: opts('|dark|light', { '': 'Default' }) },
    ],
  },
  {
    name: 'moca-button', label: 'Button', icon: 'i-lucide-mouse-pointer-click', group: 'Content', summary: 'text',
    fields: [
      { key: 'text', type: 'text' },
      { key: 'link', type: 'link' },
      { key: 'type', type: 'select', options: opts('btn-white|btn-primary|btn-info|btn-success|btn-warning|btn-danger|btn-secondary|btn-light|btn-dark|btn-link|btn-blue|btn-bright-light|btn-green|btn-sage|btn-sand|btn-blue-dark'), default: 'btn-white' },
      { key: 'size', type: 'select', options: opts('|btn-sm|btn-lg', { '': 'Default', 'btn-sm': 'Small', 'btn-lg': 'Large' }) },
      { key: 'outline', type: 'boolean' },
      { key: 'centered', type: 'boolean' },
      { key: 'block', type: 'boolean', label: 'Full width' },
      { key: 'fill_height', type: 'boolean', help: 'Fills its column height, label centered' },
    ],
  },
  {
    name: 'moca-quote', label: 'Quote', icon: 'i-lucide-quote', group: 'Content', summary: 'quote',
    fields: [
      { key: 'quote', type: 'textarea' },
      { key: 'author', type: 'text' },
      { key: 'quote_style', type: 'select', label: 'Style', options: opts('default|bars'), default: 'default' },
    ],
  },
  {
    name: 'moca-inline-alert', label: 'Inline alert', icon: 'i-lucide-triangle-alert', group: 'Content', summary: 'title',
    fields: [
      { key: 'title', type: 'text' },
      { key: 'body', type: 'markdown' },
      { key: 'icon', type: 'icon' },
      { key: 'color', type: 'select', options: opts('default|info|success|warning|danger'), default: 'default' },
      { key: 'size', type: 'select', options: opts('Default|Large'), default: 'Default' },
    ],
  },
  {
    name: 'moca-font-awesome', label: 'Icon', icon: 'i-lucide-smile', group: 'Content', summary: 'icon',
    fields: [
      { key: 'icon', type: 'icon' },
      { key: 'size', type: 'select', options: opts('|1|2|3|4|5', { '': 'Default' }) },
      { key: 'link', type: 'link' },
      { key: 'link_title', type: 'text', help: '"External Link" when empty' },
      { key: 'sr_only', type: 'text', label: 'Screen reader text' },
    ],
  },
  {
    name: 'moca-contact-block', label: 'Contact block', icon: 'i-lucide-contact', group: 'Content', summary: 'name',
    fields: [
      { key: 'name', type: 'text' },
      { key: 'description', type: 'text', help: 'Job title or role' },
      { key: 'orientation', type: 'select', options: opts('horizontal|vertical'), default: 'horizontal' },
      { key: 'image', type: 'image' },
      { key: 'image_style', type: 'select', options: imageStyle },
      { key: 'location', type: 'text' },
      { key: 'phone', type: 'text' },
      { key: 'fax', type: 'text' },
      { key: 'email', type: 'text' },
      { key: 'address_name', type: 'text' },
      { key: 'address_line1', type: 'text' },
      { key: 'address_line2', type: 'text' },
      { key: 'city', type: 'text' },
      { key: 'state', type: 'text' },
      { key: 'zip', type: 'text' },
      { key: 'schedule', type: 'link', label: 'Appointment link' },
    ],
  },
  {
    name: 'moca-step-guide', label: 'Step guide', icon: 'i-lucide-list-ordered', group: 'Content',
    fields: [
      { key: 'heading_level', type: 'select', options: opts('h2|h3'), default: 'h2' },
      { key: 'steps', type: 'blocks', allow: ['moca-step'] },
    ],
  },
  {
    name: 'moca-step', label: 'Step', icon: 'i-lucide-footprints', group: 'Content', summary: 'header', childOnly: true,
    fields: [
      { key: 'header', type: 'text' },
      { key: 'header_color', type: 'select', options: opts('|primary|blue|info|bright-light', { '': 'Default' }) },
      { key: 'content', type: 'markdown' },
      { key: 'blocks', type: 'blocks', help: 'Shown after the text' },
    ],
  },

  // Cards
  {
    name: 'moca-card', label: 'Card', icon: 'i-lucide-credit-card', group: 'Cards', summary: 'header',
    fields: [
      { key: 'header', type: 'text' },
      { key: 'color', type: 'select', label: 'Header color', options: opts('|bg-primary|bg-info|bg-success|bg-warning|bg-danger|bg-dark|bg-gray-dark|bg-gray-darker|bg-light|bg-secondary') },
      { key: 'body', type: 'markdown' },
      { key: 'image', type: 'image' },
      { key: 'image_location', type: 'select', options: opts('card-img-top|card-img-bottom', { 'card-img-top': 'Top', 'card-img-bottom': 'Bottom' }), default: 'card-img-top' },
      { key: 'image_link', type: 'link' },
      { key: 'shadow', type: 'boolean' },
      button,
    ],
  },
  {
    name: 'moca-accent-card', label: 'Accent card', icon: 'i-lucide-square-bottom-dashed-scissors', group: 'Cards', summary: 'title',
    fields: [
      { key: 'title', type: 'text' },
      { key: 'body', type: 'markdown' },
      { key: 'color', type: 'select', options: opts('None|Primary|Info|Success|Warning|Gray'), default: 'None' },
      button,
    ],
  },
  {
    name: 'moca-alert-card', label: 'Alert card', icon: 'i-lucide-bell', group: 'Cards', summary: 'header',
    fields: [
      { key: 'header', type: 'text' },
      { key: 'body', type: 'markdown' },
      { key: 'color', type: 'select', options: opts('primary|info|success|warning|danger|dark'), default: 'primary' },
      { key: 'button_text', type: 'text' },
      { key: 'button_link', type: 'link' },
    ],
  },
  {
    name: 'moca-bar-card', label: 'Bar card', icon: 'i-lucide-panel-bottom', group: 'Cards', summary: 'title',
    fields: [
      { key: 'title', type: 'text' },
      { key: 'title_color', type: 'select', options: colorNames },
      { key: 'body', type: 'markdown' },
      { key: 'bar_color', type: 'select', options: colorNames },
    ],
  },
  {
    name: 'moca-icon-card', label: 'Icon card', icon: 'i-lucide-badge', group: 'Cards', summary: 'header',
    fields: [
      { key: 'header', type: 'text' },
      { key: 'body', type: 'textarea' },
      { key: 'body_link', type: 'link', help: 'Makes the body a link covering the card' },
      { key: 'icon', type: 'icon' },
      { key: 'icon_size', type: 'select', options: opts('1|2|3|4|5'), default: '3' },
      { key: 'sr_only', type: 'text', label: 'Screen reader text' },
      { key: 'color', type: 'select', options: opts('default|bg-primary|bg-info|bg-success|bg-warning|bg-danger|bg-dark|bg-gray-dark|bg-gray-darker|bg-light|bg-secondary'), default: 'default' },
      { key: 'button_text', type: 'text' },
      { key: 'button_link', type: 'link' },
    ],
  },
  {
    name: 'moca-nav-card', label: 'Navigation card', icon: 'i-lucide-signpost', group: 'Cards', summary: 'title',
    fields: [
      { key: 'title', type: 'text' },
      { key: 'body', type: 'markdown' },
      { key: 'color', type: 'select', options: opts('None|Primary|Info'), default: 'None' },
      button,
    ],
  },
  {
    name: 'moca-link-card', label: 'Link card', icon: 'i-lucide-link', group: 'Cards', summary: 'title',
    fields: [
      { key: 'title', type: 'text' },
      { key: 'link', type: 'link' },
      { key: 'text', type: 'textarea' },
      { key: 'icon', type: 'icon' },
      { key: 'icon_position', type: 'select', options: opts('right|left'), default: 'right' },
      { key: 'background', type: 'select', options: opts('color-blend|info|primary'), default: 'color-blend' },
      { key: 'title_size', type: 'select', options: opts('h3|h4'), default: 'h3' },
    ],
  },
  {
    name: 'moca-list-card', label: 'List card', icon: 'i-lucide-list', group: 'Cards', summary: 'title',
    fields: [
      { key: 'title', type: 'text' },
      { key: 'header_color', type: 'select', options: opts('primary|blue|blue-dark|info|bright-light|dark'), default: 'primary' },
      { key: 'body', type: 'markdown', help: 'A bulleted list; each item becomes a row' },
    ],
  },
  {
    name: 'moca-profile-card', label: 'Profile card', icon: 'i-lucide-user-round', group: 'Cards', summary: 'name',
    fields: [
      { key: 'name', type: 'text' },
      { key: 'title', type: 'textarea', help: 'Job title' },
      { key: 'department', type: 'text' },
      { key: 'image', type: 'image' },
      { key: 'phone', type: 'text' },
      { key: 'email', type: 'text' },
      { key: 'location', type: 'text', label: 'Office location' },
      { key: 'schedule', type: 'link', label: 'Appointment link' },
    ],
  },
  {
    name: 'moca-tier1-card', label: 'Tier 1 card', icon: 'i-lucide-image-play', group: 'Cards', summary: 'title',
    fields: [
      { key: 'title', type: 'text' },
      { key: 'text', type: 'textarea' },
      { key: 'link', type: 'link' },
      { key: 'image', type: 'image' },
      { key: 'icon', type: 'icon' },
      { key: 'ratio', type: 'select', options: opts('|1x1|2x3|3x4|4x3|3x2', { '': 'Default (300px min)' }) },
      { key: 'shadow', type: 'boolean' },
    ],
  },
  {
    name: 'moca-info-block', label: 'Info block', icon: 'i-lucide-layout-panel-left', group: 'Cards', summary: 'header',
    fields: [
      { key: 'header', type: 'text' },
      { key: 'body', type: 'markdown' },
      { key: 'image', type: 'image' },
      { key: 'image_location', type: 'select', options: opts('left|right'), default: 'left' },
      button,
    ],
  },

  // Media
  {
    name: 'moca-hero-banner', label: 'Hero banner', icon: 'i-lucide-gallery-horizontal', group: 'Media', summary: 'header',
    fields: [
      { key: 'header', type: 'text' },
      { key: 'subheader', type: 'text' },
      { key: 'content', type: 'markdown' },
      { key: 'background_image', type: 'image' },
      { key: 'partial_background', type: 'boolean', help: 'Darken only a bar behind bottom-left text' },
      { key: 'text_location', type: 'select', options: opts('jumbotron-content-bottom-left|jumbotron-content-center|jumbotron-content-top-left', { 'jumbotron-content-bottom-left': 'Bottom left', 'jumbotron-content-center': 'Center', 'jumbotron-content-top-left': 'Top left' }), default: 'jumbotron-content-bottom-left' },
      { key: 'height', type: 'text', help: 'Any CSS length, e.g. 300px or 50vh', default: '300px' },
      { key: 'container_width', type: 'select', options: opts('default|narrow'), default: 'default' },
      button,
    ],
  },
  {
    name: 'moca-image', label: 'Image', icon: 'i-lucide-image', group: 'Media', summary: 'image_alt',
    fields: [
      { key: 'image', type: 'image' },
      { key: 'image_style', type: 'select', options: imageStyle },
      { key: 'width', type: 'text', help: 'Display width in pixels' },
      { key: 'align', type: 'select', options: opts('|center|right', { '': 'Left' }) },
      { key: 'margin_bottom', type: 'select', options: spacer },
      { key: 'full_width', type: 'boolean' },
      { key: 'fill_height', type: 'boolean', help: 'Fill the column height, cropped' },
    ],
  },
  {
    name: 'moca-image-overlay', label: 'Image with text', icon: 'i-lucide-image-up', group: 'Media', summary: 'text',
    fields: [
      { key: 'image', type: 'image' },
      { key: 'link', type: 'link' },
      { key: 'text', type: 'text' },
      { key: 'text_location', type: 'select', options: opts('over|top|bottom'), default: 'over' },
      { key: 'text_color', type: 'select', options: opts('default|primary|dark'), default: 'default' },
    ],
  },
  {
    name: 'moca-youtube', label: 'YouTube video', icon: 'i-lucide-youtube', group: 'Media', summary: 'url',
    fields: [{ key: 'url', type: 'text', label: 'YouTube URL' }],
  },
  {
    name: 'moca-video-banner', label: 'Video banner', icon: 'i-lucide-clapperboard', group: 'Media', summary: 'url',
    fields: [
      { key: 'url', type: 'text', label: 'YouTube URL' },
      { key: 'aspect_ratio', type: 'select', options: opts('16by9|21by9|4by3|1by1'), default: '16by9' },
    ],
  },

  // Interactive
  {
    name: 'moca-accordion', label: 'Accordion / tabs', icon: 'i-lucide-chevrons-up-down', group: 'Interactive',
    fields: [
      { key: 'display', type: 'select', options: opts('accordion|tabs|pills'), default: 'accordion' },
      { key: 'panels', type: 'blocks', allow: ['moca-accordion-panel'], max: 15 },
    ],
  },
  {
    name: 'moca-accordion-panel', label: 'Panel', icon: 'i-lucide-panel-top-open', group: 'Interactive', summary: 'title', childOnly: true,
    fields: [
      { key: 'title', type: 'text' },
      { key: 'content', type: 'markdown' },
    ],
  },
  {
    name: 'moca-form', label: 'Form', icon: 'i-lucide-clipboard-list', group: 'Interactive',
    fields: [
      { key: 'action', type: 'text', help: 'Where submissions go', default: 'https://ouresources.usu.edu/_assets/forms/forms.php' },
      { key: 'hidden_fields', type: 'textarea', help: 'name=value, one per line' },
      { key: 'submit_text', type: 'text', default: 'Submit' },
      { key: 'honeypot', type: 'boolean', default: true },
      { key: 'fields', type: 'blocks', allow: ['moca-form-field'] },
    ],
  },
  {
    name: 'moca-form-field', label: 'Form field', icon: 'i-lucide-text-cursor-input', group: 'Interactive', summary: 'label', childOnly: true,
    fields: [
      { key: 'label', type: 'text' },
      { key: 'name', type: 'text', help: 'The name the receiving end expects' },
      { key: 'type', type: 'select', options: opts('text|email|tel|textarea'), default: 'text' },
      { key: 'required', type: 'boolean' },
      { key: 'placeholder', type: 'text' },
    ],
  },
  {
    name: 'moca-advisor-finder', label: 'Advisor finder', icon: 'i-lucide-user-search', group: 'Interactive',
    fields: [
      { key: 'location_label', type: 'text', default: 'Where Will You Be Taking Classes?' },
      { key: 'locations', type: 'textarea', help: 'One per line' },
      { key: 'focus_area_label', type: 'text', default: 'Select the Focus Area that interests you' },
      { key: 'focus_areas', type: 'textarea', help: 'One per line' },
      { key: 'last_name_label', type: 'text', default: 'Last Name' },
      { key: 'undecided_option', type: 'text', default: 'Undecided' },
      { key: 'undecided_title', type: 'text', default: 'To Schedule an Appointment, Choose an Advisor' },
      { key: 'undecided', type: 'markdown', help: 'One paragraph per advisor, each shown as a card' },
      { key: 'error_message', type: 'text', default: 'No Advisors Found' },
      { key: 'button_text', type: 'text', default: 'Schedule an Appointment' },
      { key: 'advisors', type: 'blocks', allow: ['moca-advisor'] },
    ],
  },
  {
    name: 'moca-advisor', label: 'Advisor', icon: 'i-lucide-user-round-check', group: 'Interactive', summary: 'name', childOnly: true,
    fields: [
      { key: 'name', type: 'text' },
      { key: 'image', type: 'image' },
      { key: 'phone', type: 'text' },
      { key: 'email', type: 'text' },
      { key: 'appointment_link', type: 'link' },
      { key: 'locations', type: 'text', help: 'Comma-separated, from the finder\'s locations' },
      { key: 'focus_area', type: 'text' },
      { key: 'last_name_range', type: 'text' },
    ],
  },

  // Top navigation (page frontmatter, not markdown components)
  {
    name: 'nav-link', label: 'Link', icon: 'i-lucide-link-2', group: 'Navigation', summary: 'label', nav: true,
    fields: [
      { key: 'label', type: 'text' },
      { key: 'link', type: 'link' },
      { key: 'icon', type: 'icon' },
      { key: 'button', type: 'boolean', help: 'Show as a button' },
    ],
  },
  {
    name: 'nav-dropdown', label: 'Dropdown', icon: 'i-lucide-chevron-down-square', group: 'Navigation', summary: 'label', nav: true,
    fields: [
      { key: 'label', type: 'text' },
      { key: 'align_right', type: 'boolean' },
      { key: 'links', type: 'blocks', allow: ['nav-link', 'nav-divider'] },
    ],
  },
  {
    name: 'nav-divider', label: 'Divider', icon: 'i-lucide-minus', group: 'Navigation', nav: true, childOnly: true,
    fields: [],
  },
  {
    name: 'nav-columns', label: 'Columns menu', icon: 'i-lucide-layout-grid', group: 'Navigation', summary: 'label', nav: true,
    fields: [
      { key: 'label', type: 'text' },
      { key: 'mega', type: 'boolean', help: 'Full-width mega menu' },
      { key: 'align_right', type: 'boolean' },
      { key: 'columns', type: 'blocks', allow: ['nav-column'] },
    ],
  },
  {
    name: 'nav-column', label: 'Menu column', icon: 'i-lucide-rectangle-vertical', group: 'Navigation', summary: 'title', nav: true, childOnly: true,
    fields: [
      { key: 'title', type: 'text' },
      { key: 'text', type: 'textarea' },
      { key: 'width', type: 'select', options: opts('|3|4|6|12', { '': 'Auto' }) },
      { key: 'link_columns', type: 'select', options: opts('1|2|3'), default: '1' },
      { key: 'links', type: 'blocks', allow: ['nav-link'] },
      { key: 'more', type: 'blocks', label: '"More" link', allow: ['nav-link'], max: 1 },
    ],
  },
]

export const cmsComponentMap: Record<string, CmsComponent> = Object.fromEntries(cmsComponents.map(c => [c.name, c]))

// What the page's two roots accept
export const cmsRootAllow = {
  body: cmsComponents.filter(c => !c.nav && !c.childOnly).map(c => c.name),
  top_nav: cmsComponents.filter(c => c.nav && !c.childOnly).map(c => c.name),
}

// Components a blocks field accepts: its allow list, else every top-level body component
export function cmsAllowed(field: CmsField) {
  return field.allow ?? cmsRootAllow.body
}

export const cmsFieldLabel = (field: CmsField) =>
  field.label ?? field.key.charAt(0).toUpperCase() + field.key.slice(1).replace(/_/g, ' ')

export const cmsIsSlot = (field: CmsField) => field.type === 'markdown' || field.type === 'blocks'

export function cmsUid() {
  return globalThis.crypto.randomUUID()
}

// A new instance with its fields' defaults (and, for a few, a starter child so it renders something)
export function cmsNewBlock(name: string): CmsBlock {
  const def = cmsComponentMap[name]
  const block: CmsBlock = { _uid: cmsUid(), component: name }
  for (const f of def?.fields ?? []) {
    if (f.type === 'blocks') block[f.key] = []
    else if (f.default !== undefined) block[f.key] = f.default
  }
  if (name === 'moca-row') block.columns = [cmsNewBlock('moca-column'), cmsNewBlock('moca-column')]
  if (name === 'moca-accordion') block.panels = [{ ...cmsNewBlock('moca-accordion-panel'), title: 'Panel 1' }]
  if (name === 'moca-step-guide') block.steps = [{ ...cmsNewBlock('moca-step'), header: 'Step one' }]
  if (name === 'moca-heading') block.text = 'New heading'
  if (name === 'moca-text') block.text = 'New text'
  if (name === 'moca-button') block.text = 'Button'
  if (name === 'moca-quote') block.quote = 'Quote'
  return block
}

// The tree's name for an instance: its summary field, else the component's label
export function cmsBlockSummary(block: CmsBlock) {
  const def = cmsComponentMap[block.component]
  const value = def?.summary ? block[def.summary] : undefined
  const text = typeof value === 'string' ? value.replace(/[#*_`>[\]()]/g, '').replace(/\s+/g, ' ').trim() : ''
  return text.length > 60 ? `${text.slice(0, 57)}…` : text
}

export function cmsEmptyPage(title: string): CmsPageDoc {
  return { title, body: [], top_nav: [] }
}
