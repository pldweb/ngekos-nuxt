<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Room = {
  id: number
  kos_id: number
  nomor: string
  harga_sewa: number
  status: 'kosong' | 'terisi' | 'maintenance'
}
type Kos = { id: number; nama: string }

const api = useApi()

const rooms = ref<Room[]>([])
const kosList = ref<Kos[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const status = ref<string | null>(null)

const statusOptions = [
  { label: 'Semua status', value: null },
  { label: 'Kosong', value: 'kosong' },
  { label: 'Terisi', value: 'terisi' },
  { label: 'Maintenance', value: 'maintenance' },
]

const statusSeverity: Record<Room['status'], string> = {
  kosong: 'success',
  terisi: 'info',
  maintenance: 'warn',
}

const kosNama = (id: number) => kosList.value.find((k) => k.id === id)?.nama ?? '—'
const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')

const filtered = computed(() =>
  status.value ? rooms.value.filter((r) => r.status === status.value) : rooms.value,
)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [roomRes, kosRes] = await Promise.all([
      api<{ data: Room[] }>('/rooms'),
      api<{ data: Kos[] }>('/kos'),
    ])
    rooms.value = roomRes.data
    kosList.value = kosRes.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat data kamar.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Kamar</h1>
      <p class="nk-pagehead__sub">Daftar kamar dan status hunian tiap kos.</p>
    </header>

    <Select
      v-model="status"
      :options="statusOptions"
      option-label="label"
      option-value="value"
      placeholder="Filter status"
      class="w-full"
    />

    <p v-if="loading" class="nk-muted">Memuat kamar…</p>

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
      icon="pi pi-th-large"
      title="Belum ada kamar"
      description="Kamar yang ditambahkan pengelola akan tampil di sini."
    />

    <section v-else class="nk-stack" style="gap: 10px">
      <article v-for="room in filtered" :key="room.id" class="room nk-rise">
        <div class="room__main">
          <span class="room__no">{{ room.nomor }}</span>
          <div>
            <p class="room__kos">{{ kosNama(room.kos_id) }}</p>
            <p class="room__price">{{ rupiah(room.harga_sewa) }} / bulan</p>
          </div>
        </div>
        <Tag :value="room.status" :severity="statusSeverity[room.status]" />
      </article>
    </section>
  </div>
</template>

<style scoped>
.room {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
}
.room__main { display: flex; align-items: center; gap: 12px; }
.room__no {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: var(--sand-soft);
  color: var(--brand);
  font-weight: 700;
  font-size: 14px;
}
.room__kos { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.room__price { margin: 3px 0 0; font-size: 12.5px; color: var(--ink-soft); }
.w-full { width: 100%; }
</style>
