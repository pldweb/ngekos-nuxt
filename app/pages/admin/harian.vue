<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Room = { id: number; nomor: string; kos_id: number; tarif_harian: number | null; status: string }
type ShortStay = {
  id: number
  room_id: number
  nama_tamu: string
  kontak_tamu: string
  tanggal_masuk: string
  tanggal_keluar: string
  tarif_per_malam: number
  total: number
  status: 'menunggu_konfirmasi' | 'dikonfirmasi' | 'menginap' | 'selesai' | 'batal' | 'kedaluwarsa'
}

const api = useApi()
const toast = useToast()
const { confirmDialog, confirming, confirmAction, askConfirm, runConfirmedAction, cancelConfirmedAction } = useActionConfirm()

const rooms = ref<Room[]>([])
const stays = ref<ShortStay[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)

const form = reactive({
  room_id: null as number | null,
  nama_tamu: '',
  kontak_tamu: '',
  tanggal_masuk: '',
  tanggal_keluar: '',
  tarif_per_malam: 0,
})

const roomOptions = computed(() => rooms.value.map((r) => ({
  label: `Kamar ${r.nomor}`,
  value: r.id,
  tarif: r.tarif_harian,
})))

const statusMeta: Record<ShortStay['status'], { label: string; severity: string }> = {
  menunggu_konfirmasi: { label: 'Menunggu', severity: 'warn' },
  dikonfirmasi: { label: 'Dikonfirmasi', severity: 'info' },
  menginap: { label: 'Menginap', severity: 'info' },
  selesai: { label: 'Selesai', severity: 'success' },
  batal: { label: 'Batal', severity: 'danger' },
  kedaluwarsa: { label: 'Kedaluwarsa', severity: 'secondary' },
}

const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')
const tanggal = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

watch(() => form.room_id, (id) => {
  const room = rooms.value.find((r) => r.id === id)
  if (room?.tarif_harian) form.tarif_per_malam = room.tarif_harian
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [roomRes, stayRes] = await Promise.all([
      api<{ data: Room[] }>('/rooms'),
      api<{ data: ShortStay[] }>('/short-stays'),
    ])
    rooms.value = roomRes.data
    stays.value = stayRes.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat kos harian.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.room_id = null
  form.nama_tamu = ''
  form.kontak_tamu = ''
  form.tanggal_masuk = ''
  form.tanggal_keluar = ''
  form.tarif_per_malam = 0
}

function confirmSubmit() {
  askConfirm({
    title: 'Simpan pemesanan?',
    message: 'Pemesanan kos harian baru akan dibuat.',
    confirmLabel: 'Simpan',
    run: submit,
  })
}

async function submit() {
  saving.value = true
  error.value = null
  message.value = null
  try {
    await api('/short-stays', {
      method: 'POST',
      body: { ...form },
    })
    message.value = 'Pemesanan tersimpan.'
    toast.add({ severity: 'success', summary: 'Berhasil', detail: message.value, life: 3000 })
    resetForm()
    await load()
  } catch (e: any) {
    error.value = e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan pemesanan.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: error.value, life: 4000 })
  } finally {
    saving.value = false
  }
}

function confirmAksi(stay: ShortStay, path: string) {
  const labels: Record<string, string> = { approve: 'setujui', finish: 'selesaikan', reject: 'batalkan' }
  askConfirm({
    title: `${labels[path] ?? 'ubah'} pemesanan?`,
    message: `Pemesanan ${stay.nama_tamu} akan di${labels[path] ?? 'ubah statusnya'}.`,
    confirmLabel: labels[path] === 'batalkan' ? 'Batalkan' : 'Lanjutkan',
    severity: path === 'reject' ? 'danger' : undefined,
    run: () => aksi(stay, path),
  })
}

async function aksi(stay: ShortStay, path: string) {
  error.value = null
  message.value = null
  try {
    await api(`/short-stays/${stay.id}/${path}`, { method: 'POST' })
    message.value = 'Status diperbarui.'
    toast.add({ severity: 'success', summary: 'Berhasil', detail: message.value, life: 3000 })
    await load()
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memperbarui status.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: error.value, life: 4000 })
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Kos Harian</h1>
      <p class="nk-pagehead__sub">Pemesanan jangka pendek.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memuat kos harian…</p>

    <EmptyState
      v-else-if="error && stays.length === 0"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <template v-else>
      <form class="form nk-rise" @submit.prevent="confirmSubmit">
        <h2 class="nk-sect">Pemesanan baru</h2>

        <div class="nk-field">
          <label class="nk-label">Kamar</label>
          <Select
            v-model="form.room_id"
            :options="roomOptions"
            option-label="label"
            option-value="value"
            class="w-full"
            required
          />
        </div>
        <div class="grid">
          <div class="nk-field">
            <label class="nk-label">Nama tamu</label>
            <InputText v-model="form.nama_tamu" required />
          </div>
          <div class="nk-field">
            <label class="nk-label">Kontak</label>
            <InputText v-model="form.kontak_tamu" required />
          </div>
        </div>
        <div class="grid">
          <div class="nk-field">
            <label class="nk-label">Masuk</label>
            <DateField v-model="form.tanggal_masuk" placeholder="Tanggal masuk" />
          </div>
          <div class="nk-field">
            <label class="nk-label">Keluar</label>
            <DateField v-model="form.tanggal_keluar" :min-date="form.tanggal_masuk" placeholder="Tanggal keluar" />
          </div>
        </div>
        <div class="nk-field">
          <label class="nk-label">Tarif per malam</label>
          <InputNumber v-model="form.tarif_per_malam" :min="1" class="w-full" />
        </div>

        <Message v-if="message" severity="success" size="small">{{ message }}</Message>
        <Message v-if="error" severity="error" size="small">{{ error }}</Message>
        <Button type="submit" label="Simpan" icon="pi pi-save" :loading="saving" />
      </form>

      <section class="nk-stack" style="gap: 10px">
        <h2 class="nk-sect">Daftar pemesanan</h2>
        <EmptyState
          v-if="stays.length === 0"
          icon="pi pi-calendar"
          title="Belum ada pemesanan"
          description="Pemesanan kos harian akan tampil di sini."
        />
        <article v-for="stay in stays" :key="stay.id" class="stay nk-rise">
          <div class="stay__top">
            <div>
              <p class="stay__name">{{ stay.nama_tamu }}</p>
              <p class="stay__date">{{ tanggal(stay.tanggal_masuk) }} - {{ tanggal(stay.tanggal_keluar) }}</p>
            </div>
            <Tag :value="statusMeta[stay.status].label" :severity="statusMeta[stay.status].severity" />
          </div>
          <div class="stay__meta">
            <span>Kamar {{ rooms.find((r) => r.id === stay.room_id)?.nomor ?? stay.room_id }}</span>
            <strong>{{ rupiah(stay.total) }}</strong>
          </div>
          <div v-if="['menunggu_konfirmasi', 'dikonfirmasi', 'menginap'].includes(stay.status)" class="stay__actions">
            <Button
              v-if="stay.status === 'menunggu_konfirmasi'"
              label="Setujui"
              icon="pi pi-check"
              size="small"
              @click="confirmAksi(stay, 'approve')"
            />
            <Button
              v-if="['dikonfirmasi', 'menginap'].includes(stay.status)"
              label="Selesai"
              icon="pi pi-flag"
              size="small"
              @click="confirmAksi(stay, 'finish')"
            />
            <Button
              label="Batalkan"
              icon="pi pi-times"
              severity="danger"
              outlined
              size="small"
              @click="confirmAksi(stay, 'reject')"
            />
          </div>
        </article>
      </section>
    </template>
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
.form,
.stay {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.form { display: flex; flex-direction: column; gap: 12px; }
.grid { display: grid; gap: 12px; }
.stay { display: flex; flex-direction: column; gap: 12px; }
.stay__top,
.stay__meta,
.stay__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.stay__actions { justify-content: flex-end; flex-wrap: wrap; }
.stay__name { margin: 0; font-size: 14px; font-weight: 700; color: var(--ink); }
.stay__date { margin: 4px 0 0; font-size: 12px; color: var(--ink-soft); }
.stay__meta { border-top: 1px solid var(--line); padding-top: 10px; font-size: 13px; color: var(--ink-soft); }
.stay__meta strong { color: var(--ink); }
.w-full { width: 100%; }
</style>
