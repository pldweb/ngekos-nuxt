<script setup lang="ts">
definePageMeta({ layout: 'penghuni', middleware: 'auth' })

type Invoice = {
  id: number
  periode: string
  status: 'belum_bayar' | 'menunggu_verifikasi' | 'dibayar_sebagian' | 'lunas' | 'terlambat'
  total: number
  sisa: number
  due_date: string | null
  untuk_pembayaran: string | null
}
type Booking = {
  id: number
  room_id: number
  nama: string
  kontak: string
  durasi_sewa: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string | null
  room?: { nomor: string; kos?: { nama: string } | null }
}

const api = useApi()
const auth = useAuthStore()

const invoices = ref<Invoice[]>([])
const bookings = ref<Booking[]>([])
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)
const proofName = ref<string | null>(null)
const proofFile = ref<File | null>(null)

const form = reactive({
  invoice_id: null as number | null,
  metode_pembayaran: 'bca',
  nominal: 0,
  tanggal_transfer: new Date().toISOString().slice(0, 10),
  catatan: '',
  asal_bank: '',
  rekening_pengirim: '',
  email_penyetor: '',
})

type PaymentMethod = {
  kode: string
  nama: string
  nama_pemilik_rekening: string | null
  nomor_rekening: string | null
  aktif: boolean
}

const methods = ref<PaymentMethod[]>([
  { kode: 'tunai', nama: 'Tunai', nama_pemilik_rekening: null, nomor_rekening: null, aktif: true },
])
const methodOptions = computed(() => methods.value.map((m) => ({ label: m.nama, value: m.kode })))
const selectedMethod = computed(() => methods.value.find((m) => m.kode === form.metode_pembayaran) ?? null)
async function loadMethods() {
  try {
    const res = await api<{ data: PaymentMethod[] }>('/payment-methods')
    methods.value = res.data.length ? res.data : methods.value
    if (!methods.value.some((m) => m.kode === form.metode_pembayaran)) {
      form.metode_pembayaran = methods.value[0]?.kode ?? 'tunai'
    }
  } catch { /* fallback tunai */ }
}

const payableInvoices = computed(() =>
  invoices.value.filter((i) => i.status !== 'lunas' && i.status !== 'menunggu_verifikasi' && (i.sisa ?? i.total) > 0),
)
const selectedInvoice = computed(() => payableInvoices.value.find((i) => i.id === form.invoice_id) ?? null)
const needsProof = computed(() => form.metode_pembayaran !== 'tunai')
const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')
const bookingStatus: Record<Booking['status'], { label: string; severity: 'info' | 'success' | 'danger' }> = {
  pending: { label: 'Menunggu', severity: 'info' },
  approved: { label: 'Disetujui', severity: 'success' },
  rejected: { label: 'Ditolak', severity: 'danger' },
}
const tanggalSingkat = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  : '-'
const periodeLabel = (p: string) => {
  const [y, m] = p.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}
const invoiceOptions = computed(() => payableInvoices.value.map((inv) => ({
  label: `${periodeLabel(inv.periode)} · ${rupiah(inv.sisa ?? inv.total)}`,
  value: inv.id,
})))

watch(selectedInvoice, (inv) => {
  if (inv) form.nominal = inv.sisa ?? inv.total
})

function pilihBukti(event: any) {
  const file = event?.files?.[0] as File | undefined
  proofFile.value = file ?? null
  proofName.value = file?.name ?? null
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [invoiceRes, bookingRes] = await Promise.all([
      api<{ data: Invoice[] }>('/invoices'),
      api<{ data: Booking[] }>('/me/bookings'),
    ])
    invoices.value = invoiceRes.data
    bookings.value = bookingRes.data
    form.invoice_id ??= payableInvoices.value[0]?.id ?? null
    form.email_penyetor ||= auth.user?.email ?? ''
    if (selectedInvoice.value) form.nominal = selectedInvoice.value.sisa ?? selectedInvoice.value.total
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat tagihan.'
  } finally {
    loading.value = false
  }
}

async function submit() {
  message.value = null
  error.value = null
  if (!form.invoice_id) {
    error.value = 'Pilih tagihan terlebih dahulu.'
    return
  }
  if (needsProof.value && !proofFile.value) {
    error.value = 'Bukti pembayaran wajib diunggah.'
    return
  }
  if (needsProof.value && (!form.asal_bank.trim() || !form.rekening_pengirim.trim() || !form.email_penyetor.trim())) {
    error.value = 'Asal bank, nomor rekening, dan email wajib diisi untuk transfer.'
    return
  }

  const body = new FormData()
  body.append('metode_pembayaran', form.metode_pembayaran)
  body.append('metode', form.metode_pembayaran === 'tunai' ? 'tunai' : 'transfer')
  body.append('nominal', String(form.nominal))
  if (form.tanggal_transfer) body.append('tanggal_transfer', form.tanggal_transfer)
  if (form.catatan.trim()) body.append('catatan', form.catatan.trim())
  if (proofFile.value) body.append('bukti_file', proofFile.value)
  if (needsProof.value) {
    body.append('asal_bank', form.asal_bank)
    body.append('rekening_pengirim', form.rekening_pengirim)
    body.append('email_penyetor', form.email_penyetor)
  }

  submitting.value = true
  try {
    await api(`/invoices/${form.invoice_id}/pay`, { method: 'POST', body })
    message.value = 'Pembayaran dikirim dan menunggu verifikasi.'
    proofFile.value = null
    proofName.value = null
    form.catatan = ''
    await load()
  } catch (e: any) {
    error.value = e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal mengirim pembayaran.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => { await Promise.all([load(), loadMethods()]) })
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Bayar</h1>
      <p class="nk-pagehead__sub">Kirim pembayaran dan bukti transfer.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memuat tagihan…</p>

    <EmptyState
      v-else-if="error && payableInvoices.length === 0"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <template v-else>
      <section class="hist nk-rise">
        <div class="hist__head">
          <div>
            <h2 class="nk-sect">Riwayat pengajuan sewa</h2>
            <p class="hist__hint">Status pengajuan kos yang pernah kamu kirim.</p>
          </div>
        </div>
        <div v-if="bookings.length" class="hist__list">
          <div v-for="b in bookings" :key="b.id" class="hist__item">
            <span class="hist__ic"><i class="pi pi-home" /></span>
            <span class="hist__body">
              <strong>{{ b.room?.kos?.nama ?? 'Kos' }}</strong>
              <small>Kamar {{ b.room?.nomor ?? '-' }} · {{ b.durasi_sewa }} bulan · {{ tanggalSingkat(b.created_at) }}</small>
            </span>
            <Tag :value="bookingStatus[b.status].label" :severity="bookingStatus[b.status].severity" />
          </div>
        </div>
        <p v-else class="hist__empty">Belum ada pengajuan sewa.</p>
      </section>

      <EmptyState
        v-if="payableInvoices.length === 0"
        icon="pi pi-wallet"
        title="Semua lunas"
        description="Tidak ada tagihan yang menunggu pembayaran saat ini."
      />

      <form v-else class="pay nk-rise" @submit.prevent="submit">
      <div class="nk-field">
        <label class="nk-label">Tagihan</label>
        <Select
          v-model="form.invoice_id"
          :options="invoiceOptions"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>

      <div class="summary" v-if="selectedInvoice">
        <span>Sisa tagihan</span>
        <strong>{{ rupiah(selectedInvoice.sisa ?? selectedInvoice.total) }}</strong>
      </div>

      <div class="nk-field">
        <label class="nk-label">Metode</label>
        <Select
          v-model="form.metode_pembayaran"
          :options="methodOptions"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>


      <div v-if="needsProof && selectedMethod" class="rekening">
        <span>Tujuan transfer</span>
        <strong>{{ selectedMethod.nama }}</strong>
        <p>{{ selectedMethod.nama_pemilik_rekening ?? 'Nama pemilik rekening belum diisi' }}</p>
        <code>{{ selectedMethod.nomor_rekening ?? 'Nomor rekening belum diisi' }}</code>
      </div>

      <div v-if="selectedInvoice?.untuk_pembayaran" class="summary">
        <span>Bayar untuk</span>
        <strong>{{ selectedInvoice.untuk_pembayaran }}</strong>
      </div>

      <div class="grid">
        <div class="nk-field">
          <label class="nk-label">Nominal</label>
          <InputNumber v-model="form.nominal" :min="1" class="w-full" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Tanggal</label>
          <DateField v-model="form.tanggal_transfer" />
        </div>
      </div>

      <div v-if="needsProof" class="nk-field">
        <label class="nk-label">Bukti</label>
        <FileUpload
          mode="basic"
          name="bukti"
          accept="image/*,application/pdf"
          :max-file-size="5242880"
          custom-upload
          choose-label="Pilih bukti"
          class="w-full"
          @select="pilihBukti"
        />
        <p v-if="proofName" class="proof">{{ proofName }}</p>
      </div>

      <template v-if="needsProof">
        <div class="nk-field">
          <label class="nk-label">Asal bank</label>
          <InputText v-model="form.asal_bank" placeholder="mis. BCA" class="w-full" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Nomor rekening (pengirim)</label>
          <InputText v-model="form.rekening_pengirim" class="w-full" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Email aktif</label>
          <InputText v-model="form.email_penyetor" type="email" class="w-full" />
        </div>
      </template>

      <div class="nk-field">
        <label class="nk-label">Catatan</label>
        <Textarea v-model="form.catatan" rows="3" auto-resize class="w-full" />
      </div>

      <Message v-if="message" severity="success" size="small">{{ message }}</Message>
      <Message v-if="error" severity="error" size="small">{{ error }}</Message>
        <Button type="submit" label="Kirim pembayaran" icon="pi pi-send" :loading="submitting" />
      </form>
    </template>
  </div>
</template>

<style scoped>
.hist {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.hist__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.hist__hint { margin: 6px 0 0; font-size: 13px; color: var(--ink-soft); }
.hist__list { display: grid; gap: 10px; margin-top: 14px; }
.hist__item {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: #fff;
}
.hist__ic {
  width: 40px; height: 40px;
  display: grid; place-items: center;
  border-radius: 12px;
  background: var(--sand-soft);
  color: var(--brand);
}
.hist__body { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.hist__body strong { color: var(--ink); font-size: 14px; }
.hist__body small { color: var(--ink-soft); font-size: 12px; }
.hist__empty { margin: 14px 0 0; color: var(--ink-soft); font-size: 13px; }
.pay {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 13px;
  color: var(--ink-soft);
}
.summary strong { color: var(--ink); font-size: 15px; }
.rekening { display: grid; gap: 4px; background: #fff; border: 1px dashed var(--brand-soft); border-radius: var(--radius-sm); padding: 12px 14px; }
.rekening span { font-size: 12px; color: var(--ink-soft); }
.rekening strong { color: var(--ink); }
.rekening p { margin: 0; font-size: 13px; color: var(--ink); }
.rekening code { width: fit-content; background: var(--surface-2); border: 1px solid var(--line); border-radius: 8px; padding: 5px 8px; color: var(--brand); }
.grid { display: grid; gap: 12px; }
.proof { margin: 8px 0 0; font-size: 12px; color: var(--ink-soft); }
.w-full { width: 100%; }
@media (max-width: 640px) {
  .hist__item { grid-template-columns: 40px 1fr; }
  .hist__item :deep(.p-tag) { grid-column: 2; justify-self: start; }
}
</style>
