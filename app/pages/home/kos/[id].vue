<script setup lang="ts">
import type { PublicKos } from '~/composables/usePublicKos'

definePageMeta({ layout: 'penghuni', middleware: 'auth' })

const route = useRoute()
const auth = useAuthStore()
const api = useApi()
const { detail } = usePublicKos()

const kos = ref<PublicKos | null>(null)
const loading = ref(true)
const activeFoto = ref<string | null>(null)

const rupiah = (n: number | null) => (n == null ? 'Hubungi' : 'Rp' + Number(n).toLocaleString('id-ID'))

const statusLabel: Record<string, string> = {
  kosong: 'Tersedia',
  terisi: 'Terisi',
  maintenance: 'Perbaikan',
}

const availableRooms = computed(() => (kos.value?.rooms ?? []).filter((r) => r.status === 'kosong'))

async function load() {
  loading.value = true
  try {
    kos.value = (await detail(route.params.id as string)).data
    activeFoto.value = kos.value?.foto?.[0] ?? null
  } catch {
    kos.value = null
  } finally {
    loading.value = false
  }
}
onMounted(load)

useHead(() => ({ title: kos.value ? `${kos.value.nama} — Ngekoskuy` : 'Detail Kos' }))

/* ---------- Ajukan sewa ---------- */
const bookDialog = ref(false)
const bookSaving = ref(false)
const bookError = ref<string | null>(null)
const bookDone = ref<string | null>(null)
const book = reactive({
  room_id: null as number | null,
  durasi_sewa: 1,
  nama: '',
  kontak: '',
})

const roomOptions = computed(() =>
  availableRooms.value.map((r) => ({ label: `Kamar ${r.nomor} — ${rupiah(r.harga_sewa)}/bln`, value: r.id })),
)

function openBooking(roomId: number | null = null) {
  Object.assign(book, {
    room_id: roomId ?? availableRooms.value[0]?.id ?? null,
    durasi_sewa: 1,
    nama: auth.user?.name ?? '',
    kontak: auth.user?.phone ?? '',
  })
  bookError.value = null
  bookDone.value = null
  bookDialog.value = true
}

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
  <div class="kd">
    <NuxtLink to="/home" class="kd__back"><i class="pi pi-arrow-left" /> Kembali</NuxtLink>

    <p v-if="loading" class="nk-muted">Memuat detail kos…</p>

    <EmptyState
      v-else-if="!kos"
      icon="pi pi-exclamation-circle"
      title="Kos tidak ditemukan"
      description="Kos yang kamu cari tidak tersedia."
    >
      <NuxtLink to="/home"><Button label="Kembali" size="small" /></NuxtLink>
    </EmptyState>

    <template v-else>
      <!-- Galeri -->
      <div class="kd__cover">
        <img v-if="activeFoto" :src="activeFoto" :alt="kos.nama" />
        <div v-else class="kd__ph"><i class="pi pi-home" /></div>
        <span v-if="kos.populer" class="kd__badge">Populer</span>
      </div>
      <div v-if="kos.foto.length > 1" class="kd__thumbs">
        <button
          v-for="(f, i) in kos.foto"
          :key="i"
          class="kd__thumb"
          :class="{ 'kd__thumb--on': f === activeFoto }"
          type="button"
          @click="activeFoto = f"
        >
          <img :src="f" :alt="`${kos.nama} ${i + 1}`" />
        </button>
      </div>

      <!-- Info -->
      <h1 class="kd__title">{{ kos.nama }}</h1>
      <p class="kd__loc"><i class="pi pi-map-marker" />{{ kos.alamat }}</p>

      <div class="kd__price">
        <small>Mulai dari</small>
        <strong>{{ rupiah(kos.harga_mulai) }}</strong>
        <span v-if="kos.harga_mulai != null">/ bulan</span>
      </div>

      <div class="kd__meta">
        <span><i class="pi pi-building" />{{ kos.jumlah_kamar }} kamar</span>
        <span><i class="pi pi-check-circle" />{{ kos.kamar_tersedia ?? 0 }} tersedia</span>
      </div>

      <div v-if="kos.fasilitas.length" class="kd__fac">
        <span v-for="f in kos.fasilitas" :key="f" class="kd__fac-chip">
          <i :class="fasilitasInfo(f).icon" />{{ fasilitasInfo(f).label }}
        </span>
      </div>

      <div v-if="kos.deskripsi" class="kd__section">
        <h2>Deskripsi</h2>
        <p>{{ kos.deskripsi }}</p>
      </div>

      <!-- Kamar -->
      <div v-if="kos.rooms && kos.rooms.length" class="kd__section">
        <h2>Pilihan Kamar</h2>
        <div class="kd__rooms">
          <div v-for="r in kos.rooms" :key="r.id" class="kd__room">
            <div class="kd__room-head">
              <strong>Kamar {{ r.nomor }}</strong>
              <span class="kd__room-status" :class="`is-${r.status}`">
                {{ statusLabel[r.status] ?? r.status }}
              </span>
            </div>
            <p class="kd__room-price">{{ rupiah(r.harga_sewa) }} <small>/ bulan</small></p>
            <Button
              v-if="r.status === 'kosong'"
              label="Ajukan sewa"
              size="small"
              outlined
              class="kd__room-cta"
              @click="openBooking(r.id)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- CTA bawah -->
    <div v-if="kos && availableRooms.length" class="kd__bar">
      <Button label="Ajukan sewa" icon="pi pi-arrow-right" icon-pos="right" class="w-full" @click="openBooking()" />
    </div>

    <!-- Dialog booking -->
    <Dialog v-model:visible="bookDialog" modal header="Ajukan sewa" :style="{ width: '92vw', maxWidth: '420px' }">
      <div v-if="bookDone" class="nk-stack" style="gap: 12px">
        <Message severity="success" :closable="false">{{ bookDone }}</Message>
        <Button label="Tutup" @click="bookDialog = false" />
      </div>
      <div v-else class="nk-form">
        <div class="nk-field">
          <label class="nk-label">Kamar</label>
          <Select
            v-model="book.room_id"
            :options="roomOptions"
            option-label="label"
            option-value="value"
            placeholder="Pilih kamar kosong"
            class="w-full"
          />
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
.kd { display: flex; flex-direction: column; gap: 14px; padding-bottom: 76px; }
.kd__back {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--brand);
  margin-bottom: 2px;
}
.kd__cover {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: var(--sand-soft);
}
.kd__cover img { width: 100%; height: 100%; object-fit: cover; }
.kd__ph { width: 100%; height: 100%; display: grid; place-items: center; color: var(--brand-soft); font-size: 48px; }
.kd__badge {
  position: absolute; top: 12px; left: 12px;
  background: rgba(82, 55, 36, 0.92);
  color: #fff; font-size: 12px; font-weight: 600;
  padding: 5px 12px; border-radius: 999px;
}
.kd__thumbs { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.kd__thumbs::-webkit-scrollbar { display: none; }
.kd__thumb {
  width: 72px; height: 54px; flex: 0 0 auto;
  border: 2px solid transparent; border-radius: 10px;
  overflow: hidden; padding: 0; cursor: pointer; background: none;
}
.kd__thumb--on { border-color: var(--brand); }
.kd__thumb img { width: 100%; height: 100%; object-fit: cover; }

.kd__title { margin: 4px 0 0; font-size: 21px; font-weight: 800; color: var(--brand-strong); }
.kd__loc { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--ink-soft); font-size: 13.5px; }
.kd__loc i { color: var(--brand-soft); }
.kd__price { background: var(--sand-soft); border-radius: 14px; padding: 14px 16px; }
.kd__price small { display: block; font-size: 12px; color: var(--brand-soft); }
.kd__price strong { font-size: 22px; font-weight: 800; color: var(--brand); }
.kd__price span { font-size: 13px; color: var(--ink-soft); margin-left: 4px; }
.kd__meta { display: flex; gap: 16px; font-size: 13px; color: var(--ink-soft); flex-wrap: wrap; }
.kd__meta i { color: var(--brand-soft); margin-right: 5px; }
.kd__fac { display: flex; flex-wrap: wrap; gap: 8px; }
.kd__fac-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--surface); border: 1px solid var(--line);
  padding: 6px 11px; border-radius: 999px; font-size: 12px; color: var(--brand-soft);
}

.kd__section { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.kd__section h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--brand-strong); }
.kd__section p { margin: 0; line-height: 1.7; color: var(--ink); font-size: 14px; }
.kd__rooms { display: grid; gap: 10px; }
.kd__room { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
.kd__room-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.kd__room-head strong { color: var(--brand-strong); }
.kd__room-status { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
.kd__room-status.is-kosong { background: #e3f5ec; color: #2f9e6b; }
.kd__room-status.is-terisi { background: #f6e7e4; color: var(--danger); }
.kd__room-status.is-maintenance { background: var(--sand-soft); color: var(--brand-soft); }
.kd__room-price { margin: 0 0 10px; color: var(--brand); font-weight: 700; font-size: 16px; }
.kd__room-price small { color: var(--ink-soft); font-weight: 500; font-size: 12px; }
.kd__room-cta { width: 100%; }

.kd__bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(72px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: var(--app-max-width);
  padding: 0 16px;
  z-index: 30;
}
.w-full { width: 100%; }
</style>
