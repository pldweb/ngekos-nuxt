<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Method = {
  id: number
  nama: string
  nama_pemilik_rekening: string | null
  nomor_rekening: string | null
  aktif: boolean
}

const api = useApi()
const toast = useToast()
const items = ref<Method[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const deleteTarget = ref<Method | null>(null)
const deleteDialog = ref(false)
const dialog = ref(false)
const saveDialog = ref(false)
const form = reactive({
  id: null as number | null,
  nama: '',
  nama_pemilik_rekening: '',
  nomor_rekening: '',
  aktif: true,
})
const editMode = computed(() => form.id !== null)

function reset() {
  Object.assign(form, {
    id: null,
    nama: '',
    nama_pemilik_rekening: '',
    nomor_rekening: '',
    aktif: true,
  })
  saveError.value = null
}

function openCreate() {
  reset()
  dialog.value = true
}

function closeDialog() {
  if (saving.value) return
  dialog.value = false
  reset()
}

async function load() {
  loading.value = true
  error.value = null
  try {
    items.value = (await api<{ data: Method[] }>('/payment-methods')).data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat bank.'
  } finally {
    loading.value = false
  }
}

function edit(m: Method) {
  Object.assign(form, {
    id: m.id,
    nama: m.nama,
    nama_pemilik_rekening: m.nama_pemilik_rekening ?? '',
    nomor_rekening: m.nomor_rekening ?? '',
    aktif: m.aktif,
  })
  saveError.value = null
  dialog.value = true
}

function confirmDelete(m: Method) {
  deleteTarget.value = m
  deleteError.value = null
  deleteDialog.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = null
  try {
    await api(`/payment-methods/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Bank dihapus.', life: 3000 })
    deleteDialog.value = false
    deleteTarget.value = null
    await load()
  } catch (e: any) {
    deleteError.value = e?.data?.message ?? 'Gagal menghapus bank.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: deleteError.value, life: 4000 })
  } finally {
    deleting.value = false
  }
}

function confirmSave() {
  saveError.value = null
  saveDialog.value = true
}

async function save() {
  saving.value = true
  saveError.value = null
  try {
    const body = {
      nama: form.nama,
      nama_pemilik_rekening: form.nama_pemilik_rekening || null,
      nomor_rekening: form.nomor_rekening || null,
      aktif: form.aktif,
    }
    const isEdit = Boolean(form.id)
    if (form.id) await api(`/payment-methods/${form.id}`, { method: 'PUT', body })
    else await api('/payment-methods', { method: 'POST', body })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: isEdit ? 'Bank diperbarui.' : 'Bank ditambahkan.', life: 3000 })
    dialog.value = false
    saveDialog.value = false
    reset()
    await load()
  } catch (e: any) {
    saveError.value = e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan bank.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: saveError.value, life: 4000 })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="bank-head nk-pagehead">
      <div>
        <h1 class="nk-pagehead__title">Pengaturan Bank</h1>
        <p class="nk-pagehead__sub">Kelola rekening tujuan transfer untuk pembayaran penghuni.</p>
      </div>
      <Button label="Tambah bank" icon="pi pi-plus" @click="openCreate" />
    </header>

    <p v-if="loading" class="nk-muted">Memuat bank...</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <section v-else class="banklist nk-rise">
      <EmptyState
        v-if="items.length === 0"
        icon="pi pi-credit-card"
        title="Belum ada bank"
        description="Tambahkan rekening tujuan transfer pertama."
      >
        <Button label="Tambah bank" icon="pi pi-plus" size="small" @click="openCreate" />
      </EmptyState>

      <div v-for="m in items" v-else :key="m.id" class="bankitem">
        <div class="bankitem__main">
          <strong>{{ m.nama }}</strong>
          <span>{{ m.nama_pemilik_rekening ?? '-' }}</span>
          <small>{{ m.nomor_rekening ?? 'Nomor rekening belum diisi' }}</small>
        </div>
        <Tag :value="m.aktif ? 'Aktif' : 'Nonaktif'" :severity="m.aktif ? 'success' : 'secondary'" />
        <div class="bankitem__actions">
          <Button label="Edit" icon="pi pi-pencil" size="small" text @click="edit(m)" />
          <Button label="Hapus" icon="pi pi-trash" size="small" severity="danger" text @click="confirmDelete(m)" />
        </div>
      </div>
    </section>

    <Dialog
      v-model:visible="dialog"
      modal
      :header="editMode ? 'Edit bank' : 'Tambah bank'"
      :style="{ width: '92vw', maxWidth: '520px' }"
      @hide="reset"
    >
      <form id="bank-form" class="bankform" @submit.prevent="confirmSave">
        <div class="nk-field">
          <label class="nk-label">Nama bank</label>
          <InputText v-model="form.nama" class="w-full" placeholder="BCA" required autofocus />
        </div>
        <div class="nk-field">
          <label class="nk-label">Nama pemilik rekening</label>
          <InputText v-model="form.nama_pemilik_rekening" class="w-full" placeholder="NgekosKuy" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Nomor rekening</label>
          <InputText v-model="form.nomor_rekening" class="w-full" placeholder="1234567890" />
        </div>
        <label class="bankform__toggle">
          <span>Aktif</span>
          <ToggleSwitch v-model="form.aktif" />
        </label>
        <Message v-if="saveError" severity="error" size="small">{{ saveError }}</Message>
      </form>

      <template #footer>
        <Button label="Batal" text :disabled="saving" @click="closeDialog" />
        <Button
          type="submit"
          form="bank-form"
          :label="editMode ? 'Simpan perubahan' : 'Tambah bank'"
          icon="pi pi-save"
          :loading="saving"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="saveDialog"
      modal
      :header="editMode ? 'Simpan perubahan bank?' : 'Tambah bank?'"
      :style="{ width: '92vw', maxWidth: '420px' }"
    >
      <p class="confirm">
        {{ editMode ? 'Perubahan data bank akan disimpan.' : 'Bank baru akan ditambahkan sebagai rekening tujuan transfer.' }}
      </p>
      <Message v-if="saveError" severity="error" size="small">{{ saveError }}</Message>
      <template #footer>
        <Button label="Batal" text :disabled="saving" @click="saveDialog = false" />
        <Button
          :label="editMode ? 'Simpan' : 'Tambah'"
          icon="pi pi-save"
          :loading="saving"
          @click="save"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialog"
      modal
      header="Hapus bank"
      :style="{ width: '92vw', maxWidth: '420px' }"
    >
      <p class="confirm">
        Hapus <strong>{{ deleteTarget?.nama }}</strong>? Bank yang sudah dipakai transaksi pembayaran tidak bisa dihapus.
      </p>
      <Message v-if="deleteError" severity="error" size="small">{{ deleteError }}</Message>
      <template #footer>
        <Button label="Batal" text :disabled="deleting" @click="deleteDialog = false" />
        <Button label="Hapus" icon="pi pi-trash" severity="danger" :loading="deleting" @click="doDelete" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.bank-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}
.banklist {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.bankform {
  display: grid;
  gap: 14px;
}
.bankform__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  padding: 4px 0;
}
.bankitem {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--line);
}
.bankitem:last-child { border-bottom: 0; }
.bankitem__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.bankitem__main strong { color: var(--ink); }
.bankitem__main span { color: var(--ink); font-size: 13px; }
.bankitem__main small { color: var(--ink-soft); }
.bankitem__actions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
.confirm { margin: 0 0 12px; color: var(--ink); line-height: 1.5; }
.w-full { width: 100%; }
@media (max-width: 840px) {
  .bank-head,
  .bankitem { grid-template-columns: 1fr; }
  .bank-head { align-items: stretch; }
  .bankitem__actions { justify-content: flex-start; }
}
</style>
