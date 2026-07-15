<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Tenancy = {
  id: number
  kamar: string | null
  kos: string | null
  tanggal_masuk: string | null
  tanggal_keluar: string | null
  durasi_sewa: number | null
  tarif_disepakati: number | string | null
  status: string
}
type Tenant = {
  id: number
  nama: string
  no_hp: string
  email: string | null
  status: 'pending' | 'aktif' | 'nonaktif'
  tenancies?: Tenancy[]
}

const api = useApi()

const tenants = ref<Tenant[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const statusSeverity: Record<Tenant['status'], string> = {
  pending: 'warn',
  aktif: 'success',
  nonaktif: 'secondary',
}
const tenancySeverity: Record<string, string> = {
  aktif: 'success',
  selesai: 'secondary',
  nonaktif: 'secondary',
}

const rupiah = (n: number | string | null) =>
  n == null ? '—' : 'Rp' + Number(n).toLocaleString('id-ID')
const tanggal = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

/* ---------- Detail penghuni + daftar sewa ---------- */
const detailDialog = ref(false)
const detail = ref<Tenant | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)

async function openDetail(t: Tenant) {
  detail.value = t
  detailDialog.value = true
  detailLoading.value = true
  detailError.value = null
  try {
    const res = await api<{ tenant: Tenant }>(`/tenants/${t.id}`)
    detail.value = res.tenant
  } catch (e: any) {
    detailError.value = e?.data?.message ?? 'Gagal memuat detail penghuni.'
  } finally {
    detailLoading.value = false
  }
}

const initials = (nama: string) =>
  nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: Tenant[] }>('/tenants')
    tenants.value = res.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat data penghuni.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Penghuni</h1>
      <p class="nk-pagehead__sub">Daftar penghuni dan status verifikasinya.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memuat penghuni…</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <EmptyState
      v-else-if="tenants.length === 0"
      icon="pi pi-users"
      title="Belum ada penghuni"
      description="Penghuni yang terdaftar akan tampil di sini."
    />

    <section v-else class="tenants">
      <article
        v-for="t in tenants"
        :key="t.id"
        class="tenant nk-rise"
        role="button"
        tabindex="0"
        @click="openDetail(t)"
        @keydown.enter="openDetail(t)"
      >
        <span class="tenant__avatar">{{ initials(t.nama) }}</span>
        <div class="tenant__body">
          <p class="tenant__name">{{ t.nama }}</p>
          <p class="tenant__contact">{{ t.no_hp }}</p>
        </div>
        <Tag :value="t.status" :severity="statusSeverity[t.status]" />
        <i class="pi pi-angle-right tenant__chev" aria-hidden="true" />
      </article>
    </section>

    <!-- Dialog detail penghuni + daftar sewa -->
    <Dialog
      v-model:visible="detailDialog"
      modal
      :header="detail?.nama ?? 'Detail penghuni'"
      :style="{ width: '92vw', maxWidth: '520px' }"
    >
      <div v-if="detail" class="detail">
        <div class="detail__meta">
          <span><i class="pi pi-phone" /> {{ detail.no_hp }}</span>
          <span v-if="detail.email"><i class="pi pi-envelope" /> {{ detail.email }}</span>
          <Tag :value="detail.status" :severity="statusSeverity[detail.status]" />
        </div>

        <h3 class="detail__title">Riwayat sewa</h3>

        <p v-if="detailLoading" class="nk-muted">Memuat…</p>
        <Message v-else-if="detailError" severity="error" :closable="false">{{ detailError }}</Message>
        <p v-else-if="!detail.tenancies?.length" class="nk-muted">Belum ada data sewa.</p>

        <ul v-else class="sewa">
          <li v-for="s in detail.tenancies" :key="s.id" class="sewa__item">
            <div class="sewa__head">
              <span class="sewa__room">Kamar {{ s.kamar ?? '—' }}</span>
              <span class="sewa__kos">{{ s.kos ?? '—' }}</span>
              <Tag :value="s.status" :severity="tenancySeverity[s.status] ?? 'info'" />
            </div>
            <div class="sewa__body">
              <span>{{ rupiah(s.tarif_disepakati) }} / bulan</span>
              <span class="sewa__dot">·</span>
              <span>{{ s.durasi_sewa ?? '—' }} bln</span>
            </div>
            <div class="sewa__dates">
              Masuk {{ tanggal(s.tanggal_masuk) }}
              <template v-if="s.tanggal_keluar"> — Keluar {{ tanggal(s.tanggal_keluar) }}</template>
            </div>
          </li>
        </ul>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.tenant {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tenant:hover,
.tenant:focus-visible { border-color: var(--brand); outline: none; }
.tenant__chev { color: var(--ink-soft); font-size: 14px; }
.tenant__avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--sand-soft);
  color: var(--brand);
  font-weight: 700;
  font-size: 14px;
}
.tenant__body { flex: 1; min-width: 0; }
.tenant__name { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.tenant__contact { margin: 3px 0 0; font-size: 12.5px; color: var(--ink-soft); }

.tenants { display: grid; gap: 10px; }
@container appview (min-width: 680px) {
  .tenants { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
}

.detail { display: grid; gap: 14px; }
.detail__meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--ink-soft); }
.detail__meta i { margin-right: 4px; }
.detail__title { margin: 4px 0 0; font-size: 14px; font-weight: 700; color: var(--ink); }

.sewa { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.sewa__item {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--surface-2, var(--surface));
}
.sewa__head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sewa__room { font-weight: 700; color: var(--brand); }
.sewa__kos { font-size: 13px; color: var(--ink-soft); }
.sewa__body { margin-top: 6px; font-size: 13px; color: var(--ink); }
.sewa__dot { margin: 0 6px; color: var(--ink-soft); }
.sewa__dates { margin-top: 4px; font-size: 12px; color: var(--ink-soft); }
</style>
