<script setup lang="ts">
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

const auth = useAuthStore()
const api = useApi()

const stats = ref<Stats | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '')
const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')
const bulanIni = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

const occupancyRate = computed(() => {
  if (!stats.value || stats.value.total_kamar === 0) return 0
  return Math.round((stats.value.kamar_terisi / stats.value.total_kamar) * 100)
})

const kpis = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: 'Total kamar', value: String(s.total_kamar), icon: 'pi pi-building', sub: `${s.total_kos} kos` },
    { label: 'Penghuni aktif', value: String(s.total_penghuni), icon: 'pi pi-users', sub: `${s.kamar_terisi} kamar terisi` },
    { label: 'Kamar kosong', value: String(s.kamar_kosong), icon: 'pi pi-inbox', sub: 'siap disewakan' },
    { label: 'Okupansi', value: occupancyRate.value + '%', icon: 'pi pi-chart-pie', sub: 'bulan berjalan' },
  ]
})

const money = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: 'Pendapatan', value: rupiah(s.pendapatan_bulan_ini), tone: 'in' as const },
    { label: 'Pengeluaran', value: rupiah(s.pengeluaran_bulan_ini), tone: 'out' as const },
    { label: 'Laba bersih', value: rupiah(s.laba_bulan_ini), tone: s.laba_bulan_ini >= 0 ? ('in' as const) : ('out' as const) },
  ]
})

const shortcuts = [
  { label: 'Kelola kamar', icon: 'pi pi-building', to: '/kamar' },
  { label: 'Data penghuni', icon: 'pi pi-users', to: '/penghuni' },
  { label: 'Tagihan', icon: 'pi pi-file', to: '/tagihan' },
  { label: 'Laporan', icon: 'pi pi-chart-bar', to: '/laporan' },
]

async function load() {
  loading.value = true
  error.value = null
  try {
    stats.value = await api<Stats>('/dashboard/stats')
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat ringkasan.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="dash">
    <header class="dash__head nk-rise">
      <div>
        <p class="dash__eyebrow">Dashboard · {{ bulanIni }}</p>
        <h2 class="dash__hello">
          <template v-if="firstName">Halo, {{ firstName }}</template>
          <template v-else>Selamat datang</template>
        </h2>
      </div>
      <NuxtLink to="/laporan" class="dash__report">
        Lihat laporan lengkap <i class="pi pi-arrow-right" />
      </NuxtLink>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="kpis">
      <div v-for="n in 4" :key="n" class="kpi kpi--skel" />
    </div>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <template v-else-if="stats">
      <section class="kpis">
        <article v-for="k in kpis" :key="k.label" class="kpi nk-rise">
          <span class="kpi__ic"><i :class="k.icon" /></span>
          <span class="kpi__val">{{ k.value }}</span>
          <span class="kpi__label">{{ k.label }}</span>
          <span class="kpi__sub">{{ k.sub }}</span>
        </article>
      </section>

      <div class="grid2">
        <section class="panel nk-rise">
          <div class="panel__head">
            <h3 class="panel__title">Keuangan bulan ini</h3>
            <span class="panel__tag">{{ bulanIni }}</span>
          </div>
          <div class="money">
            <div v-for="m in money" :key="m.label" class="money__row">
              <span class="money__label">{{ m.label }}</span>
              <strong :class="m.tone === 'in' ? 'is-in' : 'is-out'">{{ m.value }}</strong>
            </div>
          </div>
        </section>

        <section class="panel nk-rise">
          <div class="panel__head">
            <h3 class="panel__title">Okupansi kamar</h3>
            <span class="panel__tag">{{ stats.kamar_terisi }}/{{ stats.total_kamar }}</span>
          </div>
          <div class="occ">
            <div class="occ__bar">
              <div class="occ__fill" :style="{ width: occupancyRate + '%' }" />
            </div>
            <p class="occ__pct">{{ occupancyRate }}% terisi</p>
            <div class="occ__legend">
              <span><i class="dot dot--in" /> Terisi {{ stats.kamar_terisi }}</span>
              <span><i class="dot dot--out" /> Kosong {{ stats.kamar_kosong }}</span>
            </div>
          </div>
        </section>
      </div>

      <section class="shortcuts nk-rise">
        <NuxtLink v-for="s in shortcuts" :key="s.to" :to="s.to" class="shortcut">
          <span class="shortcut__ic"><i :class="s.icon" /></span>
          <span class="shortcut__label">{{ s.label }}</span>
          <i class="pi pi-angle-right shortcut__arrow" />
        </NuxtLink>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dash { display: flex; flex-direction: column; gap: 20px; }
.dash__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.dash__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand-soft);
}
.dash__hello {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.dash__report {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: var(--brand);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}
.kpi {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px 20px;
}
.kpi--skel { min-height: 132px; background: var(--surface-2); box-shadow: none; }
.kpi__ic {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 17px;
  margin-bottom: 14px;
}
.kpi__val { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); line-height: 1; }
.kpi__label { margin-top: 8px; font-size: 13.5px; font-weight: 600; color: var(--ink); }
.kpi__sub { margin-top: 2px; font-size: 12px; color: var(--ink-soft); }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px 22px;
}
.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.panel__title { margin: 0; font-size: 16px; font-weight: 700; color: var(--ink); }
.panel__tag {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  background: var(--sand-soft);
  padding: 4px 10px;
  border-radius: 999px;
}
.money { display: flex; flex-direction: column; }
.money__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 0;
  font-size: 14px;
  color: var(--ink-soft);
}
.money__row + .money__row { border-top: 1px solid var(--line); }
.money__row strong { font-size: 15px; }
.is-in { color: #2f9e6a; }
.is-out { color: var(--danger); }

.occ { display: flex; flex-direction: column; gap: 12px; }
.occ__bar {
  height: 12px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.occ__fill { height: 100%; border-radius: 999px; background: var(--brand); }
.occ__pct { margin: 0; font-size: 22px; font-weight: 700; color: var(--ink); }
.occ__legend { display: flex; gap: 18px; font-size: 13px; color: var(--ink-soft); }
.occ__legend span { display: inline-flex; align-items: center; gap: 7px; }
.dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.dot--in { background: var(--brand); }
.dot--out { background: var(--sand); }

.shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.shortcut {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 15px 16px;
  color: var(--ink);
  transition: border-color 0.15s, transform 0.15s;
}
.shortcut:hover { border-color: var(--sand); transform: translateY(-1px); }
.shortcut__ic {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 16px;
}
.shortcut__label { font-size: 14px; font-weight: 600; }
.shortcut__arrow { margin-left: auto; color: var(--ink-soft); }

@media (max-width: 720px) {
  .grid2 { grid-template-columns: 1fr; }
}
</style>
