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

const api = useApi()

const stats = ref<Stats | null>(null)
const pl = ref<ProfitLoss | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')
const bulanIni = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const [s, p] = await Promise.all([
      api<Stats>('/dashboard/stats'),
      api<ProfitLoss>('/reports/profit-loss'),
    ])
    stats.value = s
    pl.value = p
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
    </template>
  </div>
</template>

<style scoped>
.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
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
</style>
