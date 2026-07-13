<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Complaint = {
  id: number
  kategori: string
  deskripsi: string
  status: 'open' | 'on_progress' | 'done' | 'rejected'
  created_at: string | null
}

const api = useApi()

const complaints = ref<Complaint[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const dialog = ref(false)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const form = reactive<{ kategori: string | null; deskripsi: string }>({ kategori: null, deskripsi: '' })

const kategoriOptions = [
  { label: 'WiFi', value: 'wifi' },
  { label: 'AC', value: 'ac' },
  { label: 'Air', value: 'air' },
  { label: 'Listrik', value: 'listrik' },
  { label: 'Kebersihan', value: 'kebersihan' },
  { label: 'Keamanan', value: 'keamanan' },
]

const statusMeta: Record<Complaint['status'], { label: string; severity: string }> = {
  open: { label: 'Baru', severity: 'warn' },
  on_progress: { label: 'Diproses', severity: 'info' },
  done: { label: 'Selesai', severity: 'success' },
  rejected: { label: 'Ditolak', severity: 'danger' },
}

const tanggal = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: Complaint[] }>('/complaints')
    complaints.value = res.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat pengaduan.'
  } finally {
    loading.value = false
  }
}

async function submit() {
  submitError.value = null
  if (!form.kategori || !form.deskripsi.trim()) {
    submitError.value = 'Pilih kategori dan tulis deskripsi.'
    return
  }
  submitting.value = true
  try {
    await api('/complaints', {
      method: 'POST',
      body: { kategori: form.kategori, deskripsi: form.deskripsi.trim() },
    })
    dialog.value = false
    form.kategori = null
    form.deskripsi = ''
    await load()
  } catch (e: any) {
    submitError.value = e?.data?.message ?? 'Gagal mengirim pengaduan.'
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Pengaduan</h1>
      <p class="nk-pagehead__sub">Ada kendala di kos? Laporkan, kami bantu tindak lanjuti.</p>
    </header>

    <Button class="nk-cta" icon="pi pi-plus" label="Buat pengaduan" @click="dialog = true" />

    <section class="nk-stack" style="gap: 10px">
      <h2 class="nk-sect">Riwayat</h2>

      <p v-if="loading" class="nk-muted">Memuat pengaduan…</p>

      <EmptyState
        v-else-if="error"
        icon="pi pi-exclamation-triangle"
        title="Gagal memuat"
        :description="error"
      >
        <Button label="Coba lagi" size="small" @click="load" />
      </EmptyState>

      <EmptyState
        v-else-if="complaints.length === 0"
        icon="pi pi-comments"
        title="Belum ada pengaduan"
        description="Pengaduan yang kamu buat akan tampil di sini beserta statusnya."
      />

      <article v-for="c in complaints" v-else :key="c.id" class="cmp nk-rise">
        <div class="cmp__body">
          <p class="cmp__kat">{{ c.kategori }}</p>
          <p class="cmp__desc">{{ c.deskripsi }}</p>
          <p class="cmp__date">{{ tanggal(c.created_at) }}</p>
        </div>
        <Tag :value="statusMeta[c.status].label" :severity="statusMeta[c.status].severity" />
      </article>
    </section>

    <Dialog v-model:visible="dialog" modal header="Buat pengaduan" :style="{ width: '92vw', maxWidth: '420px' }">
      <div class="nk-form">
        <div>
          <label class="nk-label">Kategori</label>
          <Select
            v-model="form.kategori"
            :options="kategoriOptions"
            option-label="label"
            option-value="value"
            placeholder="Pilih kategori"
            class="w-full"
          />
        </div>
        <div>
          <label class="nk-label">Deskripsi</label>
          <Textarea v-model="form.deskripsi" rows="4" auto-resize placeholder="Ceritakan kendalamu…" class="w-full" />
        </div>
        <Message v-if="submitError" severity="error">{{ submitError }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="dialog = false" />
        <Button label="Kirim" icon="pi pi-send" :loading="submitting" @click="submit" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.cmp {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
}
.cmp__kat { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); text-transform: capitalize; }
.cmp__desc { margin: 4px 0 0; font-size: 13px; color: var(--ink-soft); line-height: 1.45; }
.cmp__date { margin: 6px 0 0; font-size: 11px; color: var(--ink-soft); }
.w-full { width: 100%; }
</style>
