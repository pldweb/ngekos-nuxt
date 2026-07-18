<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Testimoni = { nama: string; kota: string; teks: string; star: number }
type Setting = { id: number; kos_id: number | null; kunci: string; nilai: any }

const api = useApi()
const toast = useToast()
const { confirmDialog, confirming, confirmAction, askConfirm, runConfirmedAction, cancelConfirmedAction } = useActionConfirm()
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const saved = ref(false)
const items = ref<Testimoni[]>([])

const kosong = (): Testimoni => ({ nama: '', kota: '', teks: '', star: 5 })

function normalisasi(data: any): Testimoni[] {
  return Array.isArray(data)
    ? data.map((item) => ({
      nama: String(item?.nama ?? ''),
      kota: String(item?.kota ?? ''),
      teks: String(item?.teks ?? ''),
      star: Number(item?.star ?? 5),
    }))
    : []
}

async function load() {
  loading.value = true
  error.value = null
  saved.value = false
  try {
    const res = await api<{ data: Setting[] }>('/settings')
    items.value = normalisasi(res.data.find((s) => s.kunci === 'testimoni_publik')?.nilai)
    if (!items.value.length) items.value = [kosong()]
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat testimoni.'
  } finally {
    loading.value = false
  }
}

function confirmTambah() {
  askConfirm({
    title: 'Tambah baris testimoni?',
    message: 'Baris testimoni baru akan ditambahkan ke daftar.',
    confirmLabel: 'Tambah',
    run: tambah,
  })
}

function tambah() {
  items.value.push(kosong())
  toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Baris testimoni ditambahkan.', life: 3000 })
}

function confirmHapus(index: number) {
  askConfirm({
    title: 'Hapus baris testimoni?',
    message: `Testimoni nomor ${index + 1} akan dihapus dari daftar sebelum disimpan.`,
    confirmLabel: 'Hapus',
    severity: 'danger',
    run: () => hapus(index),
  })
}

function hapus(index: number) {
  items.value.splice(index, 1)
  if (!items.value.length) items.value.push(kosong())
  toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Baris testimoni dihapus.', life: 3000 })
}

function confirmSave() {
  askConfirm({
    title: 'Simpan testimoni?',
    message: 'Daftar testimoni publik akan diperbarui.',
    confirmLabel: 'Simpan',
    run: save,
  })
}

async function save() {
  saving.value = true
  error.value = null
  saved.value = false
  try {
    const nilai = items.value
      .map((item) => ({
        nama: item.nama.trim(),
        kota: item.kota.trim(),
        teks: item.teks.trim(),
        star: Math.min(Math.max(Number(item.star) || 5, 1), 5),
      }))
      .filter((item) => item.nama && item.teks)

    await api('/settings', {
      method: 'POST',
      body: { kos_id: null, kunci: 'testimoni_publik', nilai },
    })
    items.value = nilai.length ? nilai : [kosong()]
    saved.value = true
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Testimoni tersimpan.', life: 3000 })
  } catch (e: any) {
    error.value = e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan testimoni.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: error.value, life: 4000 })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Testimoni</h1>
      <p class="nk-pagehead__sub">Kelola testimoni yang tampil di halaman depan.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memuat testimoni...</p>

    <EmptyState
      v-else-if="error && !items.length"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <form v-else class="tmset nk-rise" @submit.prevent="confirmSave">
      <div class="tmset__head">
        <div>
          <h2 class="nk-sect">Daftar testimoni</h2>
          <p class="tmset__hint">Isi nama dan cerita. Baris kosong tidak akan disimpan.</p>
        </div>
        <Button type="button" label="Tambah" icon="pi pi-plus" outlined @click="confirmTambah" />
      </div>

      <div class="tmset__list">
        <section v-for="(item, index) in items" :key="index" class="tmset__item">
          <div class="tmset__item-head">
            <span class="tmset__badge">{{ index + 1 }}</span>
            <Button type="button" icon="pi pi-trash" text rounded severity="danger" aria-label="Hapus" @click="confirmHapus(index)" />
          </div>
          <div class="tmset__grid">
            <div class="nk-field">
              <label class="nk-label">Nama</label>
              <InputText v-model="item.nama" class="w-full" placeholder="Nama penghuni" />
            </div>
            <div class="nk-field">
              <label class="nk-label">Kota</label>
              <InputText v-model="item.kota" class="w-full" placeholder="Jakarta" />
            </div>
            <div class="nk-field">
              <label class="nk-label">Rating</label>
              <InputNumber v-model="item.star" class="w-full" :min="1" :max="5" show-buttons />
            </div>
            <div class="nk-field tmset__full">
              <label class="nk-label">Isi testimoni</label>
              <Textarea v-model="item.teks" class="w-full" rows="3" auto-resize placeholder="Ceritakan pengalaman penghuni..." />
            </div>
          </div>
        </section>
      </div>

      <Message v-if="error" severity="error" size="small">{{ error }}</Message>
      <Message v-if="saved" severity="success" size="small">Testimoni tersimpan.</Message>
      <div class="tmset__actions">
        <Button type="submit" label="Simpan testimoni" icon="pi pi-save" :loading="saving" />
      </div>
    </form>
    <ActionConfirmDialog
      :visible="confirmDialog"
      :action="confirmAction"
      :loading="confirming"
      @cancel="cancelConfirmedAction"
      @confirm="runConfirmedAction"
    />
  </div>
</template>

<style scoped>
.tmset {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px;
}
.tmset__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
.tmset__hint { margin: 6px 0 0; color: var(--ink-soft); font-size: 13px; }
.tmset__list { display: grid; gap: 14px; margin-top: 16px; }
.tmset__item { border: 1px solid var(--line); border-radius: 12px; padding: 14px; background: #fff; }
.tmset__item-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.tmset__badge { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; background: var(--sand-soft); color: var(--brand); font-weight: 700; font-size: 13px; }
.tmset__grid { display: grid; grid-template-columns: 1fr 1fr 160px; gap: 12px; }
.tmset__full { grid-column: 1 / -1; }
.tmset__actions { margin-top: 16px; }
.w-full { width: 100%; }
@media (max-width: 760px) {
  .tmset__head { flex-direction: column; }
  .tmset__grid { grid-template-columns: 1fr; }
}
</style>
