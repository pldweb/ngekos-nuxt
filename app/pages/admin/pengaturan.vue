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
  alamat?: string | null
  deskripsi?: string | null
  foto?: string[]
  fasilitas?: string[]
  logo_url?: string | null
  favicon_url?: string | null
  og_image_url?: string | null
  informasi_kantor?: OfficeInfo | null
}
type Setting = { id: number; kos_id: number | null; kunci: string; nilai: any }
type FacilityOption = { label: string; value: string }
type ConfirmAction = {
  title: string
  message: string
  confirmLabel?: string
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'
  run: () => Promise<void> | void
}

const api = useApi()
const toast = useToast()

const kosList = ref<Kos[]>([])
const selectedKos = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const saved = ref(false)
const saveError = ref<string | null>(null)
const confirmDialog = ref(false)
const confirming = ref(false)
const confirmAction = ref<ConfirmAction | null>(null)

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
const defaultFasilitasOptions: FacilityOption[] = [
  { label: 'WiFi', value: 'wifi' },
  { label: 'AC', value: 'ac' },
  { label: 'Dapur', value: 'dapur' },
  { label: 'Parkir', value: 'parkir' },
  { label: 'Kasur', value: 'kasur' },
  { label: 'Lemari', value: 'lemari' },
  { label: 'Kamar mandi dalam', value: 'kamar_mandi_dalam' },
  { label: 'Kamar mandi luar', value: 'kamar_mandi_luar' },
]
const fasilitasOptions = ref<FacilityOption[]>([...defaultFasilitasOptions])

const kosOptions = computed(() => kosList.value.map((k) => ({ label: k.nama, value: k.id })))
const activeTab = ref('profil')
const tabs = [
  { label: 'Profil Kos', value: 'profil', icon: 'pi pi-building' },
  { label: 'Aset', value: 'aset', icon: 'pi pi-images' },
  { label: 'Info & Aturan', value: 'info', icon: 'pi pi-info-circle' },
  { label: 'Tagihan', value: 'tagihan', icon: 'pi pi-calendar' },
  { label: 'Global', value: 'global', icon: 'pi pi-globe' },
]

function askConfirm(action: ConfirmAction) {
  confirmAction.value = action
  confirmDialog.value = true
}

async function runConfirmedAction() {
  if (!confirmAction.value) return
  confirming.value = true
  try {
    await confirmAction.value.run()
    confirmDialog.value = false
    confirmAction.value = null
  } finally {
    confirming.value = false
  }
}

function cancelConfirmedAction() {
  if (confirming.value) return
  confirmDialog.value = false
  confirmAction.value = null
}

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
    const [kosRes, globalSettings] = await Promise.all([
      api<{ data: Kos[] }>('/kos'),
      api<{ data: Setting[] }>('/settings'),
    ])
    kosList.value = kosRes.data
    applyFacilityOptions(globalSettings.data)
    selectedKos.value ??= kosList.value[0]?.id ?? null
    if (selectedKos.value) {
      const settings = await api<{ data: Setting[] }>(`/settings?kos_id=${selectedKos.value}`)
      applySettings(settings.data)
      applyKonsultasi(settings.data)
    }
    const selected = kosList.value.find((k) => k.id === selectedKos.value)
    applyOffice(selected)
    applyKosSpec(selected)
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat pengaturan.'
  } finally {
    loading.value = false
  }
}

function confirmSave() {
  askConfirm({
    title: 'Simpan pengaturan tagihan?',
    message: 'Perubahan jatuh tempo, cicilan, dan denda untuk kos terpilih akan disimpan.',
    confirmLabel: 'Simpan',
    run: save,
  })
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
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengaturan tagihan tersimpan.', life: 3000 })
  } catch (e: any) {
    saveError.value =
      e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan pengaturan.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: saveError.value, life: 4000 })
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

function confirmUploadSiteLogo(file: File) {
  askConfirm({
    title: 'Upload logo situs?',
    message: 'Logo situs global akan diganti dan dipakai di sidebar admin, halaman depan, login, dan invoice.',
    confirmLabel: 'Upload',
    run: () => uploadSiteLogo(file),
  })
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
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Logo situs diunggah.', life: 3000 })
  } catch (e: any) {
    siteLogoError.value = e?.data?.message ?? 'Gagal mengunggah logo situs.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: siteLogoError.value, life: 4000 })
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

function confirmUploadLogo(file: File) {
  askConfirm({
    title: 'Upload logo kos?',
    message: 'Logo kos terpilih akan diganti dengan gambar baru.',
    confirmLabel: 'Upload',
    run: () => uploadLogo(file),
  })
}

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
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Logo kos diunggah.', life: 3000 })
  } catch (e: any) {
    logoError.value = e?.data?.message ?? 'Gagal mengunggah logo.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: logoError.value, life: 4000 })
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

function confirmUploadAset(field: 'favicon' | 'og_image', endpoint: string, file: File) {
  askConfirm({
    title: field === 'favicon' ? 'Upload favicon?' : 'Upload gambar SEO?',
    message: field === 'favicon'
      ? 'Favicon kos terpilih akan diganti dengan gambar baru.'
      : 'Gambar preview link kos terpilih akan diganti dengan gambar baru.',
    confirmLabel: 'Upload',
    run: () => uploadAset(field, endpoint, file),
  })
}

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
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Gambar berhasil diunggah.', life: 3000 })
  } catch (e: any) {
    errRef.value = e?.data?.message ?? 'Gagal mengunggah gambar.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: errRef.value, life: 4000 })
  } finally {
    uploading.value = false
  }
}


/* ---------- Opsi fasilitas kos ---------- */
const facilityDialog = ref(false)
const facilitySaving = ref(false)
const facilityError = ref<string | null>(null)
const facilityForm = reactive({ index: null as number | null, label: '' })

function slugifyFacility(label: string) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'fasilitas'
}

function uniqueFacilityValue(label: string, currentIndex: number | null = null) {
  const base = slugifyFacility(label)
  let value = base
  let i = 2
  while (fasilitasOptions.value.some((item, index) => index !== currentIndex && item.value === value)) {
    value = `${base}_${i++}`
  }
  return value
}

function applyFacilityOptions(settings: Setting[]) {
  const savedOptions = settings.find((s) => s.kos_id === null && s.kunci === 'opsi_fasilitas_kos')?.nilai
  if (Array.isArray(savedOptions) && savedOptions.length) {
    fasilitasOptions.value = savedOptions
      .filter((item) => item?.label && item?.value)
      .map((item) => ({ label: String(item.label), value: String(item.value) }))
  } else {
    fasilitasOptions.value = [...defaultFasilitasOptions]
  }
}

function openAddFacility() {
  facilityForm.index = null
  facilityForm.label = ''
  facilityError.value = null
  facilityDialog.value = true
}

function openRenameFacility(index: number) {
  facilityForm.index = index
  facilityForm.label = fasilitasOptions.value[index]?.label ?? ''
  facilityError.value = null
  facilityDialog.value = true
}

function confirmSaveFacilityOption() {
  const label = facilityForm.label.trim()
  if (!label) {
    facilityError.value = 'Nama fasilitas wajib diisi.'
    return
  }

  askConfirm({
    title: facilityForm.index === null ? 'Tambah opsi fasilitas?' : 'Rename opsi fasilitas?',
    message: facilityForm.index === null
      ? `Opsi fasilitas ${label} akan ditambahkan ke daftar pilihan.`
      : `Opsi fasilitas akan diganti namanya menjadi ${label}.`,
    confirmLabel: facilityForm.index === null ? 'Tambah' : 'Simpan',
    run: saveFacilityOption,
  })
}

async function saveFacilityOption() {
  const label = facilityForm.label.trim()
  if (!label) {
    facilityError.value = 'Nama fasilitas wajib diisi.'
    return
  }

  const next = [...fasilitasOptions.value]
  if (facilityForm.index === null) {
    next.push({ label, value: uniqueFacilityValue(label) })
  } else if (next[facilityForm.index]) {
    next[facilityForm.index] = { ...next[facilityForm.index], label }
  }

  await persistFacilityOptions(next, facilityForm.index === null ? 'Opsi fasilitas ditambahkan.' : 'Opsi fasilitas diperbarui.')
  facilityDialog.value = false
}

function confirmDeleteFacilityOption(index: number) {
  const target = fasilitasOptions.value[index]
  if (!target) return
  askConfirm({
    title: 'Hapus opsi fasilitas?',
    message: `Opsi ${target.label} akan dihapus dari daftar pilihan dan dicopot dari spesifikasi kos yang sedang dibuka.`,
    confirmLabel: 'Hapus',
    severity: 'danger',
    run: () => deleteFacilityOption(index),
  })
}

async function deleteFacilityOption(index: number) {
  const target = fasilitasOptions.value[index]
  if (!target) return
  const next = fasilitasOptions.value.filter((_, i) => i !== index)
  spec.fasilitas = spec.fasilitas.filter((item) => item !== target.value)
  await persistFacilityOptions(next, 'Opsi fasilitas dihapus.')
}

async function persistFacilityOptions(next: FacilityOption[], successMessage: string) {
  facilitySaving.value = true
  facilityError.value = null
  try {
    await api('/settings', { method: 'POST', body: { kos_id: null, kunci: 'opsi_fasilitas_kos', nilai: next } })
    fasilitasOptions.value = next
    toast.add({ severity: 'success', summary: 'Berhasil', detail: successMessage, life: 3000 })
  } catch (e: any) {
    facilityError.value = e?.data?.message ?? 'Gagal menyimpan opsi fasilitas.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: facilityError.value, life: 4000 })
  } finally {
    facilitySaving.value = false
  }
}

/* ---------- Spesifikasi kos & galeri foto ---------- */
const spec = reactive({
  nama: '',
  alamat: '',
  deskripsi: '',
  fasilitas: [] as string[],
})
const specSaving = ref(false)
const specSaved = ref(false)
const specError = ref<string | null>(null)
const galleryUploading = ref(false)
const galleryError = ref<string | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)

const currentKos = computed(() => kosList.value.find((k) => k.id === selectedKos.value) ?? null)
const currentPhotos = computed(() => currentKos.value?.foto ?? [])

function applyKosSpec(kos?: Kos) {
  spec.nama = kos?.nama ?? ''
  spec.alamat = kos?.alamat ?? ''
  spec.deskripsi = kos?.deskripsi ?? ''
  spec.fasilitas = [...(kos?.fasilitas ?? [])]
  specSaved.value = false
  specError.value = null
  galleryError.value = null
}

function syncKos(kos: Kos) {
  const index = kosList.value.findIndex((item) => item.id === kos.id)
  if (index >= 0) kosList.value[index] = { ...kosList.value[index], ...kos }
}

function confirmSaveKosSpec() {
  askConfirm({
    title: 'Simpan spesifikasi kos?',
    message: 'Nama, alamat, deskripsi, dan fasilitas kos terpilih akan diperbarui.',
    confirmLabel: 'Simpan',
    run: saveKosSpec,
  })
}

async function saveKosSpec() {
  if (!selectedKos.value) return
  if (!spec.nama.trim()) {
    specError.value = 'Nama kos wajib diisi.'
    toast.add({ severity: 'warn', summary: 'Validasi', detail: specError.value, life: 3000 })
    return
  }
  specSaving.value = true
  specError.value = null
  specSaved.value = false
  try {
    const res = await api<{ kos: Kos }>(`/kos/${selectedKos.value}`, {
      method: 'PUT',
      body: {
        nama: spec.nama.trim(),
        alamat: spec.alamat || null,
        deskripsi: spec.deskripsi || null,
        fasilitas: spec.fasilitas,
      },
    })
    syncKos(res.kos)
    applyKosSpec(res.kos)
    specSaved.value = true
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Spesifikasi kos tersimpan.', life: 3000 })
  } catch (e: any) {
    specError.value = e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan spesifikasi kos.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: specError.value, life: 4000 })
  } finally {
    specSaving.value = false
  }
}

function onGalleryChange(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  if (galleryInput.value) galleryInput.value.value = ''
  confirmUploadKosPhotos(files)
}

function confirmUploadKosPhotos(files: File[]) {
  if (!files.length) return
  askConfirm({
    title: 'Upload foto kos?',
    message: `${files.length} foto akan ditambahkan ke galeri kos terpilih.`,
    confirmLabel: 'Upload',
    run: () => uploadKosPhotos(files),
  })
}

async function uploadKosPhotos(files: File[]) {
  if (!selectedKos.value || !files.length) return
  galleryUploading.value = true
  galleryError.value = null
  try {
    const fd = new FormData()
    fd.append('_method', 'PUT')
    fd.append('nama', spec.nama.trim() || currentKos.value?.nama || '')
    if (spec.alamat) fd.append('alamat', spec.alamat)
    if (spec.deskripsi) fd.append('deskripsi', spec.deskripsi)
    for (const item of spec.fasilitas) fd.append('fasilitas[]', item)
    files.forEach((file) => fd.append('foto[]', file))
    const res = await api<{ kos: Kos }>(`/kos/${selectedKos.value}`, { method: 'POST', body: fd })
    syncKos(res.kos)
    applyKosSpec(res.kos)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Foto kos diunggah.', life: 3000 })
  } catch (e: any) {
    galleryError.value = e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal mengunggah foto kos.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: galleryError.value, life: 4000 })
  } finally {
    galleryUploading.value = false
    if (galleryInput.value) galleryInput.value.value = ''
  }
}

const deletingPhoto = ref<string | null>(null)

function confirmDeleteKosPhoto(foto: string) {
  askConfirm({
    title: 'Hapus foto kos?',
    message: 'Foto ini akan dihapus dari galeri kos terpilih.',
    confirmLabel: 'Hapus',
    severity: 'danger',
    run: () => deleteKosPhoto(foto),
  })
}

async function deleteKosPhoto(foto: string) {
  if (!selectedKos.value) return
  deletingPhoto.value = foto
  galleryError.value = null
  try {
    const res = await api<{ kos: Kos }>(`/kos/${selectedKos.value}/foto`, {
      method: 'DELETE',
      body: { foto },
    })
    syncKos(res.kos)
    applyKosSpec(res.kos)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Foto kos dihapus.', life: 3000 })
  } catch (e: any) {
    galleryError.value = e?.data?.message ?? 'Gagal menghapus foto kos.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: galleryError.value, life: 4000 })
  } finally {
    deletingPhoto.value = null
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

function confirmSaveOffice() {
  askConfirm({
    title: 'Simpan informasi kantor?',
    message: 'Informasi kontak, jam operasional, maps, dan sosial media kos terpilih akan diperbarui.',
    confirmLabel: 'Simpan',
    run: saveOffice,
  })
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
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Informasi kantor tersimpan.', life: 3000 })
  } catch (e: any) {
    officeError.value = e?.data?.message ?? 'Gagal menyimpan informasi kantor.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: officeError.value, life: 4000 })
  } finally {
    officeSaving.value = false
  }
}

/* ---------- Pengaturan sewa kos / konsultasi WhatsApp (per kos) ---------- */
const konsultasi = reactive({ nomor: '', template: '' })
const peraturan = reactive({ isi: '' })
const konsultasiSaving = ref(false)
const konsultasiSaved = ref(false)
const konsultasiError = ref<string | null>(null)
const peraturanSaving = ref(false)
const peraturanSaved = ref(false)
const peraturanError = ref<string | null>(null)

function applyKonsultasi(settings: Setting[]) {
  konsultasi.nomor = settings.find((s) => s.kunci === 'konsultasi_wa_nomor')?.nilai ?? ''
  konsultasi.template = settings.find((s) => s.kunci === 'konsultasi_wa_template')?.nilai ?? ''
  peraturan.isi = settings.find((s) => s.kunci === 'peraturan_kos')?.nilai ?? ''
}

function confirmSavePeraturan() {
  askConfirm({
    title: 'Simpan peraturan kos?',
    message: 'Peraturan kos terpilih akan diperbarui dan tampil di halaman detail kos.',
    confirmLabel: 'Simpan',
    run: savePeraturan,
  })
}

async function savePeraturan() {
  if (!selectedKos.value) {
    peraturanError.value = 'Pilih kos dulu.'
    return
  }
  peraturanSaving.value = true
  peraturanError.value = null
  peraturanSaved.value = false
  try {
    await api('/settings', { method: 'POST', body: { kos_id: selectedKos.value, kunci: 'peraturan_kos', nilai: peraturan.isi } })
    peraturanSaved.value = true
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Peraturan kos tersimpan.', life: 3000 })
  } catch (e: any) {
    peraturanError.value = e?.data?.message ?? 'Gagal menyimpan peraturan kos.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: peraturanError.value, life: 4000 })
  } finally {
    peraturanSaving.value = false
  }
}

function confirmSaveKonsultasi() {
  askConfirm({
    title: 'Simpan pengaturan sewa?',
    message: 'Nomor WhatsApp dan teks konsultasi kos terpilih akan diperbarui.',
    confirmLabel: 'Simpan',
    run: saveKonsultasi,
  })
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
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengaturan sewa tersimpan.', life: 3000 })
  } catch (e: any) {
    konsultasiError.value = e?.data?.message ?? 'Gagal menyimpan pengaturan sewa.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: konsultasiError.value, life: 4000 })
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
      <nav class="tabs" aria-label="Kategori pengaturan">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="tabs__btn"
          :class="{ 'tabs__btn--active': activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <i :class="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- ============ GLOBAL (seluruh situs) ============ -->
      <section v-show="activeTab === 'global'" class="logo-card nk-rise">
        <div class="logo-card__info">
          <h2 class="nk-sect" style="margin-top: 0">Logo situs (global)</h2>
          <p class="logo-card__hint">
            Logo utama NgekosKuy — dipakai di sidebar admin, header halaman depan, halaman login, dan invoice.
            Berlaku untuk seluruh situs. Format gambar, maks 2 MB.
          </p>
          <Message v-if="siteLogoError" severity="error" class="logo-card__msg">{{ siteLogoError }}</Message>
          <span v-if="siteLogoUploading" class="logo-card__status"><i class="pi pi-spin pi-spinner" /> Mengunggah…</span>
        </div>
        <ImagePicker :model-value="siteLogo" label="Logo situs" @select="(file) => confirmUploadSiteLogo(file)" />
      </section>

      <!-- ============ PER KOS ============ -->
      <section v-show="activeTab !== 'global'" class="group nk-rise">
        <h2 class="nk-sect" style="margin-top: 0">Pengaturan per kos</h2>
        <p class="logo-card__hint">
          Pilih kos, lalu atur logo, favicon, info kantor, peraturan kos, konsultasi WhatsApp, jatuh tempo, cicilan, dan denda
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

      <form v-show="activeTab === 'profil'" class="settings nk-rise" @submit.prevent="confirmSaveKosSpec">
        <section class="group">
          <h2 class="nk-sect" style="margin-top: 0">Spesifikasi kos</h2>
          <p class="logo-card__hint">
            Data ini tampil di halaman publik/detail kos. Foto galeri bisa diunggah dari sini; foto baru akan ditambahkan ke galeri yang sudah ada.
          </p>
          <div class="grid grid-2" style="margin-top: 14px">
            <div class="nk-field">
              <label class="nk-label">Nama kos</label>
              <InputText v-model="spec.nama" class="w-full" placeholder="Kos Alisha" required />
            </div>
            <div class="nk-field">
              <label class="nk-label">Alamat</label>
              <InputText v-model="spec.alamat" class="w-full" placeholder="Alamat singkat kos" />
            </div>
            <div class="nk-field nk-field--full">
              <label class="nk-label">Deskripsi</label>
              <Textarea v-model="spec.deskripsi" class="w-full" rows="4" auto-resize placeholder="Ceritakan suasana, lokasi, dan keunggulan kos." />
            </div>
            <div class="nk-field nk-field--full">
              <div class="field-head">
                <label class="nk-label">Fasilitas</label>
                <Button type="button" label="Kelola opsi" icon="pi pi-sliders-h" size="small" text @click="openAddFacility" />
              </div>
              <MultiSelect
                v-model="spec.fasilitas"
                :options="fasilitasOptions"
                option-label="label"
                option-value="value"
                display="chip"
                class="w-full"
                placeholder="Pilih fasilitas"
              />
            </div>
          </div>
          <div class="gallery">
            <div class="gallery__head">
              <div>
                <strong>Foto kos</strong>
                <p class="logo-card__hint">Unggah beberapa foto sekaligus. Format gambar, maks 5 MB per foto.</p>
              </div>
              <Button
                type="button"
                label="Upload foto"
                icon="pi pi-images"
                outlined
                :loading="galleryUploading"
                @click="galleryInput?.click()"
              />
              <input ref="galleryInput" type="file" accept="image/*" multiple hidden @change="onGalleryChange" />
            </div>
            <div v-if="currentPhotos.length" class="gallery__grid">
              <figure v-for="foto in currentPhotos" :key="foto" class="gallery__item">
                <img :src="foto" :alt="spec.nama" />
                <button
                  type="button"
                  class="gallery__delete"
                  :disabled="deletingPhoto === foto"
                  aria-label="Hapus foto kos"
                  @click="confirmDeleteKosPhoto(foto)"
                >
                  <i :class="deletingPhoto === foto ? 'pi pi-spin pi-spinner' : 'pi pi-trash'" />
                </button>
              </figure>
            </div>
            <p v-else class="nk-muted">Belum ada foto galeri.</p>
          </div>
          <Message v-if="specError" severity="error" size="small" class="logo-card__msg">{{ specError }}</Message>
          <Message v-if="galleryError" severity="error" size="small" class="logo-card__msg">{{ galleryError }}</Message>
          <Message v-if="specSaved" severity="success" size="small" class="logo-card__msg">Spesifikasi kos tersimpan.</Message>
          <div style="margin-top: 12px">
            <Button type="submit" label="Simpan spesifikasi kos" icon="pi pi-save" :loading="specSaving" />
          </div>
        </section>
      </form>

      <section v-show="activeTab === 'aset'" class="logo-card nk-rise">
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
          @select="(file) => confirmUploadLogo(file)"
        />
      </section>

      <section v-show="activeTab === 'aset'" class="logo-card nk-rise">
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
          @select="(file) => confirmUploadAset('favicon', 'favicon', file)"
        />
      </section>

      <section v-show="activeTab === 'aset'" class="logo-card nk-rise">
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
          @select="(file) => confirmUploadAset('og_image', 'og-image', file)"
        />
      </section>

      <form v-show="activeTab === 'info'" class="settings nk-rise" @submit.prevent="confirmSaveOffice">
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

      <form v-show="activeTab === 'info'" class="settings nk-rise" @submit.prevent="confirmSavePeraturan">
        <section class="group">
          <h2 class="nk-sect" style="margin-top: 0">Peraturan kos</h2>
          <p class="logo-card__hint">
            Isi aturan tinggal untuk kos terpilih. Peraturan ini akan tampil di halaman detail kos.
          </p>
          <div class="nk-field" style="margin-top: 14px">
            <label class="nk-label">Isi peraturan</label>
            <Textarea
              v-model="peraturan.isi"
              class="w-full"
              rows="7"
              auto-resize
              :placeholder="`Contoh:
- Tamu wajib lapor pengelola.
- Jam tenang pukul 22.00-05.00.
- Dilarang membawa hewan peliharaan.`"
            />
          </div>
          <Message v-if="peraturanError" severity="error" size="small" class="logo-card__msg">{{ peraturanError }}</Message>
          <Message v-if="peraturanSaved" severity="success" size="small" class="logo-card__msg">Peraturan kos tersimpan.</Message>
          <div style="margin-top: 12px">
            <Button type="submit" label="Simpan peraturan kos" icon="pi pi-save" :loading="peraturanSaving" />
          </div>
        </section>
      </form>

      <form v-show="activeTab === 'info'" class="settings nk-rise" @submit.prevent="confirmSaveKonsultasi">
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

      <form v-show="activeTab === 'tagihan'" class="settings nk-rise" @submit.prevent="confirmSave">
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

      <Dialog
        v-model:visible="facilityDialog"
        modal
        :header="facilityForm.index === null ? 'Tambah opsi fasilitas' : 'Rename opsi fasilitas'"
        :style="{ width: '92vw', maxWidth: '520px' }"
      >
        <div class="facility-manager">
          <div class="nk-field">
            <label class="nk-label">Nama fasilitas</label>
            <InputText v-model="facilityForm.label" class="w-full" placeholder="Contoh: CCTV" autofocus />
          </div>
          <Message v-if="facilityError" severity="error" size="small">{{ facilityError }}</Message>

          <div class="facility-list">
            <div v-for="(item, index) in fasilitasOptions" :key="item.value" class="facility-row">
              <span>{{ item.label }}</span>
              <div class="facility-row__actions">
                <Button icon="pi pi-pencil" aria-label="Rename fasilitas" size="small" text @click="openRenameFacility(index)" />
                <Button icon="pi pi-trash" aria-label="Hapus fasilitas" size="small" severity="danger" text :disabled="facilitySaving" @click="confirmDeleteFacilityOption(index)" />
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Tutup" text :disabled="facilitySaving" @click="facilityDialog = false" />
          <Button :label="facilityForm.index === null ? 'Tambah opsi' : 'Simpan rename'" icon="pi pi-save" :loading="facilitySaving" @click="confirmSaveFacilityOption" />
        </template>
      </Dialog>

      <Dialog
        v-model:visible="confirmDialog"
        modal
        :header="confirmAction?.title ?? 'Konfirmasi aksi'"
        :style="{ width: '92vw', maxWidth: '460px' }"
      >
        <p class="confirm-text">{{ confirmAction?.message }}</p>
        <template #footer>
          <Button label="Batal" text :disabled="confirming" @click="cancelConfirmedAction" />
          <Button
            :label="confirmAction?.confirmLabel ?? 'Lanjutkan'"
            :severity="confirmAction?.severity"
            :loading="confirming"
            @click="runConfirmedAction"
          />
        </template>
      </Dialog>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px 8px;
}
.tabs__btn {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink-soft);
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.tabs__btn--active {
  border-color: var(--brand);
  background: var(--sand-soft);
  color: var(--brand);
}
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
.gallery { margin-top: 16px; display: grid; gap: 12px; }
.gallery__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.gallery__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 10px; }
.gallery__item { position: relative; margin: 0; }
.gallery__item img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; border: 1px solid var(--line); background: var(--surface-2); display: block; }
.gallery__delete { position: absolute; top: 6px; right: 6px; width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.65); border-radius: 8px; background: rgba(120, 32, 32, .88); color: #fff; cursor: pointer; }
.gallery__delete:disabled { opacity: .7; cursor: wait; }
@media (max-width: 520px) {
  .logo-card { flex-direction: column-reverse; align-items: flex-start; }
  .gallery__head { flex-direction: column; }
}
.field-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.facility-manager { display: grid; gap: 14px; }
.facility-list { display: grid; gap: 8px; max-height: 260px; overflow: auto; }
.facility-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; }
.facility-row__actions { display: flex; align-items: center; gap: 2px; }
.confirm-text { margin: 0; color: var(--ink); line-height: 1.55; }
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
