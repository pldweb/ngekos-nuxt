<script setup lang="ts">
import type { PublicKos } from '~/composables/usePublicKos'

definePageMeta({ layout: 'penghuni', middleware: 'auth' })

type Tenancy = {
  id: number
  kamar: string | null
  kos: string | null
  kos_logo: string | null
  tanggal_masuk: string | null
  tanggal_keluar: string | null
  durasi_sewa: number | null
  tarif_disepakati: number | string | null
  status: string
}

const auth = useAuthStore()
const api = useApi()
const { list, detail } = usePublicKos()

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '')

const rupiah = (n: number | string | null) =>
  n == null ? '—' : 'Rp' + Number(n).toLocaleString('id-ID')
const tanggal = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const tenancySeverity: Record<string, string> = { aktif: 'success', selesai: 'secondary', nonaktif: 'secondary' }

/* ---------- Sewa aktif ---------- */
const rentals = ref<Tenancy[]>([])
const rentalsLoading = ref(true)
const activeRentals = computed(() => rentals.value.filter((r) => r.status === 'aktif'))

/* ---------- Daftar kos ---------- */
const kosList = ref<PublicKos[]>([])
const kosLoading = ref(true)

async function load() {
  const [t, k] = await Promise.allSettled([
    api<{ data: Tenancy[] }>('/me/tenancy'),
    list({ limit: 12 }),
  ])
  if (t.status === 'fulfilled') rentals.value = t.value.data
  rentalsLoading.value = false
  if (k.status === 'fulfilled') kosList.value = k.value.data
  kosLoading.value = false
}
onMounted(load)

/* ---------- Ajukan sewa (booking) ---------- */
const bookDialog = ref(false)
const bookSaving = ref(false)
const bookError = ref<string | null>(null)
const bookDone = ref<string | null>(null)
const roomsLoading = ref(false)
const rooms = ref<{ id: number; nomor: string; harga_sewa: number }[]>([])
const book = reactive({
  kos_id: null as number | null,
  room_id: null as number | null,
  durasi_sewa: 1,
  nama: '',
  kontak: '',
})

// Carousel: 2 kartu tampil & bisa digeser di mobile, lebih banyak saat layar lebar.
const kosCarouselOptions = [
  { breakpoint: '1100px', numVisible: 3, numScroll: 1 },
  { breakpoint: '760px', numVisible: 2, numScroll: 1 },
  { breakpoint: '520px', numVisible: 2, numScroll: 1 },
]

const kosOptions = computed(() => kosList.value.map((k) => ({ label: k.nama, value: k.id })))
const roomOptions = computed(() =>
  rooms.value.map((r) => ({ label: `Kamar ${r.nomor} — ${rupiah(r.harga_sewa)}/bln`, value: r.id })),
)

function openBooking(kosId: number | null = null) {
  Object.assign(book, {
    kos_id: kosId,
    room_id: null,
    durasi_sewa: 1,
    nama: auth.user?.name ?? '',
    kontak: auth.user?.phone ?? '',
  })
  rooms.value = []
  bookError.value = null
  bookDone.value = null
  bookDialog.value = true
  if (kosId) loadRooms(kosId)
}

async function loadRooms(kosId: number) {
  roomsLoading.value = true
  rooms.value = []
  book.room_id = null
  try {
    const res = await detail(kosId)
    rooms.value = (res.data.rooms ?? []).filter((r) => r.status === 'kosong')
  } catch {
    /* biarkan kosong */
  } finally {
    roomsLoading.value = false
  }
}

watch(() => book.kos_id, (id) => { if (id) loadRooms(id) })

async function submitBooking() {
  bookError.value = null
  if (!book.room_id) return (bookError.value = 'Pilih kamar dulu.')
  if (!book.nama.trim() || !book.kontak.trim()) return (bookError.value = 'Nama & kontak wajib diisi.')
  bookSaving.value = true
  try {
    await api('/bookings', {
      method: 'POST',
      body: {
        room_id: book.room_id,
        nama: book.nama,
        kontak: book.kontak,
        durasi_sewa: book.durasi_sewa,
      },
    })
    bookDone.value = 'Pengajuan sewa terkirim. Menunggu konfirmasi pengelola.'
  } catch (e: any) {
    bookError.value =
      e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal mengajukan sewa.'
  } finally {
    bookSaving.value = false
  }
}
</script>

<template>
  <div class="nk-stack">
    <!-- Hero -->
    <section class="hero nk-rise">
      <p class="hero__eyebrow">Beranda</p>
      <h1 class="hero__title">
        <template v-if="firstName">Halo, {{ firstName }} 👋</template>
        <template v-else>Selamat datang 👋</template>
      </h1>
      <p class="hero__sub">Cari kos, ajukan sewa, dan pantau tagihanmu di satu tempat.</p>
    </section>

    <!-- Sewa aktif -->
    <section class="nk-stack" style="gap: 10px">
      <h2 class="nk-sect">Sewa saya</h2>

      <p v-if="rentalsLoading" class="nk-muted">Memuat…</p>

      <EmptyState
        v-else-if="!activeRentals.length"
        icon="pi pi-home"
        title="Belum ada sewa aktif"
        description="Pilih kos di bawah lalu ajukan sewa."
      />

      <article v-for="r in activeRentals" v-else :key="r.id" class="rental nk-rise">
        <span class="rental__logo">
          <img v-if="r.kos_logo" :src="r.kos_logo" :alt="r.kos ?? ''" />
          <i v-else class="pi pi-building" />
        </span>
        <div class="rental__body">
          <p class="rental__kos">{{ r.kos ?? '—' }}</p>
          <p class="rental__room">Kamar {{ r.kamar ?? '—' }} · {{ rupiah(r.tarif_disepakati) }}/bln</p>
          <p class="rental__date">Masuk {{ tanggal(r.tanggal_masuk) }}</p>
        </div>
        <Tag :value="r.status" :severity="tenancySeverity[r.status] ?? 'info'" />
      </article>
    </section>

    <!-- Daftar kos -->
    <section class="nk-stack" style="gap: 10px">
      <div class="sect-head">
        <h2 class="nk-sect">Kos tersedia</h2>
        <Button label="Ajukan sewa" icon="pi pi-plus" size="small" @click="openBooking()" />
      </div>

      <p v-if="kosLoading" class="nk-muted">Memuat kos…</p>
      <EmptyState
        v-else-if="!kosList.length"
        icon="pi pi-inbox"
        title="Belum ada kos"
        description="Kos yang tersedia akan tampil di sini."
      />
      <Carousel
        v-else
        :value="kosList"
        :numVisible="2"
        :numScroll="1"
        :responsiveOptions="kosCarouselOptions"
        :circular="kosList.length > 1"
        :show-navigators="false"
        class="kos-carousel"
      >
        <template #item="{ data }">
          <div class="kos-slide">
            <KosCard :kos="data" base="/home/kos" />
          </div>
        </template>
      </Carousel>
    </section>

    <!-- Dialog booking -->
    <Dialog v-model:visible="bookDialog" modal header="Ajukan sewa" :style="{ width: '92vw', maxWidth: '440px' }">
      <div v-if="bookDone" class="nk-stack" style="gap: 12px">
        <Message severity="success" :closable="false">{{ bookDone }}</Message>
        <Button label="Tutup" @click="bookDialog = false" />
      </div>
      <div v-else class="nk-form">
        <div class="nk-field">
          <label class="nk-label">Kos</label>
          <Select v-model="book.kos_id" :options="kosOptions" option-label="label" option-value="value" placeholder="Pilih kos" class="w-full" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Kamar</label>
          <Select
            v-model="book.room_id"
            :options="roomOptions"
            option-label="label"
            option-value="value"
            :placeholder="roomsLoading ? 'Memuat kamar…' : (book.kos_id ? 'Pilih kamar kosong' : 'Pilih kos dulu')"
            :loading="roomsLoading"
            :disabled="!book.kos_id || roomsLoading"
            class="w-full"
          />
          <small v-if="book.kos_id && !roomsLoading && !rooms.length" class="opt">Tidak ada kamar kosong di kos ini.</small>
        </div>
        <div class="nk-field">
          <label class="nk-label">Durasi sewa (bulan)</label>
          <InputNumber v-model="book.durasi_sewa" :min="1" :max="24" class="w-full" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Nama</label>
          <InputText v-model="book.nama" class="w-full" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Kontak (no HP)</label>
          <InputText v-model="book.kontak" class="w-full" placeholder="08…" />
        </div>
        <Message v-if="bookError" severity="error" :closable="false">{{ bookError }}</Message>
      </div>
      <template v-if="!bookDone" #footer>
        <Button label="Batal" text @click="bookDialog = false" />
        <Button label="Ajukan" icon="pi pi-check" :loading="bookSaving" @click="submitBooking" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, #5c3f28 0%, var(--brand-strong) 100%);
  color: #f4ece1;
  border-radius: 18px;
  padding: 22px;
  box-shadow: var(--shadow-brand);
}
.hero__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sand);
}
.hero__title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
.hero__sub { margin: 8px 0 0; font-size: 14px; line-height: 1.5; color: #e3d6c6; }

.sect-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }

.rental {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
}
.rental__logo {
  width: 46px; height: 46px;
  flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 13px;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 20px;
  overflow: hidden;
}
.rental__logo img { width: 100%; height: 100%; object-fit: contain; }
.rental__body { flex: 1; min-width: 0; }
.rental__kos { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.rental__room { margin: 3px 0 0; font-size: 12.5px; color: var(--ink); }
.rental__date { margin: 2px 0 0; font-size: 12px; color: var(--ink-soft); }

.kos-carousel { margin: 0 -2px; }
.kos-slide { padding: 4px 6px 6px; }
.w-full { width: 100%; }
.opt { color: var(--ink-soft); }
</style>
