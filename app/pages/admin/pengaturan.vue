<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Kos = { id: number; nama: string; logo_url?: string | null }
type Setting = { id: number; kos_id: number | null; kunci: string; nilai: any }

const api = useApi()

const kosList = ref<Kos[]>([])
const selectedKos = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const saved = ref(false)

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
    }
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat pengaturan.'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!selectedKos.value) return
  saving.value = true
  error.value = null
  saved.value = false
  try {
    await Promise.all(Object.entries(form).map(([kunci, nilai]) =>
      api('/settings', {
        method: 'POST',
        body: { kos_id: selectedKos.value, kunci, nilai },
      }),
    ))
    saved.value = true
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal menyimpan pengaturan.'
  } finally {
    saving.value = false
  }
}

/* ---------- Logo kos (dipakai sebagai favicon) ---------- */
const brand = useBrandStore()
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
    // segarkan favicon & logo sidebar
    await brand.load(true)
  } catch (e: any) {
    logoError.value = e?.data?.message ?? 'Gagal mengunggah logo.'
  } finally {
    logoUploading.value = false
  }
}

watch(selectedKos, async () => {
  if (!loading.value) await load()
})

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Pengaturan</h1>
      <p class="nk-pagehead__sub">Kebijakan operasional per kos.</p>
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
      <section class="logo-card nk-rise">
        <div class="logo-card__info">
          <h2 class="nk-sect" style="margin-top: 0">Logo kos</h2>
          <p class="logo-card__hint">
            Logo tampil di sidebar dan otomatis jadi favicon (ikon tab browser). Format gambar, maks 2 MB.
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

      <form class="settings nk-rise" @submit.prevent="save">
        <div class="nk-field">
          <label class="nk-label">Kos</label>
          <Select
            v-model="selectedKos"
            :options="kosOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>

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
