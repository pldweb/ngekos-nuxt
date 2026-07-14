<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Stats = {
  total_kos: number
  total_kamar: number
  kamar_terisi: number
  kamar_kosong: number
  total_penghuni: number
  pendapatan_bulan_ini: number
  pengeluaran_bulan_ini: number
  laba_bulan_ini: number
}

type ProfitLoss = {
  period: string
  income: number
  expense: number
  profit: number
}
type Occupancy = {
  months: string[]
  data: Array<{
    room_id: number
    nomor: string
    kos_id: number
    bulan: Record<string, 'terisi' | 'kosong'>
  }>
}
type ExpenseCategory = {
  kategori: string
  tipe: string
  jumlah_transaksi: number
  total: number
}
type ExpenseByCategory = {
  period: string
  data: ExpenseCategory[]
}

const api = useApi()

const stats = ref<Stats | null>(null)
const pl = ref<ProfitLoss | null>(null)
const occupancy = ref<Occupancy | null>(null)
const expenseCategories = ref<ExpenseCategory[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')
const bulanIni = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
const monthShort = (p: string) => {
  const [y, m] = p.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short' })
}
const tipeLabel: Record<string, string> = {
  operasional: 'Operasional',
  aset: 'Aset',
  non_operasional: 'Non-operasional',
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [s, p, o, e] = await Promise.all([
      api<Stats>('/dashboard/stats'),
      api<ProfitLoss>('/reports/profit-loss'),
      api<Occupancy>('/reports/occupancy'),
      api<ExpenseByCategory>('/reports/expenses-by-category'),
    ])
    stats.value = s
    pl.value = p
    occupancy.value = o
    expenseCategories.value = e.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat laporan.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Laporan</h1>
      <p class="nk-pagehead__sub">Ringkasan properti & keuangan {{ bulanIni }}.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memuat laporan…</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <template v-else-if="stats && pl">
      <section class="cards">
        <div class="card nk-rise">
          <span class="card__label">Kos</span>
          <span class="card__val">{{ stats.total_kos }}</span>
        </div>
        <div class="card nk-rise">
          <span class="card__label">Penghuni aktif</span>
          <span class="card__val">{{ stats.total_penghuni }}</span>
        </div>
        <div class="card nk-rise">
          <span class="card__label">Kamar terisi</span>
          <span class="card__val">{{ stats.kamar_terisi }}<small>/{{ stats.total_kamar }}</small></span>
        </div>
        <div class="card nk-rise">
          <span class="card__label">Kamar kosong</span>
          <span class="card__val">{{ stats.kamar_kosong }}</span>
        </div>
      </section>

      <div class="reportgrid">
        <section class="pl nk-rise">
          <h2 class="nk-sect">Laba / rugi bulan ini</h2>
          <div class="pl__row">
            <span>Pendapatan</span>
            <strong class="pl__in">{{ rupiah(pl.income) }}</strong>
          </div>
          <div class="pl__row">
            <span>Pengeluaran</span>
            <strong class="pl__out">{{ rupiah(pl.expense) }}</strong>
          </div>
          <div class="pl__row pl__row--total">
            <span>Laba bersih</span>
            <strong :class="pl.profit >= 0 ? 'pl__in' : 'pl__out'">{{ rupiah(pl.profit) }}</strong>
          </div>
        </section>

        <section v-if="expenseCategories.length" class="panel nk-rise">
          <h2 class="nk-sect">Pengeluaran per kategori</h2>
          <div class="cat">
            <div v-for="row in expenseCategories" :key="`${row.kategori}-${row.tipe}`" class="cat__row">
              <div>
                <p class="cat__name">{{ row.kategori }}</p>
                <p class="cat__meta">{{ tipeLabel[row.tipe] ?? row.tipe }} · {{ row.jumlah_transaksi }} transaksi</p>
              </div>
              <strong>{{ rupiah(row.total) }}</strong>
            </div>
          </div>
        </section>
      </div>

      <section v-if="occupancy" class="panel nk-rise">
        <h2 class="nk-sect">Okupansi kamar</h2>
        <div class="occ">
          <div class="occ__head">
            <span>Kamar</span>
            <span v-for="month in occupancy.months" :key="month">{{ monthShort(month) }}</span>
          </div>
          <div v-for="room in occupancy.data" :key="room.room_id" class="occ__row">
            <strong>{{ room.nomor }}</strong>
            <span
              v-for="month in occupancy.months"
              :key="month"
              class="occ__dot"
              :class="room.bulan[month] === 'terisi' ? 'occ__dot--filled' : 'occ__dot--empty'"
              :title="`${room.nomor} ${month}: ${room.bulan[month]}`"
            />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.reportgrid { display: grid; gap: 16px; }

/* Lebar admin (desktop) */
@container appview (min-width: 680px) {
  .cards { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
  .reportgrid { grid-template-columns: 1fr 1fr; align-items: start; }
}
.card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px 18px;
}
.card__label { font-size: 12px; color: var(--ink-soft); font-weight: 500; }
.card__val { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
.card__val small { font-size: 15px; font-weight: 500; color: var(--ink-soft); }

.pl {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px 20px;
}
.pl__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: var(--ink-soft);
  padding: 8px 0;
}
.pl__row--total {
  border-top: 1px solid var(--line);
  margin-top: 6px;
  padding-top: 14px;
  font-weight: 600;
  color: var(--ink);
}
.pl__in { color: #2f9e6a; }
.pl__out { color: var(--danger); }
.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.cat { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.cat__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.cat__row:first-child { border-top: 0; padding-top: 0; }
.cat__name { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); text-transform: capitalize; }
.cat__meta { margin: 3px 0 0; font-size: 12px; color: var(--ink-soft); }
.cat__row strong { font-size: 13px; color: var(--ink); white-space: nowrap; }
.occ { margin-top: 10px; overflow-x: auto; padding-bottom: 2px; }
.occ__head,
.occ__row {
  display: grid;
  grid-template-columns: 54px repeat(12, 30px);
  align-items: center;
  gap: 6px;
  min-width: 420px;
}
.occ__head {
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 600;
  padding-bottom: 8px;
}
.occ__row { min-height: 30px; border-top: 1px solid var(--line); }
.occ__row strong { font-size: 12px; color: var(--ink); }
.occ__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  justify-self: center;
  border: 1px solid var(--line);
}
.occ__dot--filled { background: #2f9e6a; border-color: #2f9e6a; }
.occ__dot--empty { background: var(--surface-2); }
</style>
