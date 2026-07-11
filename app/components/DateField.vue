<script setup lang="ts">
/**
 * Pembungkus PrimeVue DatePicker yang tetap memakai v-model string 'YYYY-MM-DD',
 * sehingga bisa menggantikan <input type="date"> tanpa mengubah logika form/API.
 */
const props = defineProps<{
  modelValue: string | null
  placeholder?: string
  minDate?: string | null
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string | null): void }>()

defineOptions({ inheritAttrs: false })

function toDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
function toStr(d: Date | null): string | null {
  if (!d) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const inner = computed<Date | null>({
  get: () => toDate(props.modelValue),
  set: (v) => emit('update:modelValue', toStr(v)),
})
const min = computed(() => toDate(props.minDate) ?? undefined)
</script>

<template>
  <DatePicker
    v-model="inner"
    date-format="dd M yy"
    show-icon
    icon-display="input"
    :manual-input="false"
    :min-date="min"
    :placeholder="placeholder ?? 'Pilih tanggal'"
    fluid
    v-bind="$attrs"
  />
</template>
