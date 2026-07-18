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
type Charts = { labels: string[]; pendapatan: number[]; pengeluaran: number[] }
type Booking = { id: number; nama: string; kontak: string | null; room_id: number; status: string }
type Payment = { id: number; invoice_id: number; nominal: number; status: string; tanggal_transfer: string | null }

const auth = useAuthStore()
const api = useApi()

const stats = ref<Stats | null>(null)
const charts = ref<Charts | null>(null)
const bookings = ref<Booking[]>([])
const payments = ref<Payment[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? 'Admin')
const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID')

const occupancyRate = computed(() => {
  const s = stats.value
  if (!s || s.total_kamar === 0) return 0
  return Math.round((s.kamar_terisi / s.total_kamar) * 100)
})

const periode = computed(() => {
  const c = charts.value
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const fmt = (l?: string) => {
    if (!l) return ''
    const [y, m] = l.split('-')
    return `${months[parseInt(m, 10) - 1]} ${y}`
  }
  if (!c?.labels?.length) return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  return `${fmt(c.labels[0])} – ${fmt(c.labels[c.labels.length - 1])}`
})

const kpis = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: 'Total Kos', value: String(s.total_kos), icon: 'pi pi-home', sub: 'properti terdaftar' },
    { label: 'Total Kamar', value: String(s.total_kamar), icon: 'pi pi-th-large', sub: `${s.kamar_kosong} kamar kosong` },
    { label: 'Kamar Terisi', value: String(s.kamar_terisi), icon: 'pi pi-chart-line', sub: `${occupancyRate.value}% dari total kamar` },
    { label: 'Total Penyewa', value: String(s.total_penghuni), icon: 'pi pi-users', sub: 'penghuni aktif' },
    { label: 'Pendapatan Bulan Ini', value: rupiah(s.pendapatan_bulan_ini), icon: 'pi pi-wallet', sub: 'bulan berjalan', money: true },
  ]
})

const pengingat = computed(() => {
  const s = stats.value
  return [
    { icon: 'pi pi-inbox', title: `${s?.kamar_kosong ?? 0} kamar siap disewakan`, sub: 'Kamar kosong menunggu penghuni', to: '/admin/kamar' },
    { icon: 'pi pi-wallet', title: 'Pantau pembayaran masuk', sub: 'Verifikasi pembayaran & tagihan', to: '/admin/tagihan' },
    { icon: 'pi pi-comment', title: 'Tanggapi pengaduan', sub: 'Cek keluhan dari penghuni', to: '/admin/pengaduan' },
  ]
})

const bookingStatus: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Menunggu', tone: 'warn' },
  menunggu: { label: 'Menunggu', tone: 'warn' },
  approved: { label: 'Dikonfirmasi', tone: 'ok' },
  disetujui: { label: 'Dikonfirmasi', tone: 'ok' },
  rejected: { label: 'Ditolak', tone: 'bad' },
  ditolak: { label: 'Ditolak', tone: 'bad' },
}
const initial = (name: string) => (name?.[0] ?? '?').toUpperCase()
const isLunas = (s: string) => s === 'approved' || s === 'lunas'
const txLink = (tipe: 'booking' | 'payment', id: number) => `/admin/transaksi?tipe=${tipe}#${tipe}-${id}`

async function load() {
  loading.value = true
  error.value = null
  try {
    const [s, c] = await Promise.all([
      api<Stats>('/dashboard/stats'),
      api<Charts>('/dashboard/charts'),
    ])
    stats.value = s
    charts.value = c
    // list terbaru (opsional — tampil apa adanya, empty state bila kosong)
    try { bookings.value = (await api<{ data: Booking[] }>('/bookings')).data.slice(0, 4) } catch { bookings.value = [] }
    try { payments.value = (await api<{ data: Payment[] }>('/payments')).data.slice(0, 4) } catch { payments.value = [] }
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
    <!-- Welcome -->
    <header class="dash__welcome">
      <div>
        <h2>Selamat datang kembali, {{ firstName }}!</h2>
        <p>Kelola data kos Anda dengan mudah dan efektif.</p>
      </div>
      <span class="dash__period"><i class="pi pi-calendar" />{{ periode }}</span>
    </header>

    <div v-if="loading" class="kpis">
      <div v-for="n in 5" :key="n" class="kpi kpi--skel" />
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
      <!-- KPI -->
      <section class="kpis">
        <article v-for="k in kpis" :key="k.label" class="kpi">
          <span class="kpi__ic"><i :class="k.icon" /></span>
          <div class="kpi__body">
            <span class="kpi__label">{{ k.label }}</span>
            <span class="kpi__val" :class="{ 'kpi__val--money': k.money }">{{ k.value }}</span>
            <span class="kpi__sub">{{ k.sub }}</span>
          </div>
        </article>
      </section>

      <!-- Charts -->
      <div class="grid-2">
        <section class="panel">
          <div class="panel__head">
            <h3>Ringkasan Pendapatan</h3>
            <div class="legend">
              <span><i class="legend__ln legend__ln--in" /> Pendapatan</span>
              <span><i class="legend__ln legend__ln--out" /> Pengeluaran</span>
            </div>
          </div>
          <DashRevenueChart
            v-if="charts"
            :labels="charts.labels"
            :pendapatan="charts.pendapatan"
            :pengeluaran="charts.pengeluaran"
          />
        </section>

        <section class="panel">
          <div class="panel__head"><h3>Tingkat Hunian Kos</h3></div>
          <div class="occ">
            <DashDonut :terisi="stats.kamar_terisi" :kosong="stats.kamar_kosong" />
            <div class="occ__legend">
              <div class="occ__item">
                <span class="occ__dot occ__dot--in" />
                <div>
                  <strong>Terisi</strong>
                  <p>{{ stats.kamar_terisi }} kamar ({{ occupancyRate }}%)</p>
                </div>
              </div>
              <div class="occ__item">
                <span class="occ__dot occ__dot--out" />
                <div>
                  <strong>Kosong</strong>
                  <p>{{ stats.kamar_kosong }} kamar ({{ 100 - occupancyRate }}%)</p>
                </div>
              </div>
              <div class="occ__total">
                <span>Total</span>
                <strong>{{ stats.total_kamar }} kamar</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Lists -->
      <div class="grid-3">
        <section class="panel">
          <div class="panel__head">
            <h3>Pemesanan Terbaru</h3>
            <NuxtLink to="/admin/transaksi?tipe=booking" class="panel__link">Lihat Semua</NuxtLink>
          </div>
          <ul v-if="bookings.length" class="list">
            <li v-for="b in bookings" :key="b.id">
              <NuxtLink :to="txLink('booking', b.id)" class="list__row list__row--link">
              <span class="list__avatar">{{ initial(b.nama) }}</span>
              <div class="list__main">
                <strong>{{ b.nama }}</strong>
                <p>Kamar #{{ b.room_id }}</p>
              </div>
              <span class="tag" :class="`tag--${bookingStatus[b.status]?.tone ?? 'warn'}`">
                {{ bookingStatus[b.status]?.label ?? b.status }}
              </span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="list__empty">Belum ada pemesanan.</p>
        </section>

        <section class="panel">
          <div class="panel__head">
            <h3>Pembayaran Terbaru</h3>
            <NuxtLink to="/admin/transaksi?tipe=payment" class="panel__link">Lihat Semua</NuxtLink>
          </div>
          <ul v-if="payments.length" class="list">
            <li v-for="p in payments" :key="p.id">
              <NuxtLink :to="txLink('payment', p.id)" class="list__row list__row--link">
              <span class="list__doc"><i class="pi pi-file" /></span>
              <div class="list__main">
                <strong>Invoice #{{ p.invoice_id }}</strong>
                <p>{{ p.tanggal_transfer ?? '—' }}</p>
              </div>
              <div class="list__right">
                <strong>{{ rupiah(p.nominal) }}</strong>
                <span class="tag" :class="isLunas(p.status) ? 'tag--ok' : 'tag--warn'">
                  {{ isLunas(p.status) ? 'Lunas' : 'Pending' }}
                </span>
              </div>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="list__empty">Belum ada pembayaran.</p>
        </section>

        <section class="panel">
          <div class="panel__head"><h3>Pengingat</h3></div>
          <ul class="reminders">
            <li v-for="(r, i) in pengingat" :key="i" class="reminder">
              <span class="reminder__ic"><i :class="r.icon" /></span>
              <div class="reminder__main">
                <strong>{{ r.title }}</strong>
                <p>{{ r.sub }}</p>
              </div>
              <NuxtLink :to="r.to" class="reminder__link">Lihat detail</NuxtLink>
            </li>
          </ul>
        </section>
      </div>

      <footer class="dash__foot">
        <span>© {{ new Date().getFullYear() }} Ngekoskuy. All rights reserved.</span>
        <span>v1.0.0</span>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.dash { display: flex; flex-direction: column; gap: 22px; }

/* Welcome */
.dash__welcome {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.dash__welcome h2 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--brand-strong); }
.dash__welcome p { margin: 6px 0 0; font-size: 14px; color: var(--ink-soft); }
.dash__period {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  box-shadow: var(--shadow);
}
.dash__period i { color: var(--brand); }

/* KPI */
.kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
.kpi {
  display: flex;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px;
}
.kpi--skel { min-height: 104px; background: var(--surface-2); box-shadow: none; }
.kpi__ic {
  width: 50px; height: 50px;
  flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #5c3f28, var(--brand-strong));
  color: var(--sand);
  font-size: 20px;
}
.kpi__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.kpi__label { font-size: 12.5px; color: var(--ink-soft); }
.kpi__val { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--brand-strong); line-height: 1.1; }
.kpi__val--money { font-size: 19px; }
.kpi__sub { font-size: 11.5px; color: #2f9e6a; }

/* Panels */
.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px;
}
.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.panel__head h3 { margin: 0; font-size: 17px; font-weight: 700; color: var(--brand-strong); }
.panel__link {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  background: var(--sand-soft);
  padding: 6px 12px;
  border-radius: 999px;
}
.legend { display: flex; gap: 16px; font-size: 12.5px; color: var(--ink-soft); }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend__ln { width: 16px; height: 3px; border-radius: 2px; display: inline-block; }
.legend__ln--in { background: var(--brand); }
.legend__ln--out { background: var(--sand); }

.grid-2 { display: grid; grid-template-columns: 1.6fr 1fr; gap: 18px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

/* Occupancy */
.occ { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.occ__legend { flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 14px; }
.occ__item { display: flex; align-items: center; gap: 10px; }
.occ__dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.occ__dot--in { background: var(--brand); }
.occ__dot--out { background: var(--sand); }
.occ__item strong { font-size: 13.5px; color: var(--brand-strong); }
.occ__item p { margin: 1px 0 0; font-size: 12px; color: var(--ink-soft); }
.occ__total {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 12px; border-top: 1px solid var(--line);
  font-size: 13px; color: var(--ink-soft);
}
.occ__total strong { color: var(--brand-strong); }

/* Lists */
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.list__row { display: flex; align-items: center; gap: 12px; padding: 12px 0; color: inherit; }
.list__row--link { border-radius: 12px; padding-inline: 8px; margin-inline: -8px; transition: background .16s ease; }
.list__row--link:hover { background: var(--surface-2); }
.list li + li { border-top: 1px solid var(--line); }
.list__avatar {
  width: 40px; height: 40px; flex-shrink: 0;
  display: grid; place-items: center; border-radius: 50%;
  background: var(--brand); color: var(--sand); font-weight: 700; font-size: 14px;
}
.list__doc {
  width: 40px; height: 40px; flex-shrink: 0;
  display: grid; place-items: center; border-radius: 11px;
  background: var(--sand-soft); color: var(--brand); font-size: 15px;
}
.list__main { flex: 1; min-width: 0; }
.list__main strong { font-size: 13.5px; color: var(--brand-strong); display: block; }
.list__main p { margin: 2px 0 0; font-size: 12px; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.list__right { text-align: right; display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.list__right strong { font-size: 13.5px; color: var(--brand-strong); }
.list__empty { margin: 0; padding: 24px 0; text-align: center; color: var(--ink-soft); font-size: 13px; }

.tag { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
.tag--ok { background: #e3f5ec; color: #2f9e6a; }
.tag--warn { background: #fdf3e2; color: #c6852e; }
.tag--bad { background: #f6e7e4; color: var(--danger); }

/* Reminders */
.reminders { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.reminder {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface-2);
  border-radius: 14px;
  padding: 14px;
}
.reminder__ic {
  width: 40px; height: 40px; flex-shrink: 0;
  display: grid; place-items: center; border-radius: 11px;
  background: #fff; color: var(--brand); font-size: 16px;
}
.reminder__main { flex: 1; min-width: 0; }
.reminder__main strong { font-size: 13px; color: var(--brand-strong); display: block; }
.reminder__main p { margin: 2px 0 0; font-size: 11.5px; color: var(--ink-soft); }
.reminder__link { font-size: 11.5px; font-weight: 600; color: var(--brand); white-space: nowrap; }

/* Footer */
.dash__foot {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 12px; border-top: 1px solid var(--line);
  font-size: 12px; color: var(--ink-soft);
}

/* Responsive */
@media (max-width: 1200px) { .kpis { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 1000px) {
  .grid-2 { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: 1fr; }
}
@media (max-width: 640px) { .kpis { grid-template-columns: 1fr 1fr; } }
</style>
