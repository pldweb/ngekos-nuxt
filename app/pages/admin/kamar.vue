<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Room = {
  id: number
  kos_id: number
  nomor: string
  harga_sewa: number
  tarif_harian: number | null
  status: 'kosong' | 'terisi' | 'maintenance'
  fasilitas: string[]
}
type Kos = { id: number; nama: string }
type UpsertItem = {
  nomor: string
  harga_sewa: number
  tarif_harian?: number | null
  status?: Room['status']
  fasilitas?: string[]
}

const api = useApi()

const rooms = ref<Room[]>([])
const kosList = ref<Kos[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)

const filterKos = ref<number | null>(null)
const filterStatus = ref<string | null>(null)

const statusOptions = [
  { label: 'Semua status', value: null },
  { label: 'Kosong', value: 'kosong' },
  { label: 'Terisi', value: 'terisi' },
  { label: 'Maintenance', value: 'maintenance' },
]
const statusFormOptions = [
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
const rupiah = (n: number) => 'Rp' + Number(n).toLocaleString('id-ID')
const kosOptions = computed(() => kosList.value.map((k) => ({ label: k.nama, value: k.id })))
const kosFilterOptions = computed(() => [{ label: 'Semua kos', value: null }, ...kosOptions.value])

const filtered = computed(() =>
  rooms.value.filter(
    (r) =>
      (filterKos.value == null || r.kos_id === filterKos.value) &&
      (filterStatus.value == null || r.status === filterStatus.value),
  ),
)

/** Nomor kamar berikutnya (numerik) untuk sebuah kos. */
function nextNomor(kosId: number | null) {
  if (kosId == null) return '1'
  const nums = rooms.value
    .filter((r) => r.kos_id === kosId)
    .map((r) => parseInt(r.nomor, 10))
    .filter((n) => !Number.isNaN(n))
  return String((nums.length ? Math.max(...nums) : 0) + 1)
}

function flash(msg: string) {
  notice.value = msg
  setTimeout(() => (notice.value = null), 4000)
}

async function bulkUpsert(kosId: number, items: UpsertItem[]) {
  return api<{ dibuat: number; diperbarui: number }>('/rooms/bulk-upsert', {
    method: 'POST',
    body: { kos_id: kosId, items },
  })
}

/* ---------- Tambah / Duplikat satu kamar ---------- */
const dialog = ref(false)
const dialogTitle = ref('Tambah kamar')
const saving = ref(false)
const formError = ref<string | null>(null)
const form = reactive({
  kos_id: null as number | null,
  nomor: '',
  harga_sewa: null as number | null,
  tarif_harian: null as number | null,
  status: 'kosong' as Room['status'],
  fasilitas: [] as string[],
})

function openCreate() {
  Object.assign(form, {
    kos_id: filterKos.value ?? kosList.value[0]?.id ?? null,
    nomor: '',
    harga_sewa: null,
    tarif_harian: null,
    status: 'kosong',
    fasilitas: [],
  })
  form.nomor = nextNomor(form.kos_id)
  dialogTitle.value = 'Tambah kamar'
  formError.value = null
  dialog.value = true
}

function openDuplicate(room: Room) {
  Object.assign(form, {
    kos_id: room.kos_id,
    nomor: nextNomor(room.kos_id),
    harga_sewa: room.harga_sewa,
    tarif_harian: room.tarif_harian,
    status: 'kosong',
    fasilitas: [...(room.fasilitas ?? [])],
  })
  dialogTitle.value = `Duplikat kamar ${room.nomor}`
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
        fasilitas: form.fasilitas,
      },
    })
    dialog.value = false
    flash('Kamar tersimpan.')
    await load()
  } catch (e: any) {
    formError.value =
      e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan kamar.'
  } finally {
    saving.value = false
  }
}

/* ---------- Generate massal ---------- */
const genDialog = ref(false)
const genSaving = ref(false)
const genError = ref<string | null>(null)
const gen = reactive({
  kos_id: null as number | null,
  prefix: '',
  mulai: 1,
  jumlah: 12,
  harga_sewa: null as number | null,
})
const genPreview = computed(() => {
  if (!gen.jumlah || gen.jumlah < 1) return []
  return Array.from({ length: Math.min(gen.jumlah, 60) }, (_, i) => `${gen.prefix}${gen.mulai + i}`)
})

function openGenerate() {
  Object.assign(gen, {
    kos_id: filterKos.value ?? kosList.value[0]?.id ?? null,
    prefix: '',
    mulai: 1,
    jumlah: 12,
    harga_sewa: null,
  })
  genError.value = null
  genDialog.value = true
}

async function submitGenerate() {
  genError.value = null
  if (!gen.kos_id) return (genError.value = 'Pilih kos dulu.')
  if (!gen.harga_sewa || gen.harga_sewa < 0) return (genError.value = 'Isi harga dasar.')
  genSaving.value = true
  try {
    const items: UpsertItem[] = genPreview.value.map((nomor) => ({
      nomor,
      harga_sewa: gen.harga_sewa as number,
      status: 'kosong',
      fasilitas: [],
    }))
    const res = await bulkUpsert(gen.kos_id, items)
    genDialog.value = false
    flash(`Generate selesai: ${res.dibuat} dibuat, ${res.diperbarui} diperbarui.`)
    await load()
  } catch (e: any) {
    genError.value = e?.data?.message ?? 'Gagal generate kamar.'
  } finally {
    genSaving.value = false
  }
}

/* ---------- Import (tempel) ---------- */
const impDialog = ref(false)
const impSaving = ref(false)
const impError = ref<string | null>(null)
const imp = reactive({
  kos_id: null as number | null,
  teks: '',
  ribuan: true,
})

/** Parse baris "Kamar 1 = 900", "1: 900", "Kamar 1-9 = 875" (rentang). */
const impParsed = computed<UpsertItem[]>(() => {
  const mult = imp.ribuan ? 1000 : 1
  const out: UpsertItem[] = []
  for (const raw of imp.teks.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^(?:kamar\s*)?(.+?)\s*[=:–-]\s*([\d.]+)\s*$/i)
    if (!m) continue
    const label = m[1].trim()
    const harga = parseInt(m[2].replace(/\./g, ''), 10) * mult
    if (!label || Number.isNaN(harga)) continue
    const range = label.match(/^(\d+)\s*[-–]\s*(\d+)$/)
    if (range) {
      const a = parseInt(range[1], 10)
      const b = parseInt(range[2], 10)
      if (a <= b && b - a < 200) {
        for (let n = a; n <= b; n++) out.push({ nomor: String(n), harga_sewa: harga, status: 'kosong', fasilitas: [] })
        continue
      }
    }
    out.push({ nomor: label, harga_sewa: harga, status: 'kosong', fasilitas: [] })
  }
  return out
})

function openImport() {
  Object.assign(imp, { kos_id: filterKos.value ?? kosList.value[0]?.id ?? null, teks: '', ribuan: true })
  impError.value = null
  impDialog.value = true
}

async function submitImport() {
  impError.value = null
  if (!imp.kos_id) return (impError.value = 'Pilih kos dulu.')
  if (!impParsed.value.length) return (impError.value = 'Tidak ada baris valid untuk diimpor.')
  impSaving.value = true
  try {
    const res = await bulkUpsert(imp.kos_id, impParsed.value)
    impDialog.value = false
    flash(`Import selesai: ${res.dibuat} dibuat, ${res.diperbarui} diperbarui.`)
    await load()
  } catch (e: any) {
    impError.value = e?.data?.message ?? 'Gagal impor kamar.'
  } finally {
    impSaving.value = false
  }
}

/* ---------- Edit massal (pilih beberapa → set harga) ---------- */
const selectMode = ref(false)
const selected = ref<Set<number>>(new Set())
const bulkDialog = ref(false)
const bulkSaving = ref(false)
const bulkError = ref<string | null>(null)
const bulkHarga = ref<number | null>(null)

function toggleSelect(id: number) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}
function clearSelect() {
  selected.value = new Set()
  selectMode.value = false
}
const selectedRooms = computed(() => rooms.value.filter((r) => selected.value.has(r.id)))

function openBulkEdit() {
  bulkHarga.value = null
  bulkError.value = null
  bulkDialog.value = true
}

async function submitBulkEdit() {
  bulkError.value = null
  if (!bulkHarga.value || bulkHarga.value < 0) return (bulkError.value = 'Isi harga baru.')
  const byKos = new Map<number, UpsertItem[]>()
  for (const r of selectedRooms.value) {
    const arr = byKos.get(r.kos_id) ?? []
    arr.push({ nomor: r.nomor, harga_sewa: bulkHarga.value })
    byKos.set(r.kos_id, arr)
  }
  bulkSaving.value = true
  try {
    for (const [kosId, items] of byKos) await bulkUpsert(kosId, items)
    bulkDialog.value = false
    flash(`${selectedRooms.value.length} kamar diperbarui.`)
    clearSelect()
    await load()
  } catch (e: any) {
    bulkError.value = e?.data?.message ?? 'Gagal memperbarui kamar.'
  } finally {
    bulkSaving.value = false
  }
}

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
        <p class="nk-pagehead__sub">Kelola kamar & harga tiap brand kos.</p>
      </div>
      <div class="head__actions">
        <Button label="Generate" icon="pi pi-bolt" severity="secondary" outlined @click="openGenerate" />
        <Button label="Import" icon="pi pi-clipboard" severity="secondary" outlined @click="openImport" />
        <Button label="Tambah" icon="pi pi-plus" @click="openCreate" />
      </div>
    </header>

    <Message v-if="notice" severity="success" :closable="false">{{ notice }}</Message>

    <div class="toolbar">
      <Select
        v-model="filterKos"
        :options="kosFilterOptions"
        option-label="label"
        option-value="value"
        placeholder="Filter kos"
        class="w-full"
      />
      <Select
        v-model="filterStatus"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Filter status"
        class="w-full"
      />
      <Button
        :label="selectMode ? 'Batal pilih' : 'Pilih massal'"
        :icon="selectMode ? 'pi pi-times' : 'pi pi-check-square'"
        severity="secondary"
        :outlined="!selectMode"
        @click="selectMode ? clearSelect() : (selectMode = true)"
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
      description="Mulai dengan generate massal, import, atau tambah kamar."
    >
      <Button label="Generate massal" icon="pi pi-bolt" size="small" @click="openGenerate" />
    </EmptyState>

    <section v-else class="rooms">
      <article
        v-for="room in filtered"
        :key="room.id"
        class="room nk-rise"
        :class="{ 'room--sel': selectMode && selected.has(room.id) }"
        @click="selectMode ? toggleSelect(room.id) : null"
      >
        <div class="room__main">
          <Checkbox
            v-if="selectMode"
            :model-value="selected.has(room.id)"
            binary
            @click.stop
            @update:model-value="toggleSelect(room.id)"
          />
          <span class="room__no">{{ room.nomor }}</span>
          <div>
            <p class="room__kos">{{ kosNama(room.kos_id) }}</p>
            <p class="room__price">{{ rupiah(room.harga_sewa) }} / bulan</p>
          </div>
        </div>
        <div class="room__right">
          <Tag :value="room.status" :severity="statusSeverity[room.status]" />
          <Button
            v-if="!selectMode"
            icon="pi pi-copy"
            severity="secondary"
            text
            rounded
            aria-label="Duplikat"
            @click.stop="openDuplicate(room)"
          />
        </div>
      </article>
    </section>

    <!-- Bar aksi edit massal -->
    <div v-if="selectMode && selected.size" class="bulkbar">
      <span>{{ selected.size }} kamar dipilih</span>
      <Button label="Ubah harga" icon="pi pi-tag" size="small" @click="openBulkEdit" />
    </div>

    <!-- Dialog Tambah/Duplikat -->
    <Dialog v-model:visible="dialog" modal :header="dialogTitle" :style="{ width: '92vw', maxWidth: '440px' }">
      <div class="nk-form">
        <div class="nk-field">
          <label class="nk-label">Kos</label>
          <Select v-model="form.kos_id" :options="kosOptions" option-label="label" option-value="value" placeholder="Pilih kos" class="w-full" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Nomor kamar</label>
          <InputText v-model="form.nomor" class="w-full" placeholder="mis. 1, A1" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Harga sewa / bulan</label>
          <InputNumber v-model="form.harga_sewa" mode="currency" currency="IDR" locale="id-ID" :min="0" class="w-full" placeholder="Rp0" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Tarif harian <span class="opt">(opsional)</span></label>
          <InputNumber v-model="form.tarif_harian" mode="currency" currency="IDR" locale="id-ID" :min="0" class="w-full" placeholder="Rp0" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Status</label>
          <Select v-model="form.status" :options="statusFormOptions" option-label="label" option-value="value" class="w-full" />
        </div>
        <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="dialog = false" />
        <Button label="Simpan" icon="pi pi-check" :loading="saving" @click="submitRoom" />
      </template>
    </Dialog>

    <!-- Dialog Generate massal -->
    <Dialog v-model:visible="genDialog" modal header="Generate kamar massal" :style="{ width: '92vw', maxWidth: '460px' }">
      <div class="nk-form">
        <div class="nk-field">
          <label class="nk-label">Kos</label>
          <Select v-model="gen.kos_id" :options="kosOptions" option-label="label" option-value="value" placeholder="Pilih kos" class="w-full" />
        </div>
        <div class="grid2">
          <div class="nk-field">
            <label class="nk-label">Awalan <span class="opt">(opsional)</span></label>
            <InputText v-model="gen.prefix" class="w-full" placeholder="mis. A, Kamar " />
          </div>
          <div class="nk-field">
            <label class="nk-label">Mulai dari</label>
            <InputNumber v-model="gen.mulai" :min="1" class="w-full" />
          </div>
        </div>
        <div class="grid2">
          <div class="nk-field">
            <label class="nk-label">Jumlah kamar</label>
            <InputNumber v-model="gen.jumlah" :min="1" :max="60" class="w-full" />
          </div>
          <div class="nk-field">
            <label class="nk-label">Harga dasar / bln</label>
            <InputNumber v-model="gen.harga_sewa" mode="currency" currency="IDR" locale="id-ID" :min="0" class="w-full" placeholder="Rp0" />
          </div>
        </div>
        <p v-if="genPreview.length" class="preview">
          Akan dibuat: <strong>{{ genPreview[0] }}</strong> … <strong>{{ genPreview[genPreview.length - 1] }}</strong>
          ({{ genPreview.length }} kamar). Kamar yang sudah ada akan diperbarui harganya.
        </p>
        <Message v-if="genError" severity="error" :closable="false">{{ genError }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="genDialog = false" />
        <Button label="Generate" icon="pi pi-bolt" :loading="genSaving" @click="submitGenerate" />
      </template>
    </Dialog>

    <!-- Dialog Import -->
    <Dialog v-model:visible="impDialog" modal header="Import kamar (tempel)" :style="{ width: '92vw', maxWidth: '480px' }">
      <div class="nk-form">
        <div class="nk-field">
          <label class="nk-label">Kos</label>
          <Select v-model="imp.kos_id" :options="kosOptions" option-label="label" option-value="value" placeholder="Pilih kos" class="w-full" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Tempel daftar kamar</label>
          <Textarea v-model="imp.teks" rows="7" class="w-full" placeholder="Kamar 1 = 900&#10;Kamar 2 = 900&#10;Kamar 1-9 = 875" />
          <small class="opt">Format: <code>Kamar 1 = 900</code>. Rentang didukung: <code>Kamar 1-9 = 875</code>.</small>
        </div>
        <div class="nk-check">
          <Checkbox v-model="imp.ribuan" binary input-id="ribuan" />
          <label for="ribuan">Angka dalam ribuan (×1.000) — mis. 900 → Rp900.000</label>
        </div>
        <p v-if="impParsed.length" class="preview">
          Terbaca <strong>{{ impParsed.length }}</strong> kamar. Contoh:
          {{ impParsed.slice(0, 3).map((i) => `${i.nomor}=${rupiah(i.harga_sewa)}`).join(', ') }}<span v-if="impParsed.length > 3">…</span>
        </p>
        <Message v-if="impError" severity="error" :closable="false">{{ impError }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="impDialog = false" />
        <Button label="Import" icon="pi pi-clipboard" :loading="impSaving" :disabled="!impParsed.length" @click="submitImport" />
      </template>
    </Dialog>

    <!-- Dialog Edit massal -->
    <Dialog v-model:visible="bulkDialog" modal header="Ubah harga massal" :style="{ width: '92vw', maxWidth: '400px' }">
      <div class="nk-form">
        <p class="nk-muted">{{ selectedRooms.length }} kamar terpilih akan diset ke harga ini.</p>
        <div class="nk-field">
          <label class="nk-label">Harga sewa / bulan</label>
          <InputNumber v-model="bulkHarga" mode="currency" currency="IDR" locale="id-ID" :min="0" class="w-full" placeholder="Rp0" />
        </div>
        <Message v-if="bulkError" severity="error" :closable="false">{{ bulkError }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="bulkDialog = false" />
        <Button label="Terapkan" icon="pi pi-check" :loading="bulkSaving" @click="submitBulkEdit" />
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
.head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
.opt { font-weight: 400; color: var(--ink-soft); }
.preview { margin: 0; font-size: 12.5px; color: var(--ink-soft); background: var(--surface-2); padding: 10px 12px; border-radius: 10px; }
.preview strong { color: var(--brand); }

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
  cursor: default;
}
.room--sel { border-color: var(--brand); background: var(--sand-soft); }
.room__main { display: flex; align-items: center; gap: 12px; }
.room__right { display: flex; align-items: center; gap: 6px; }
.room__no {
  width: 46px; height: 46px;
  display: grid; place-items: center;
  border-radius: 13px;
  background: var(--sand-soft);
  color: var(--brand);
  font-weight: 700;
  font-size: 14px;
}
.room__kos { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.room__price { margin: 3px 0 0; font-size: 12.5px; color: var(--ink-soft); }
.w-full { width: 100%; }

.toolbar { display: flex; gap: 10px; flex-wrap: wrap; }
.rooms { display: grid; gap: 10px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.nk-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink); }

.bulkbar {
  position: sticky;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--brand-strong);
  color: #f4ece1;
  padding: 12px 16px;
  border-radius: 14px;
  box-shadow: var(--shadow-brand);
}

@container appview (min-width: 680px) {
  .toolbar :deep(.p-select) { min-width: 200px; }
  .toolbar .w-full { width: auto; }
  .rooms { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
}
</style>
