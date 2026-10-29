<script setup lang="ts">
// A form that posts the way Modern Campus form assets do (templateresources.usu.edu/_assets/forms/ouforms.js):
// the fields plus hidden values, URL-encoded, to forms.php, which replies with JSON
// { active, message, data: [{ name, message }] }: active false lists field errors; otherwise message thanks.
// Its #fields slot holds moca-form-field components, read here as field definitions.
type Field = {
  label?: string
  // The name the receiving end expects
  name?: string
  type?: 'text' | 'email' | 'tel' | 'textarea'
  required?: boolean
  placeholder?: string
}

const props = defineProps<{
  // Where submissions go
  action?: string
  // name=value, one per line, sent with every submission (e.g. asset_id, form_uuid, site_name)
  hidden_fields?: string
  submit_text?: string
  // A hidden field bots fill in; a submission with it filled is dropped silently
  honeypot?: boolean
}>()

const uid = useId()
const values = reactive<Record<string, string>>({})
const trap = ref('')
const errors = ref<Record<string, string>>({})
const status = ref<{ kind: 'success' | 'error', message: string }>()
const sending = ref(false)

const hidden = computed(() => (props.hidden_fields ?? '').split('\n').map(l => l.trim()).filter(Boolean)
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()] as const))

const fieldName = (f: Field) => f.name === undefined ? '' : String(f.name)

async function submit(fields: Field[]) {
  status.value = undefined
  errors.value = {}
  if (trap.value) return
  const missing = fields.filter(f => f.required && fieldName(f) && !values[fieldName(f)]?.trim())
  if (missing.length) {
    errors.value = Object.fromEntries(missing.map(f => [fieldName(f), `${f.label ?? f.name} is required.`]))
    return
  }
  const body = new URLSearchParams()
  for (const f of fields) if (fieldName(f)) body.set(fieldName(f), values[fieldName(f)] ?? '')
  for (const [name, value] of hidden.value) body.set(name, value)

  sending.value = true
  try {
    const res = await fetch(props.action!, { method: 'POST', body })
    const result = JSON.parse(await res.text())
    if (result.active === false) {
      errors.value = Object.fromEntries((result.data ?? []).map((d: any) => [d.name, d.message]))
      status.value = { kind: 'error', message: result.message ?? 'Please correct the fields below.' }
    }
    else status.value = { kind: 'success', message: result.message ?? 'Thank you.' }
  }
  catch {
    // Network failure, a reply the browser may not read (CORS), or one that isn't JSON
    status.value = { kind: 'error', message: 'The form could not be sent. Please try again later, or contact us by phone or email.' }
  }
  finally {
    sending.value = false
  }
}

// Bootstrap 4 .form-control
const control = 'block w-full px-3 py-1.5 text-base leading-normal text-[#495057] bg-white border border-[#ced4da] rounded focus:border-[#80bdff] focus:outline-0 focus:shadow-[0_0_0_.2rem_rgba(0,123,255,.25)]'
const invalid = 'border-usu-danger!'
const alert = { success: 'text-[#155724] bg-[#d4edda] border-[#c3e6cb]', error: 'text-[#721c24] bg-[#f8d7da] border-[#f5c6cb]' }
</script>

<template>
  <CmsChildren v-slot="{ children }" :use="$slots.fields">
    <div>
      <form v-if="status?.kind !== 'success'" autocomplete="off" novalidate @submit.prevent="submit(children.map(c => c.props as Field))">
        <!-- The honeypot sits off screen; people never see or fill it -->
        <span v-if="honeypot" class="absolute -left-[2000px] invisible" aria-hidden="true">
          <label>Leave this empty <input v-model="trap" type="text" tabindex="-1" autocomplete="off"></label>
        </span>

        <!-- .form-group.form-row: label in two twelfths, the control in the rest -->
        <div v-for="{ props: f, key } in children" :key="key" :cmsuid="f.cmsuid" class="flex flex-wrap -mx-[5px] mb-4">
          <label :for="`${uid}-${f.name}`" class="w-full bs-md:basis-[16.666667%] bs-md:max-w-[16.666667%] px-[5px] pt-[calc(.375rem+1px)] pb-[calc(.375rem+1px)] mb-0 leading-normal">
            <span v-if="f.required" class="text-usu-danger">*</span>{{ f.label }}
          </label>
          <div class="w-full bs-md:basis-[83.333333%] bs-md:max-w-[83.333333%] px-[5px]">
            <textarea
              v-if="f.type === 'textarea'"
              :id="`${uid}-${f.name}`"
              v-model="values[fieldName(f)]"
              :name="f.name"
              :placeholder="f.placeholder"
              :required="f.required"
              :class="[control, 'h-auto', errors[fieldName(f)] && invalid]"
            />
            <input
              v-else
              :id="`${uid}-${f.name}`"
              v-model="values[fieldName(f)]"
              :type="f.type || 'text'"
              :name="f.name"
              :placeholder="f.placeholder"
              :required="f.required"
              :class="[control, 'h-[calc(1.5em+.75rem+2px)]', errors[fieldName(f)] && invalid]"
            >
            <div v-if="errors[fieldName(f)]" class="mt-1 text-sm text-usu-danger">{{ errors[fieldName(f)] }}</div>
          </div>
        </div>

        <!-- .form-group.text-right -->
        <div class="mb-4 text-right">
          <button type="submit" :disabled="sending" :class="mocaButtonClass('btn-primary')">
            {{ sending ? 'Submitting, please wait…' : submit_text || 'Submit' }}
          </button>
        </div>
      </form>

      <div v-if="status" role="status" :class="['mt-4 px-5 py-3 border rounded', alert[status.kind]]">{{ status.message }}</div>
    </div>
  </CmsChildren>
</template>
