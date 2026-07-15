<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Log = {
  id: number
  user_id: number | null
  user_nama: string | null
  aksi: string
  deskripsi: string
  ip_address: string | null
  user_agent: string | null
  subjek_type: string | null
  subjek_id: number | null
  properti: Record<string, unknown> | null
  created_at: string | null
}

const api = useApi()

const logs = ref<Log[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const filterAksi = ref<string | null>(null)

const detail = ref<Log | null>(null)
const detailOpen = ref(false)

const aksiMeta: Record<string, { label: string; severity: string; icon: string }> = {
  login: { label: 'Login', severity: 'info', icon: 'pi pi-sign-in' },
  create: { label: 'Tambah', severity: 'success', icon: 'pi pi-plus' },
  update: { label: 'Ubah', severity: 'warn', icon: 'pi pi-pencil' },
  delete: { label: 'Hapus', severity: 'danger', icon: 'pi pi-trash' },
}
const meta = (a: string) => aksiMeta[a] ?? { label: a, severity: 'secondary', icon: 'pi pi-circle' }

const aksiOptions = [
  { label: 'Semua aksi', value: null },
  { label: 'Login', value: 'login' },
  { label: 'Tambah', value: 'create' },
  { label: 'Ubah', value: 'update' },
  { label: 'Hapus', value: 'delete' },
]

const filtered = computed(() =>
  filterAksi.value ? logs.value.filter((l) => l.aksi === filterAksi.value) : logs.value,
)

const initials = (n: string | null) =>
  (n ?? '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

const waktuSingkat = (s: string | null) =>
  s ? new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const waktuLengkap = (s: string | null) =>
  s
    ? new Date(s).toLocaleString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : '—'

/** Parse ringan user-agent → browser & OS. */
function parseUA(ua: string | null) {
  if (!ua) return { browser: 'Tidak diketahui', os: 'Tidak diketahui' }
  let browser = 'Lainnya'
  if (/Edg\//.test(ua)) browser = 'Microsoft Edge'
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera'
  else if (/Chrome\//.test(ua)) browser = 'Google Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Mozilla Firefox'
  else if (/Safari\//.test(ua)) browser = 'Safari'

  let os = 'Lainnya'
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iOS/.test(ua)) os = 'iOS'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Linux/.test(ua)) os = 'Linux'

  return { browser, os }
}

function openDetail(l: Log) {
  detail.value = l
  detailOpen.value = true
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: Log[] }>('/activity-logs')
    logs.value = res.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat log aktivitas.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="head">
      <div>
        <h1 class="nk-pagehead__title">Log Aktivitas</h1>
        <p class="nk-pagehead__sub">Riwayat setiap kegiatan pengguna di sistem.</p>
      </div>
      <Select
        v-model="filterAksi"
        :options="aksiOptions"
        option-label="label"
        option-value="value"
        placeholder="Filter aksi"
      />
    </header>

    <p v-if="loading" class="nk-muted">Memuat log…</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <EmptyState
      v-else-if="filtered.length === 0"
      icon="pi pi-history"
      title="Belum ada aktivitas"
      description="Kegiatan pengguna akan tercatat di sini."
    />

    <div v-else class="log__wrap">
      <table class="log">
        <thead>
          <tr>
            <th>Aktivitas</th>
            <th class="log__hide-sm">IP Address</th>
            <th class="log__hide-sm">Waktu</th>
            <th class="text-right">Opsi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in filtered" :key="l.id">
            <td>
              <div class="flex items-center gap-3">
                <span class="log__avatar">{{ initials(l.user_nama) }}</span>
                <div class="min-w-0">
                  <p class="log__desc">{{ l.deskripsi }}</p>
                  <p class="log__sub">
                    <Tag :value="meta(l.aksi).label" :severity="meta(l.aksi).severity" />
                    <span class="log__show-sm">· {{ waktuSingkat(l.created_at) }}</span>
                  </p>
                </div>
              </div>
            </td>
            <td class="log__hide-sm"><span class="log__ip">{{ l.ip_address ?? '—' }}</span></td>
            <td class="log__hide-sm">{{ waktuSingkat(l.created_at) }}</td>
            <td class="text-right">
              <Button label="Detail" icon="pi pi-arrow-up-right" size="small" text @click="openDetail(l)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog detail -->
    <Dialog v-model:visible="detailOpen" modal header="Detail aktivitas" :style="{ width: '92vw', maxWidth: '460px' }">
      <div v-if="detail" class="det">
        <div class="det__head">
          <span class="det__ic" :class="`is-${detail.aksi}`"><i :class="meta(detail.aksi).icon" /></span>
          <div>
            <p class="det__desc">{{ detail.deskripsi }}</p>
            <Tag :value="meta(detail.aksi).label" :severity="meta(detail.aksi).severity" />
          </div>
        </div>

        <div class="det__list">
          <div class="det__row"><span>Pelaku</span><strong>{{ detail.user_nama ?? 'Sistem' }}</strong></div>
          <div class="det__row"><span>Waktu</span><strong>{{ waktuLengkap(detail.created_at) }}</strong></div>
          <div class="det__row"><span>IP Address</span><strong>{{ detail.ip_address ?? '—' }}</strong></div>
          <div class="det__row"><span>Browser</span><strong>{{ parseUA(detail.user_agent).browser }}</strong></div>
          <div class="det__row"><span>Sistem</span><strong>{{ parseUA(detail.user_agent).os }}</strong></div>
          <div v-if="detail.subjek_type" class="det__row">
            <span>Objek</span><strong>{{ detail.subjek_type }} #{{ detail.subjek_id }}</strong>
          </div>
        </div>

        <div v-if="detail.user_agent" class="det__ua">
          <p class="det__ua-k">User agent</p>
          <p class="det__ua-v">{{ detail.user_agent }}</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; }

.log__wrap {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.log { width: 100%; border-collapse: collapse; }
.log thead th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
  padding: 13px 18px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-2);
}
.log tbody td { padding: 13px 18px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.log tbody tr:last-child td { border-bottom: 0; }
.log tbody tr:hover { background: var(--surface-2); }
.log__avatar {
  width: 40px; height: 40px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 50%;
  background: var(--sand-soft); color: var(--brand);
  font-weight: 700; font-size: 13px;
}
.log__desc { margin: 0; font-size: 14px; font-weight: 500; color: var(--ink); }
.log__sub { margin: 5px 0 0; display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ink-soft); }
.log__show-sm { display: none; }
.log__ip { font-family: ui-monospace, monospace; font-size: 13px; color: var(--ink); }
.text-right { text-align: right; }

.det { display: flex; flex-direction: column; gap: 16px; }
.det__head { display: flex; align-items: center; gap: 14px; }
.det__ic {
  width: 48px; height: 48px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 14px;
  background: var(--sand-soft); color: var(--brand); font-size: 20px;
}
.det__ic.is-delete { background: #f6e7e4; color: var(--danger); }
.det__ic.is-create { background: #e3f5ec; color: #2f9e6b; }
.det__desc { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: var(--ink); }
.det__list { display: flex; flex-direction: column; }
.det__row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 11px 0; border-bottom: 1px solid var(--line);
  font-size: 13.5px;
}
.det__row:last-child { border-bottom: 0; }
.det__row span { color: var(--ink-soft); }
.det__row strong { color: var(--ink); font-weight: 600; text-align: right; }
.det__ua { background: var(--surface-2); border-radius: 12px; padding: 12px 14px; }
.det__ua-k { margin: 0 0 4px; font-size: 12px; color: var(--ink-soft); }
.det__ua-v { margin: 0; font-size: 12px; color: var(--ink); word-break: break-all; font-family: ui-monospace, monospace; }

@media (max-width: 640px) {
  .log__hide-sm { display: none; }
  .log__show-sm { display: inline; }
}
</style>
