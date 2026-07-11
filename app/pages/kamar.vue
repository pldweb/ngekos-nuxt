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

const kosOptions = computed(() => kosList.value.map((k) => ({ label: k.nama, value: k.id })))
const statusFormOptions = [
  { label: 'Kosong', value: 'kosong' },
  { label: 'Terisi', value: 'terisi' },
  { label: 'Maintenance', value: 'maintenance' },
]

const dialog = ref(false)
const saving = ref(false)
const formError = ref<string | null>(null)
const form = reactive({
  kos_id: null as number | null,
  nomor: '',
  harga_sewa: null as number | null,
  tarif_harian: null as number | null,
  status: 'kosong' as Room['status'],
})

function openCreate() {
  form.kos_id = kosList.value[0]?.id ?? null
  form.nomor = ''
  form.harga_sewa = null
  form.tarif_harian = null
  form.status = 'kosong'
  formError.value = null
  dialog.value = true
}

async function submitRoom() {
  saving.value = true
  formError.value = null
  try {
    await api('/rooms', {
      method: 'POST',
      body: {
        kos_id: form.kos_id,
        nomor: form.nomor,
        harga_sewa: form.harga_sewa,
        tarif_harian: form.tarif_harian,
        status: form.status,
      },
    })
    dialog.value = false
    await load()
  } catch (e: any) {
    formError.value =
      e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan kamar.'
  } finally {
    saving.value = false
  }
}

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
    <header class="head">
      <div>
        <h1 class="nk-pagehead__title">Kamar</h1>
        <p class="nk-pagehead__sub">Daftar kamar dan status hunian tiap kos.</p>
      </div>
      <Button label="Tambah kamar" icon="pi pi-plus" @click="openCreate" />
    </header>

    <div class="toolbar">
      <Select
        v-model="status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Filter status"
        class="w-full"
      />
    </div>

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
      description="Mulai dengan menambahkan kamar pertamamu."
    >
      <Button label="Tambah kamar" icon="pi pi-plus" size="small" @click="openCreate" />
    </EmptyState>

    <section v-else class="rooms">
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

    <Dialog v-model:visible="dialog" modal header="Tambah kamar" :style="{ width: '92vw', maxWidth: '440px' }">
      <div class="nk-form">
        <div class="nk-field">
          <label class="nk-label">Kos</label>
          <Select
            v-model="form.kos_id"
            :options="kosOptions"
            option-label="label"
            option-value="value"
            placeholder="Pilih kos"
            class="w-full"
          />
        </div>
        <div class="nk-field">
          <label class="nk-label">Nomor kamar</label>
          <InputText v-model="form.nomor" class="w-full" placeholder="mis. A1, 101" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Harga sewa / bulan</label>
          <InputNumber
            v-model="form.harga_sewa"
            mode="currency"
            currency="IDR"
            locale="id-ID"
            :min="0"
            class="w-full"
            placeholder="Rp0"
          />
        </div>
        <div class="nk-field">
          <label class="nk-label">Tarif harian <span class="opt">(opsional)</span></label>
          <InputNumber
            v-model="form.tarif_harian"
            mode="currency"
            currency="IDR"
            locale="id-ID"
            :min="0"
            class="w-full"
            placeholder="Rp0"
          />
        </div>
        <div class="nk-field">
          <label class="nk-label">Status</label>
          <Select
            v-model="form.status"
            :options="statusFormOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
        <Message v-if="formError" severity="error">{{ formError }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="dialog = false" />
        <Button label="Simpan" icon="pi pi-check" :loading="saving" @click="submitRoom" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin: 2px 2px 0;
}
.opt { font-weight: 400; color: var(--ink-soft); }
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

.toolbar { display: flex; }
.rooms { display: grid; gap: 10px; }

/* Lebar admin (desktop): grid multi-kolom + filter ringkas */
@container appview (min-width: 680px) {
  .toolbar :deep(.p-select) { min-width: 240px; }
  .toolbar .w-full { width: auto; }
  .rooms { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
}
</style>
