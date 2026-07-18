<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type OfficeInfo = {
  telepon?: string
  email?: string
  whatsapp?: string
  jam_operasional?: string
  alamat_maps?: string
  sosial?: { instagram?: string; facebook?: string; tiktok?: string }
}
type Kos = {
  id: number
  nama: string
  logo_url?: string | null
  favicon_url?: string | null
  og_image_url?: string | null
  informasi_kantor?: OfficeInfo | null
}
type Setting = { id: number; kos_id: number | null; kunci: string; nilai: any }

const api = useApi()

const kosList = ref<Kos[]>([])
const selectedKos = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const saved = ref(false)
const saveError = ref<string | null>(null)

const defaultSettings = {
  mode_jatuh_tempo: 'seragam',
  tanggal_jatuh_tempo_seragam: 10,
  masa_toleransi_hari: 0,
  cicilan_diizinkan: true,
  jumlah_termin_maksimum: 3,
  denda_aktif: false,
  jenis_denda: 'nominal_tetap',
  besaran_denda: 0,
  frekuensi_denda: 'sekali',
}
const form = reactive({ ...defaultSettings })

const modeOptions = [
  { label: 'Seragam', value: 'seragam' },
  { label: 'Tanggal masuk', value: 'mengikuti_tanggal_masuk' },
]
const jenisDendaOptions = [
  { label: 'Nominal tetap', value: 'nominal_tetap' },
  { label: 'Persentase', value: 'persentase' },
]
const frekuensiOptions = [
  { label: 'Sekali', value: 'sekali' },
  { label: 'Per hari', value: 'per_hari' },
  { label: 'Per minggu', value: 'per_minggu' },
]

const kosOptions = computed(() => kosList.value.map((k) => ({ label: k.nama, value: k.id })))

function applySettings(settings: Setting[]) {
  Object.assign(form, defaultSettings)
  for (const item of settings) {
    if (item.kunci in form) {
      ;(form as any)[item.kunci] = item.nilai
    }
  }
}

async function load() {
  loading.value = true
  error.value = null
  saved.value = false
  try {
    const kosRes = await api<{ data: Kos[] }>('/kos')
    kosList.value = kosRes.data
    selectedKos.value ??= kosList.value[0]?.id ?? null
    if (selectedKos.value) {
      const settings = await api<{ data: Setting[] }>(`/settings?kos_id=${selectedKos.value}`)
      applySettings(settings.data)
      applyKonsultasi(settings.data)
    }
    applyOffice(kosList.value.find((k) => k.id === selectedKos.value))
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat pengaturan.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saveError.value = null
  saved.value = false
  if (!selectedKos.value) {
    saveError.value = 'Pilih kos dulu sebelum menyimpan.'
    return
  }
  saving.value = true
  try {
    await Promise.all(Object.entries(form).map(([kunci, nilai]) =>
      api('/settings', {
        method: 'POST',
        body: { kos_id: selectedKos.value, kunci, nilai },
      }),
    ))
    saved.value = true
  } catch (e: any) {
    saveError.value =
      e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan pengaturan.'
  } finally {
    saving.value = false
  }
}

/* ---------- Logo situs GLOBAL (sidebar admin, landing, login, invoice) ---------- */
const brand = useBrandStore()
const siteLogo = ref<string | null>(null)
const siteLogoUploading = ref(false)
const siteLogoError = ref<string | null>(null)

async function loadSiteLogo() {
  try {
    const res = await api<{ data: { logo_url: string | null } }>('/public/site')
    siteLogo.value = res.data?.logo_url ?? null
  } catch {
    /* abaikan */
  }
}

async function uploadSiteLogo(file: File) {
  siteLogoUploading.value = true
  siteLogoError.value = null
  try {
    const fd = new FormData()
    fd.append('logo', file)
    const res = await api<{ logo_url: string }>(`/site/logo`, { method: 'POST', body: fd })
    siteLogo.value = res.logo_url
    // segarkan logo + favicon sidebar admin
    brand.setLogo(res.logo_url)
  } catch (e: any) {
    siteLogoError.value = e?.data?.message ?? 'Gagal mengunggah logo situs.'
  } finally {
    siteLogoUploading.value = false
  }
}

/* ---------- Logo kos (per kos) ---------- */
const logoUploading = ref(false)
const logoError = ref<string | null>(null)

const currentLogo = computed(
  () => kosList.value.find((k) => k.id === selectedKos.value)?.logo_url ?? null,
)

async function uploadLogo(file: File) {
  if (!selectedKos.value) return
  logoUploading.value = true
  logoError.value = null
  try {
    const fd = new FormData()
    fd.append('logo', file)
    const res = await api<{ kos: Kos }>(`/kos/${selectedKos.value}/logo`, {
      method: 'POST',
      body: fd,
    })
    const kos = kosList.value.find((k) => k.id === selectedKos.value)
    if (kos) kos.logo_url = res.kos.logo_url
  } catch (e: any) {
    logoError.value = e?.data?.message ?? 'Gagal mengunggah logo.'
  } finally {
    logoUploading.value = false
  }
}

/* ---------- Favicon & gambar SEO (OG) kos ---------- */
const faviconUploading = ref(false)
const faviconError = ref<string | null>(null)
const ogUploading = ref(false)
const ogError = ref<string | null>(null)

const currentFavicon = computed(
  () => kosList.value.find((k) => k.id === selectedKos.value)?.favicon_url ?? null,
)
const currentOg = computed(
  () => kosList.value.find((k) => k.id === selectedKos.value)?.og_image_url ?? null,
)

async function uploadAset(field: 'favicon' | 'og_image', endpoint: string, file: File) {
  if (!selectedKos.value) return
  const uploading = field === 'favicon' ? faviconUploading : ogUploading
  const errRef = field === 'favicon' ? faviconError : ogError
  uploading.value = true
  errRef.value = null
  try {
    const fd = new FormData()
    fd.append(field, file)
    const res = await api<{ kos: Kos }>(`/kos/${selectedKos.value}/${endpoint}`, {
      method: 'POST',
      body: fd,
    })
    const kos = kosList.value.find((k) => k.id === selectedKos.value)
    if (kos) {
      kos.favicon_url = res.kos.favicon_url
      kos.og_image_url = res.kos.og_image_url
    }
  } catch (e: any) {
    errRef.value = e?.data?.message ?? 'Gagal mengunggah gambar.'
  } finally {
    uploading.value = false
  }
}

/* ---------- Informasi kantor ---------- */
const office = reactive<Required<OfficeInfo>>({
  telepon: '',
  email: '',
  whatsapp: '',
  jam_operasional: '',
  alamat_maps: '',
  sosial: { instagram: '', facebook: '', tiktok: '' },
})
const officeSaving = ref(false)
const officeSaved = ref(false)
const officeError = ref<string | null>(null)

function applyOffice(kos?: Kos) {
  const info = kos?.informasi_kantor ?? {}
  office.telepon = info.telepon ?? ''
  office.email = info.email ?? ''
  office.whatsapp = info.whatsapp ?? ''
  office.jam_operasional = info.jam_operasional ?? ''
  office.alamat_maps = info.alamat_maps ?? ''
  office.sosial = {
    instagram: info.sosial?.instagram ?? '',
    facebook: info.sosial?.facebook ?? '',
    tiktok: info.sosial?.tiktok ?? '',
  }
}

async function saveOffice() {
  if (!selectedKos.value) return
  officeSaving.value = true
  officeError.value = null
  officeSaved.value = false
  try {
    const res = await api<{ kos: Kos }>(`/kos/${selectedKos.value}`, {
      method: 'PUT',
      body: { informasi_kantor: office },
    })
    const kos = kosList.value.find((k) => k.id === selectedKos.value)
    if (kos) kos.informasi_kantor = res.kos.informasi_kantor
    officeSaved.value = true
  } catch (e: any) {
    officeError.value = e?.data?.message ?? 'Gagal menyimpan informasi kantor.'
  } finally {
    officeSaving.value = false
  }
}

/* ---------- Pengaturan sewa kos / konsultasi WhatsApp (per kos) ---------- */
const konsultasi = reactive({ nomor: '', template: '' })
const konsultasiSaving = ref(false)
const konsultasiSaved = ref(false)
const konsultasiError = ref<string | null>(null)

function applyKonsultasi(settings: Setting[]) {
  konsultasi.nomor = settings.find((s) => s.kunci === 'konsultasi_wa_nomor')?.nilai ?? ''
  konsultasi.template = settings.find((s) => s.kunci === 'konsultasi_wa_template')?.nilai ?? ''
}

async function saveKonsultasi() {
  if (!selectedKos.value) {
    konsultasiError.value = 'Pilih kos dulu.'
    return
  }
  konsultasiSaving.value = true
  konsultasiError.value = null
  konsultasiSaved.value = false
  try {
    await Promise.all([
      api('/settings', { method: 'POST', body: { kos_id: selectedKos.value, kunci: 'konsultasi_wa_nomor', nilai: konsultasi.nomor } }),
      api('/settings', { method: 'POST', body: { kos_id: selectedKos.value, kunci: 'konsultasi_wa_template', nilai: konsultasi.template } }),
    ])
    konsultasiSaved.value = true
  } catch (e: any) {
    konsultasiError.value = e?.data?.message ?? 'Gagal menyimpan pengaturan sewa.'
  } finally {
    konsultasiSaving.value = false
  }
}

watch(selectedKos, async () => {
  if (!loading.value) await load()
})

onMounted(async () => {
  await Promise.all([load(), loadSiteLogo()])
})
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Pengaturan</h1>
      <p class="nk-pagehead__sub">Logo situs global &amp; pengaturan tiap kos.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memuat pengaturan…</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <template v-else>
      <!-- ============ GLOBAL (seluruh situs) ============ -->
      <section class="logo-card nk-rise">
        <div class="logo-card__info">
          <h2 class="nk-sect" style="margin-top: 0">Logo situs (global)</h2>
          <p class="logo-card__hint">
            Logo utama NgekosKuy — dipakai di sidebar admin, header halaman depan, halaman login, dan invoice.
            Berlaku untuk seluruh situs. Format gambar, maks 2 MB.
          </p>
          <Message v-if="siteLogoError" severity="error" class="logo-card__msg">{{ siteLogoError }}</Message>
          <span v-if="siteLogoUploading" class="logo-card__status"><i class="pi pi-spin pi-spinner" /> Mengunggah…</span>
        </div>
        <ImagePicker :model-value="siteLogo" label="Logo situs" @select="(file) => uploadSiteLogo(file)" />
      </section>

      <!-- ============ PER KOS ============ -->
      <section class="group nk-rise">
        <h2 class="nk-sect" style="margin-top: 0">Pengaturan per kos</h2>
        <p class="logo-card__hint">
          Pilih kos, lalu atur logo, favicon, info kantor, konsultasi WhatsApp, jatuh tempo, cicilan, dan denda
          khusus untuk kos tersebut.
        </p>
        <div class="nk-field" style="margin-top: 12px; max-width: 320px">
          <label class="nk-label">Kos</label>
          <Select
            v-model="selectedKos"
            :options="kosOptions"
            option-label="label"
            option-value="value"
            class="w-full"
            placeholder="Pilih kos"
          />
        </div>
      </section>

      <section class="logo-card nk-rise">
        <div class="logo-card__info">
          <h2 class="nk-sect" style="margin-top: 0">Logo kos</h2>
          <p class="logo-card__hint">
            Logo khusus kos ini (tampil di halaman publik kos). Format gambar, maks 2 MB.
          </p>
          <Message v-if="logoError" severity="error" class="logo-card__msg">{{ logoError }}</Message>
          <span v-if="logoUploading" class="logo-card__status"><i class="pi pi-spin pi-spinner" /> Mengunggah…</span>
        </div>
        <ImagePicker
          :model-value="currentLogo"
          label="Logo"
          @select="(file) => uploadLogo(file)"
        />
      </section>

      <section class="logo-card nk-rise">
        <div class="logo-card__info">
          <h2 class="nk-sect" style="margin-top: 0">Favicon</h2>
          <p class="logo-card__hint">
            Ikon di tab browser halaman publik kos. Disarankan gambar persegi (mis. 64×64), maks 1 MB.
          </p>
          <Message v-if="faviconError" severity="error" class="logo-card__msg">{{ faviconError }}</Message>
          <span v-if="faviconUploading" class="logo-card__status"><i class="pi pi-spin pi-spinner" /> Mengunggah…</span>
        </div>
        <ImagePicker
          :model-value="currentFavicon"
          label="Favicon"
          @select="(file) => uploadAset('favicon', 'favicon', file)"
        />
      </section>

      <section class="logo-card nk-rise">
        <div class="logo-card__info">
          <h2 class="nk-sect" style="margin-top: 0">Gambar SEO (share link)</h2>
          <p class="logo-card__hint">
            Gambar preview saat link kos dibagikan ke WhatsApp/medsos (og:image). Disarankan 1200×630, maks 4 MB.
          </p>
          <Message v-if="ogError" severity="error" class="logo-card__msg">{{ ogError }}</Message>
          <span v-if="ogUploading" class="logo-card__status"><i class="pi pi-spin pi-spinner" /> Mengunggah…</span>
        </div>
        <ImagePicker
          :model-value="currentOg"
          label="Gambar SEO"
          @select="(file) => uploadAset('og_image', 'og-image', file)"
        />
      </section>

      <form class="settings nk-rise" @submit.prevent="saveOffice">
        <section class="group">
          <h2 class="nk-sect" style="margin-top: 0">Informasi kantor</h2>
          <div class="grid grid-2">
            <div class="nk-field">
              <label class="nk-label">Telepon</label>
              <InputText v-model="office.telepon" class="w-full" placeholder="021-000000" />
            </div>
            <div class="nk-field">
              <label class="nk-label">WhatsApp</label>
              <InputText v-model="office.whatsapp" class="w-full" placeholder="628xxxxxxxxxx" />
            </div>
            <div class="nk-field">
              <label class="nk-label">Email</label>
              <InputText v-model="office.email" class="w-full" placeholder="halo@kos.com" />
            </div>
            <div class="nk-field">
              <label class="nk-label">Jam operasional</label>
              <InputText v-model="office.jam_operasional" class="w-full" placeholder="Senin–Jumat 08.00–17.00" />
            </div>
            <div class="nk-field nk-field--full">
              <label class="nk-label">Link Google Maps</label>
              <InputText v-model="office.alamat_maps" class="w-full" placeholder="https://maps.google.com/…" />
            </div>
            <div class="nk-field">
              <label class="nk-label">Instagram</label>
              <InputText v-model="office.sosial.instagram" class="w-full" placeholder="@akun" />
            </div>
            <div class="nk-field">
              <label class="nk-label">Facebook</label>
              <InputText v-model="office.sosial.facebook" class="w-full" placeholder="facebook.com/…" />
            </div>
            <div class="nk-field">
              <label class="nk-label">TikTok</label>
              <InputText v-model="office.sosial.tiktok" class="w-full" placeholder="@akun" />
            </div>
          </div>
          <Message v-if="officeError" severity="error" size="small" class="logo-card__msg">{{ officeError }}</Message>
          <Message v-if="officeSaved" severity="success" size="small" class="logo-card__msg">Informasi kantor tersimpan.</Message>
          <div style="margin-top: 12px">
            <Button type="submit" label="Simpan informasi kantor" icon="pi pi-save" :loading="officeSaving" />
          </div>
        </section>
      </form>

      <form class="settings nk-rise" @submit.prevent="saveKonsultasi">
        <section class="group">
          <h2 class="nk-sect" style="margin-top: 0">Sewa kos (Konsultasi WhatsApp)</h2>
          <p class="logo-card__hint">
            Khusus kos terpilih. Tombol <strong>“Konsultasi Kos”</strong> di halaman publik kos ini membuka WhatsApp
            ke nomor ini dengan teks otomatis. Tag <code>{kos}</code> otomatis diganti nama kos.
          </p>
          <div class="grid grid-2" style="margin-top: 14px">
            <div class="nk-field">
              <label class="nk-label">Nomor WhatsApp</label>
              <InputText v-model="konsultasi.nomor" class="w-full" placeholder="628xxxxxxxxxx" />
            </div>
            <div class="nk-field nk-field--full">
              <label class="nk-label">Teks otomatis</label>
              <Textarea
                v-model="konsultasi.template"
                class="w-full"
                rows="3"
                auto-resize
                placeholder="Halo Admin Ngekoskuy, saya ingin konsultasi tentang {kos}. Apakah kamarnya masih tersedia?"
              />
            </div>
          </div>
          <Message v-if="konsultasiError" severity="error" size="small" class="logo-card__msg">{{ konsultasiError }}</Message>
          <Message v-if="konsultasiSaved" severity="success" size="small" class="logo-card__msg">Pengaturan sewa tersimpan.</Message>
          <div style="margin-top: 12px">
            <Button type="submit" label="Simpan pengaturan sewa" icon="pi pi-save" :loading="konsultasiSaving" />
          </div>
        </section>
      </form>

      <form class="settings nk-rise" @submit.prevent="save">
      <section class="group">
        <h2 class="nk-sect">Jatuh tempo</h2>
        <div class="grid">
          <div class="nk-field">
            <label class="nk-label">Mode</label>
            <Select
              v-model="form.mode_jatuh_tempo"
              :options="modeOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div class="nk-field">
            <label class="nk-label">Tanggal</label>
            <InputNumber v-model="form.tanggal_jatuh_tempo_seragam" :min="1" :max="28" class="w-full" />
          </div>
          <div class="nk-field">
            <label class="nk-label">Toleransi hari</label>
            <InputNumber v-model="form.masa_toleransi_hari" :min="0" :max="31" class="w-full" />
          </div>
        </div>
      </section>

      <section class="group">
        <h2 class="nk-sect">Cicilan</h2>
        <div class="row">
          <span>Cicilan aktif</span>
          <ToggleSwitch v-model="form.cicilan_diizinkan" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Maksimum termin</label>
          <InputNumber v-model="form.jumlah_termin_maksimum" :min="1" :max="12" class="w-full" />
        </div>
      </section>

      <section class="group">
        <h2 class="nk-sect">Denda</h2>
        <div class="row">
          <span>Denda aktif</span>
          <ToggleSwitch v-model="form.denda_aktif" />
        </div>
        <div class="grid">
          <div class="nk-field">
            <label class="nk-label">Jenis</label>
            <Select
              v-model="form.jenis_denda"
              :options="jenisDendaOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div class="nk-field">
            <label class="nk-label">Besaran</label>
            <InputNumber v-model="form.besaran_denda" :min="0" class="w-full" />
          </div>
          <div class="nk-field">
            <label class="nk-label">Frekuensi</label>
            <Select
              v-model="form.frekuensi_denda"
              :options="frekuensiOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
        </div>
      </section>

        <Message v-if="saveError" severity="error" size="small">{{ saveError }}</Message>
        <Message v-if="saved" severity="success" size="small">Pengaturan tersimpan.</Message>
        <Button type="submit" label="Simpan" icon="pi pi-save" :loading="saving" />
      </form>
    </template>
  </div>
</template>

<style scoped>
.logo-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px 22px;
}
.logo-card__info { min-width: 0; }
.logo-card__hint { margin: 6px 0 0; font-size: 13px; color: var(--ink-soft); line-height: 1.5; max-width: 46ch; }
.logo-card__msg { margin-top: 10px; }
.logo-card__status { display: inline-flex; align-items: center; gap: 7px; margin-top: 10px; font-size: 13px; color: var(--brand); }
@media (max-width: 520px) {
  .logo-card { flex-direction: column-reverse; align-items: flex-start; }
}
.settings {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.group {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.grid { display: grid; gap: 12px; margin-top: 12px; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.nk-field--full { grid-column: 1 / -1; }
@media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 2px;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
}
.w-full { width: 100%; }
</style>
