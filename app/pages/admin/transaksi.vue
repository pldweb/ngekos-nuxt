<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type TxStatus = 'pending' | 'approved' | 'rejected' | 'belum_bayar' | 'menunggu_verifikasi' | 'dibayar_sebagian' | 'lunas' | 'terlambat' | string
type Transaction = {
  id: string
  tipe: 'payment' | 'booking'
  ref_id: number
  waktu: string | null
  tanggal_transaksi: string | null
  penghuni: string
  kontak: string | null
  kos: string | null
  kamar: string | null
  status: TxStatus
  status_bayar: TxStatus | null
  metode: string | null
  nominal: number | null
  periode: string | null
  catatan: string | null
  mulai: string | null
  selesai: string | null
  durasi_sewa?: number
}

const route = useRoute()
const api = useApi()
const loading = ref(true)
const error = ref<string | null>(null)
const items = ref<Transaction[]>([])
const routeTipe = route.query.tipe === 'payment' || route.query.tipe === 'booking' ? route.query.tipe : 'semua'
const tipe = ref<'semua' | 'payment' | 'booking'>(routeTipe)
const q = ref('')

const tipeOptions = [
  { label: 'Semua', value: 'semua' },
  { label: 'Pembayaran', value: 'payment' },
  { label: 'Booking', value: 'booking' },
]
const statusMeta: Record<string, { label: string; severity: 'info' | 'success' | 'warn' | 'danger' | 'secondary' }> = {
  pending: { label: 'Menunggu', severity: 'info' },
  approved: { label: 'Disetujui', severity: 'success' },
  rejected: { label: 'Ditolak', severity: 'danger' },
  belum_bayar: { label: 'Belum bayar', severity: 'warn' },
  menunggu_verifikasi: { label: 'Verifikasi', severity: 'info' },
  dibayar_sebagian: { label: 'Sebagian', severity: 'warn' },
  lunas: { label: 'Lunas', severity: 'success' },
  terlambat: { label: 'Terlambat', severity: 'danger' },
}

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return items.value.filter((item) => {
    if (tipe.value !== 'semua' && item.tipe !== tipe.value) return false
    if (!term) return true
    return [item.penghuni, item.kontak, item.kos, item.kamar, item.metode, item.status, item.status_bayar]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  })
})

const rupiah = (n: number | null) => n == null ? '-' : 'Rp' + Number(n).toLocaleString('id-ID')
const tanggal = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
const waktu = (iso: string | null) => iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
const periodeLabel = (p: string | null) => {
  if (!p) return '-'
  const [y, m] = p.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}
const highlightedId = computed(() => route.hash ? route.hash.slice(1) : null)

function meta(status: TxStatus | null) {
  if (!status) return { label: '-', severity: 'secondary' as const }
  return statusMeta[status] ?? { label: String(status), severity: 'secondary' as const }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: Transaction[] }>('/transactions')
    items.value = res.data
    await nextTick()
    if (highlightedId.value) document.getElementById(highlightedId.value)?.scrollIntoView({ block: 'center' })
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat transaksi.'
  } finally {
    loading.value = false
  }
}

watch(() => route.query.tipe, (value) => {
  if (value === 'payment' || value === 'booking') tipe.value = value
})

watch(() => route.hash, async () => {
  await nextTick()
  if (highlightedId.value) document.getElementById(highlightedId.value)?.scrollIntoView({ block: 'center' })
})

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Transaksi</h1>
      <p class="nk-pagehead__sub">Pantau pembayaran dan pengajuan sewa dalam satu daftar.</p>
    </header>

    <section class="txfilter nk-rise">
      <Select v-model="tipe" :options="tipeOptions" option-label="label" option-value="value" class="txfilter__type" />
      <span class="txfilter__search">
        <i class="pi pi-search" />
        <InputText v-model="q" placeholder="Cari penghuni, kos, metode, status" class="w-full" />
      </span>
      <Button icon="pi pi-refresh" label="Muat ulang" outlined @click="load" />
    </section>

    <p v-if="loading" class="nk-muted">Memuat transaksi...</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <section v-else class="txlist">
      <article v-for="item in filtered" :id="item.id" :key="item.id" class="txcard nk-rise" :class="{ 'txcard--focus': highlightedId === item.id }">
        <div class="txcard__main">
          <span class="txcard__icon" :class="`is-${item.tipe}`">
            <i :class="item.tipe === 'payment' ? 'pi pi-credit-card' : 'pi pi-calendar-plus'" />
          </span>
          <div class="txcard__body">
            <div class="txcard__top">
              <strong>{{ item.tipe === 'payment' ? 'Pembayaran' : 'Booking' }} #{{ item.ref_id }}</strong>
              <Tag :value="meta(item.status).label" :severity="meta(item.status).severity" />
            </div>
            <p>{{ item.penghuni }} <span v-if="item.kontak">- {{ item.kontak }}</span></p>
            <small>{{ item.kos ?? 'Kos' }}<template v-if="item.kamar"> · Kamar {{ item.kamar }}</template></small>
          </div>
        </div>

        <div class="txcard__grid">
          <span><small>Waktu transaksi</small><strong>{{ waktu(item.waktu) }}</strong></span>
          <span><small>Metode</small><strong>{{ item.metode ?? '-' }}</strong></span>
          <span><small>Nominal</small><strong>{{ rupiah(item.nominal) }}</strong></span>
          <span><small>Status bayar</small><Tag :value="meta(item.status_bayar).label" :severity="meta(item.status_bayar).severity" /></span>
          <span><small>Periode</small><strong>{{ periodeLabel(item.periode) }}</strong></span>
          <span><small>Mulai</small><strong>{{ tanggal(item.mulai) }}</strong></span>
          <span><small>Sampai</small><strong>{{ tanggal(item.selesai) }}</strong></span>
          <span v-if="item.durasi_sewa"><small>Durasi</small><strong>{{ item.durasi_sewa }} bulan</strong></span>
        </div>

        <p v-if="item.catatan" class="txcard__note">{{ item.catatan }}</p>
      </article>

      <EmptyState
        v-if="!filtered.length"
        icon="pi pi-receipt"
        title="Belum ada transaksi"
        description="Transaksi akan muncul setelah ada pembayaran atau pengajuan sewa."
      />
    </section>
  </div>
</template>

<style scoped>
.txfilter {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 12px;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px;
}
.txfilter__search { display: flex; align-items: center; gap: 10px; color: var(--ink-soft); }
.txlist { display: grid; gap: 12px; }
.txcard {
  scroll-margin-top: 96px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.txcard--focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(122, 84, 52, 0.14), var(--shadow); }
.txcard__main { display: flex; gap: 12px; align-items: flex-start; }
.txcard__icon {
  width: 42px; height: 42px;
  display: grid; place-items: center;
  border-radius: 12px;
  background: var(--sand-soft);
  color: var(--brand);
  flex: 0 0 auto;
}
.txcard__icon.is-booking { background: #edf7f1; color: #24754d; }
.txcard__body { min-width: 0; flex: 1; }
.txcard__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.txcard__top strong { color: var(--ink); }
.txcard__body p { margin: 5px 0 2px; font-size: 14px; color: var(--ink); }
.txcard__body small { color: var(--ink-soft); }
.txcard__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
.txcard__grid span { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.txcard__grid small { color: var(--ink-soft); font-size: 12px; }
.txcard__grid strong { color: var(--ink); font-size: 13px; overflow-wrap: anywhere; }
.txcard__note { margin: 12px 0 0; color: var(--ink-soft); font-size: 13px; }
.w-full { width: 100%; }
@media (max-width: 920px) {
  .txfilter { grid-template-columns: 1fr; }
  .txfilter__type { width: 100%; }
  .txcard__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .txcard__main { align-items: stretch; }
  .txcard__top { flex-direction: column; align-items: flex-start; }
  .txcard__grid { grid-template-columns: 1fr; }
}
</style>
