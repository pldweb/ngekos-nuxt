<script setup lang="ts">
import type { PublicKos } from '~/composables/usePublicKos'

definePageMeta({ layout: 'public' })

const route = useRoute()
const auth = useAuthStore()
const api = useApi()
const { detail } = usePublicKos()

// Diambil saat SSR agar meta og:image ikut terender di HTML awal (dibaca crawler).
const { data: kos, pending: loading } = await useAsyncData<PublicKos | null>(
  `kos-${route.params.id}`,
  async () => {
    try {
      return (await detail(route.params.id as string)).data
    } catch {
      return null
    }
  },
)

const activeFoto = ref<string | null>(kos.value?.foto?.[0] ?? null)
watch(kos, (v) => { activeFoto.value = v?.foto?.[0] ?? null })

// Konfigurasi tombol "Konsultasi Kos" (WhatsApp) — per kos.
const { data: konsul } = await useAsyncData(
  `konsultasi-wa-${route.params.id}`,
  async () => {
    try {
      return (await api<{ data: { nomor: string | null; template: string } }>(
        `/public/kos/${route.params.id}/konsultasi`,
      )).data
    } catch {
      return { nomor: null, template: '' }
    }
  },
)

const waLink = computed(() => {
  const nomor = konsul.value?.nomor
  if (!nomor || !kos.value) return null
  const digits = nomor.replace(/\D/g, '').replace(/^0/, '62')
  const teks = (konsul.value?.template ?? '').replaceAll('{kos}', kos.value.nama)
  return `https://wa.me/${digits}?text=${encodeURIComponent(teks)}`
})

const today = () => new Date().toISOString().slice(0, 10)

const bookDialog = ref(false)
const bookSaving = ref(false)
const bookError = ref<string | null>(null)
const book = reactive({
  room_id: null as number | null,
  nama: '',
  kontak: '',
  tanggal_mulai: today(),
  durasi_sewa: 1,
})

const availableRooms = computed(() => (kos.value?.rooms ?? []).filter((r) => r.status === 'kosong'))
const roomOptions = computed(() => availableRooms.value.map((r) => ({
  label: `Kamar ${r.nomor} - ${formatRupiah(r.harga_sewa)}/bulan`,
  value: r.id,
})))

function openBooking() {
  book.room_id = availableRooms.value[0]?.id ?? null
  book.nama = auth.user?.name ?? ''
  book.kontak = auth.user?.phone ?? ''
  book.tanggal_mulai = today()
  book.durasi_sewa = 1
  bookError.value = null
  bookDialog.value = true
}

async function submitBooking() {
  if (!book.room_id) return
  bookSaving.value = true
  bookError.value = null
  try {
    await api('/bookings', {
      method: 'POST',
      body: {
        room_id: book.room_id,
        nama: book.nama,
        kontak: book.kontak,
        tanggal_mulai: book.tanggal_mulai,
        durasi_sewa: book.durasi_sewa,
      },
    })
    bookDialog.value = false
    await navigateTo(auth.isAuthenticated ? '/home/bayar' : '/register')
  } catch (e: any) {
    bookError.value = e?.data?.message ?? 'Gagal mengajukan sewa.'
  } finally {
    bookSaving.value = false
  }
}

const ogImage = computed(() => kos.value?.og_image_url ?? kos.value?.logo_url ?? '/logo-ngekoskuy.png')

useSeoMeta({
  title: () => (kos.value ? `${kos.value.nama} — Ngekoskuy` : 'Detail Kos — Ngekoskuy'),
  description: () => kos.value?.deskripsi ?? 'Detail kos di NgekosKuy.',
  ogTitle: () => (kos.value ? kos.value.nama : 'Detail Kos — Ngekoskuy'),
  ogDescription: () => kos.value?.deskripsi ?? 'Detail kos di NgekosKuy.',
  ogImage: () => ogImage.value,
  twitterCard: 'summary_large_image',
})

useHead(() => ({
  link: kos.value?.favicon_url ? [{ rel: 'icon', href: kos.value.favicon_url }] : [],
}))

const statusLabel: Record<string, string> = {
  kosong: 'Tersedia',
  terisi: 'Terisi',
  maintenance: 'Perbaikan',
}
</script>

<template>
  <div class="kd">
    <div v-if="loading" class="kd__state">Memuat detail kos…</div>

    <div v-else-if="!kos" class="kd__state">
      <i class="pi pi-exclamation-circle" />
      <p>Kos tidak ditemukan.</p>
      <NuxtLink to="/cari-kos"><Button label="Kembali ke Cari Kos" rounded /></NuxtLink>
    </div>

    <template v-else>
      <section class="kd__top">
        <div class="kd__gallery">
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
        </div>

        <aside class="kd__info">
          <div class="kd__brand">
            <img v-if="kos.logo_url" :src="kos.logo_url" :alt="`Logo ${kos.nama}`" class="kd__logo" />
            <h1>{{ kos.nama }}</h1>
          </div>
          <p class="kd__loc"><i class="pi pi-map-marker" />{{ kos.alamat }}</p>

          <div class="kd__price">
            <template v-if="kos.harga_mulai != null">
              <small>Mulai dari</small>
              <strong>{{ formatRupiah(kos.harga_mulai) }}</strong>
              <span>/ bulan</span>
            </template>
            <template v-else><strong>Hubungi pemilik</strong></template>
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

          <div class="kd__actions">
            <Button
              class="kd__cta"
              label="Ajukan Sewa"
              icon="pi pi-arrow-right"
              iconPos="right"
              rounded
              :disabled="availableRooms.length === 0"
              @click="openBooking"
            />
            <a
              v-if="waLink"
              :href="waLink"
              target="_blank"
              rel="noopener"
              class="kd__cta"
            >
              <Button label="Konsultasi Kos" icon="pi pi-whatsapp" severity="success" rounded outlined />
            </a>
          </div>
        </aside>
      </section>

      <section v-if="kos.deskripsi" class="kd__section">
        <h2>Deskripsi</h2>
        <p>{{ kos.deskripsi }}</p>
      </section>

      <section v-if="kos.peraturan_kos" class="kd__section">
        <h2>Peraturan Kos</h2>
        <p class="kd__rules">{{ kos.peraturan_kos }}</p>
      </section>

      <Dialog v-model:visible="bookDialog" modal header="Ajukan sewa" :style="{ width: '92vw', maxWidth: '480px' }">
        <form class="book" @submit.prevent="submitBooking">
          <Message v-if="bookError" severity="error" :closable="false">{{ bookError }}</Message>
          <div class="field">
            <label for="room">Kamar</label>
            <Dropdown
              id="room"
              v-model="book.room_id"
              :options="roomOptions"
              option-label="label"
              option-value="value"
              placeholder="Pilih kamar"
              class="w-full"
              required
            />
          </div>
          <div class="field">
            <label for="name">Nama</label>
            <InputText id="name" v-model="book.nama" required />
          </div>
          <div class="field">
            <label for="phone">No. WhatsApp</label>
            <InputText id="phone" v-model="book.kontak" required />
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="field">
              <label for="start">Mulai sewa</label>
              <DateField id="start" v-model="book.tanggal_mulai" required />
            </div>
            <div class="field">
              <label for="duration">Durasi (bulan)</label>
              <InputNumber id="duration" v-model="book.durasi_sewa" :min="1" show-buttons />
            </div>
          </div>
          <p class="book__hint">Setelah pengajuan, akun yang sudah login akan diarahkan ke pembayaran. Jika belum punya akun, lanjut daftar dulu untuk meneruskan transaksi.</p>
          <div class="flex justify-end gap-2">
            <Button type="button" label="Batal" text @click="bookDialog = false" />
            <Button type="submit" label="Ajukan" icon="pi pi-send" :loading="bookSaving" />
          </div>
        </form>
      </Dialog>

      <section v-if="kos.rooms && kos.rooms.length" class="kd__section">
        <h2>Pilihan Kamar</h2>
        <div class="kd__rooms">
          <div v-for="r in kos.rooms" :key="r.id" class="kd__room">
            <div class="kd__room-head">
              <strong>Kamar {{ r.nomor }}</strong>
              <span class="kd__room-status" :class="`is-${r.status}`">
                {{ statusLabel[r.status] ?? r.status }}
              </span>
            </div>
            <p class="kd__room-price">{{ formatRupiah(r.harga_sewa) }} <small>/ bulan</small></p>
            <div class="kd__room-fac">
              <span v-for="f in r.fasilitas" :key="f">
                <i :class="fasilitasInfo(f).icon" />{{ fasilitasInfo(f).label }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.kd { max-width: 1120px; margin: 0 auto; padding: 40px 24px 72px; }
.kd__state { text-align: center; padding: 80px 20px; color: var(--ink-soft); }
.kd__state i { font-size: 44px; display: block; margin-bottom: 14px; color: var(--sand); }
.kd__state p { margin: 0 0 18px; }

.kd__top {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 32px;
}
/* Grid item boleh menyusut: tanpa ini min-width:auto membuat strip thumbnail
   (overflow-x:auto) melebarkan kolom & meluapkan halaman di mobile. */
.kd__gallery,
.kd__info { min-width: 0; }
.kd__cover {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background: var(--sand-soft);
}
.kd__cover img { width: 100%; height: 100%; object-fit: cover; }
.kd__ph { width: 100%; height: 100%; display: grid; place-items: center; color: var(--brand-soft); font-size: 54px; }
.kd__badge {
  position: absolute; top: 14px; left: 14px;
  background: rgba(82, 55, 36, 0.92);
  color: #fff; font-size: 12px; font-weight: 600;
  padding: 6px 14px; border-radius: 999px;
}
.kd__thumbs {
  display: flex; gap: 10px; margin-top: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.kd__thumbs::-webkit-scrollbar { display: none; }
.kd__thumb {
  width: 84px; height: 60px;
  flex: 0 0 auto;
  border: 2px solid transparent;
  border-radius: 12px; overflow: hidden; padding: 0; cursor: pointer; background: none;
}
.kd__thumb--on { border-color: var(--brand); }
.kd__thumb img { width: 100%; height: 100%; object-fit: cover; }

.kd__brand { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.kd__logo { width: 46px; height: 46px; object-fit: contain; border-radius: 10px; background: var(--sand-soft); padding: 4px; flex-shrink: 0; }
.kd__info h1 { margin: 0; font-size: 26px; font-weight: 800; color: var(--brand-strong); }
.kd__loc { display: flex; align-items: center; gap: 6px; margin: 0 0 20px; color: var(--ink-soft); font-size: 14px; }
.kd__loc i { color: var(--brand-soft); }
.kd__price {
  background: var(--sand-soft);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 18px;
}
.kd__price small { display: block; font-size: 12px; color: var(--brand-soft); margin-bottom: 2px; }
.kd__price strong { font-size: 26px; font-weight: 800; color: var(--brand); }
.kd__price span { font-size: 13px; color: var(--ink-soft); margin-left: 4px; }
.kd__meta { display: flex; gap: 20px; margin-bottom: 18px; font-size: 13.5px; color: var(--ink-soft); }
.kd__meta i { color: var(--brand-soft); margin-right: 6px; }
.kd__fac { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
.kd__fac-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: #fff; border: 1px solid var(--line);
  padding: 7px 12px; border-radius: 999px; font-size: 12.5px; color: var(--brand-soft);
}
.kd__actions { display: flex; flex-direction: column; gap: 10px; }
.kd__cta { width: 100%; }
.kd__cta :deep(.p-button) { width: 100%; }

.book { display: flex; flex-direction: column; gap: 14px; }
.book .field { display: flex; flex-direction: column; gap: 6px; }
.book label { font-size: 13px; font-weight: 600; color: var(--ink); }
.book__hint { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--ink-soft); }

.kd__section { margin-top: 44px; }
.kd__section h2 { margin: 0 0 14px; font-size: 20px; font-weight: 700; color: var(--brand-strong); }
.kd__section p { margin: 0; line-height: 1.7; color: var(--ink); }
.kd__rules { white-space: pre-line; }
.kd__rooms { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
.kd__room { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 18px; }
.kd__room-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.kd__room-head strong { color: var(--brand-strong); }
.kd__room-status { font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
.kd__room-status.is-kosong { background: #e3f5ec; color: #2f9e6b; }
.kd__room-status.is-terisi { background: #f6e7e4; color: var(--danger); }
.kd__room-status.is-maintenance { background: var(--sand-soft); color: var(--brand-soft); }
.kd__room-price { margin: 0 0 10px; color: var(--brand); font-weight: 700; font-size: 17px; }
.kd__room-price small { color: var(--ink-soft); font-weight: 500; font-size: 12px; }
.kd__room-fac { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 12px; color: var(--ink-soft); }
.kd__room-fac i { color: var(--brand-soft); margin-right: 4px; }

@media (max-width: 900px) {
  .kd__top { grid-template-columns: 1fr; gap: 22px; }
}
@media (max-width: 560px) {
  .kd { padding: 20px 16px 56px; }
  .kd__cover { aspect-ratio: 4 / 3; border-radius: 16px; }
  .kd__info h1 { font-size: 22px; }
  .kd__loc { margin-bottom: 16px; }
  .kd__price { padding: 14px 16px; margin-bottom: 14px; }
  .kd__price strong { font-size: 22px; }
  .kd__meta { gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
  .kd__section { margin-top: 32px; }
  .kd__section h2 { font-size: 18px; }
  .kd__rooms { grid-template-columns: 1fr; gap: 12px; }
  .kd__room { padding: 14px; border-radius: 14px; }
}
</style>
