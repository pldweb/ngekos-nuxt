<script setup lang="ts">
/**
 * "File manager" ringan untuk input gambar.
 * - Klik area / tombol untuk buka dialog.
 * - Drag & drop atau pilih berkas.
 * - Preview sebelum dipakai, lalu emit File ke parent (parent yang unggah).
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | null // URL preview yang sedang aktif
    label?: string
    rounded?: boolean // avatar bulat
    accept?: string
    maxMb?: number
  }>(),
  { modelValue: null, label: 'Gambar', rounded: false, accept: 'image/*', maxMb: 2 },
)

const emit = defineEmits<{
  (e: 'select', file: File, previewUrl: string): void
}>()

const open = ref(false)
const dragging = ref(false)
const error = ref<string | null>(null)
const localFile = ref<File | null>(null)
const localPreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const currentPreview = computed(() => localPreview.value ?? props.modelValue)

function reset() {
  if (localPreview.value) URL.revokeObjectURL(localPreview.value)
  localFile.value = null
  localPreview.value = null
  error.value = null
  dragging.value = false
}

function openDialog() {
  reset()
  open.value = true
}

function pickFile(file: File | undefined | null) {
  error.value = null
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = 'Berkas harus berupa gambar.'
    return
  }
  if (file.size > props.maxMb * 1024 * 1024) {
    error.value = `Ukuran maksimal ${props.maxMb} MB.`
    return
  }
  if (localPreview.value) URL.revokeObjectURL(localPreview.value)
  localFile.value = file
  localPreview.value = URL.createObjectURL(file)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  pickFile(e.dataTransfer?.files?.[0])
}

function onInputChange(e: Event) {
  pickFile((e.target as HTMLInputElement).files?.[0])
}

function confirmSelect() {
  if (!localFile.value || !localPreview.value) return
  emit('select', localFile.value, localPreview.value)
  // biarkan parent yang revoke; jangan revoke di sini karena preview dipakai parent
  localPreview.value = null
  open.value = false
}

onBeforeUnmount(reset)
</script>

<template>
  <div class="ip">
    <!-- Trigger: thumbnail atau placeholder -->
    <button type="button" class="ip__trigger" :class="{ 'ip__trigger--round': rounded }" @click="openDialog">
      <img v-if="currentPreview" :src="currentPreview" alt="" class="ip__thumb" />
      <span v-else class="ip__empty">
        <i class="pi pi-image" />
        <span>{{ label }}</span>
      </span>
      <span class="ip__edit"><i class="pi pi-pencil" /></span>
    </button>

    <Dialog
      v-model:visible="open"
      modal
      header="Kelola Berkas"
      :style="{ width: '92vw', maxWidth: '460px' }"
      :dismissable-mask="true"
    >
      <div
        class="drop"
        :class="{ 'drop--active': dragging, 'drop--has': localPreview }"
        role="button"
        tabindex="0"
        @click="fileInput?.click()"
        @keydown.enter="fileInput?.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <img v-if="localPreview" :src="localPreview" alt="Pratinjau" class="drop__preview" />
        <template v-else>
          <span class="drop__ic"><i class="pi pi-cloud-upload" /></span>
          <p class="drop__title">Seret & lepas gambar ke sini</p>
          <p class="drop__hint">atau klik untuk pilih berkas · maks {{ maxMb }} MB</p>
        </template>
        <input
          ref="fileInput"
          type="file"
          :accept="accept"
          class="drop__input"
          @change="onInputChange"
        />
      </div>

      <Message v-if="error" severity="error" class="ip__msg">{{ error }}</Message>

      <template #footer>
        <Button label="Batal" text @click="open = false" />
        <Button
          label="Ganti gambar"
          icon="pi pi-refresh"
          text
          :disabled="!localPreview"
          @click="reset(); fileInput?.click()"
        />
        <Button label="Gunakan" icon="pi pi-check" :disabled="!localFile" @click="confirmSelect" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.ip { display: inline-block; }
.ip__trigger {
  position: relative;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border: 1.5px dashed var(--line);
  border-radius: 14px;
  background: var(--surface-2);
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  transition: border-color 0.15s;
}
.ip__trigger:hover { border-color: var(--sand); }
.ip__trigger--round { border-radius: 50%; }
.ip__thumb { width: 100%; height: 100%; object-fit: cover; }
.ip__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--ink-soft);
  font-size: 12px;
}
.ip__empty i { font-size: 22px; color: var(--brand); }
.ip__edit {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  font-size: 11px;
}

.drop {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 200px;
  border: 2px dashed var(--line);
  border-radius: 16px;
  background: var(--surface-2);
  text-align: center;
  padding: 18px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.drop--active { border-color: var(--brand); background: var(--sand-soft); }
.drop--has { padding: 8px; }
.drop__ic {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 24px;
}
.drop__title { margin: 8px 0 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.drop__hint { margin: 2px 0 0; font-size: 12.5px; color: var(--ink-soft); }
.drop__preview { max-width: 100%; max-height: 300px; border-radius: 12px; object-fit: contain; }
.drop__input { display: none; }
.ip__msg { margin-top: 12px; }
</style>
