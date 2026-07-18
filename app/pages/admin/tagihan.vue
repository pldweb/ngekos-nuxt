<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type ConfirmAction = {
  title: string
  message: string
  confirmLabel?: string
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'
  run: () => Promise<void> | void
}

type Invoice = {
  id: number
  periode: string
  status: 'belum_bayar' | 'menunggu_verifikasi' | 'dibayar_sebagian' | 'lunas' | 'terlambat'
  total: number
  sisa: number
  due_date: string | null
}

const api = useApi()
const toast = useToast()

const invoices = ref<Invoice[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const dialog = ref(false)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitMessage = ref<string | null>(null)
const actionMessage = ref<string | null>(null)
const actionError = ref<string | null>(null)
const printingId = ref<number | null>(null)
const remindingId = ref<number | null>(null)
const selectedInvoice = ref<Invoice | null>(null)
const confirmDialog = ref(false)
const confirming = ref(false)
const confirmAction = ref<ConfirmAction | null>(null)
const installmentForm = reactive({
  jumlah_termin: 2,
  tanggal_mulai: new Date().toISOString().slice(0, 10),
  catatan_kesepakatan: '',
})

const statusMeta: Record<Invoice['status'], { label: string; severity: string }> = {
  belum_bayar: { label: 'Belum dibayar', severity: 'danger' },
  menunggu_verifikasi: { label: 'Menunggu verifikasi', severity: 'warn' },
  dibayar_sebagian: { label: 'Dibayar sebagian', severity: 'info' },
  lunas: { label: 'Lunas', severity: 'success' },
  terlambat: { label: 'Terlambat', severity: 'danger' },
}

const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')
const periodeLabel = (p: string) => {
  const [y, m] = p.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

const outstanding = computed(() =>
  invoices.value
    .filter((i) => i.status !== 'lunas')
    .reduce((sum, i) => sum + (i.sisa ?? i.total), 0),
)
const canRequestInstallment = (invoice: Invoice) =>
  invoice.status !== 'lunas' && invoice.status !== 'menunggu_verifikasi' && (invoice.sisa ?? invoice.total) > 0

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

function openInstallment(invoice: Invoice) {
  selectedInvoice.value = invoice
  installmentForm.jumlah_termin = 2
  installmentForm.tanggal_mulai = new Date().toISOString().slice(0, 10)
  installmentForm.catatan_kesepakatan = ''
  submitError.value = null
  submitMessage.value = null
  dialog.value = true
}

function buildTerms(invoice: Invoice) {
  const sisa = Math.round(invoice.sisa ?? invoice.total)
  const jumlah = installmentForm.jumlah_termin
  const base = Math.floor(sisa / jumlah)
  const mulai = new Date(installmentForm.tanggal_mulai)

  return Array.from({ length: jumlah }, (_, index) => {
    const due = new Date(mulai)
    due.setDate(mulai.getDate() + index * 7)
    const nominal = index === jumlah - 1 ? sisa - base * (jumlah - 1) : base
    return {
      urutan: index + 1,
      nominal_rencana: nominal,
      tanggal_jatuh_tempo: due.toISOString().slice(0, 10),
    }
  })
}

function confirmPrintInvoice(invoice: Invoice) {
  askConfirm({
    title: 'Cetak invoice?',
    message: `Invoice periode ${periodeLabel(invoice.periode)} akan diunduh sebagai PDF.`,
    confirmLabel: 'Cetak',
    run: () => printInvoice(invoice),
  })
}

async function printInvoice(invoice: Invoice) {
  printingId.value = invoice.id
  actionMessage.value = null
  actionError.value = null
  try {
    const blob = await api<Blob>(`/invoices/${invoice.id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tagihan-${invoice.periode}-${invoice.id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    actionMessage.value = 'PDF tagihan berhasil diunduh.'
    toast.add({ severity: 'success', summary: 'Berhasil', detail: actionMessage.value, life: 3000 })
  } catch (e: any) {
    actionError.value = e?.data?.message ?? 'Gagal mencetak invoice.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: actionError.value, life: 4000 })
  } finally {
    printingId.value = null
  }
}

function confirmSendReminder(invoice: Invoice) {
  askConfirm({
    title: 'Kirim reminder tagihan?',
    message: `Reminder pembayaran invoice periode ${periodeLabel(invoice.periode)} akan dikirim ke penghuni.`,
    confirmLabel: 'Kirim',
    severity: 'warn',
    run: () => sendReminder(invoice),
  })
}

async function sendReminder(invoice: Invoice) {
  remindingId.value = invoice.id
  actionMessage.value = null
  actionError.value = null
  try {
    const res = await api<{ message: string }>(`/invoices/${invoice.id}/remind`, { method: 'POST' })
    actionMessage.value = res.message
    toast.add({ severity: 'success', summary: 'Berhasil', detail: res.message, life: 3000 })
  } catch (e: any) {
    actionError.value = e?.data?.message ?? 'Gagal mengirim reminder.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: actionError.value, life: 4000 })
  } finally {
    remindingId.value = null
  }
}

function confirmSubmitInstallment() {
  if (!selectedInvoice.value) return
  askConfirm({
    title: 'Ajukan cicilan?',
    message: `Rencana cicilan ${installmentForm.jumlah_termin} termin untuk invoice ${periodeLabel(selectedInvoice.value.periode)} akan dibuat.`,
    confirmLabel: 'Ajukan',
    run: submitInstallment,
  })
}

async function submitInstallment() {
  if (!selectedInvoice.value) return
  submitting.value = true
  submitError.value = null
  submitMessage.value = null
  try {
    await api(`/invoices/${selectedInvoice.value.id}/installment-plans`, {
      method: 'POST',
      body: {
        jumlah_termin: installmentForm.jumlah_termin,
        catatan_kesepakatan: installmentForm.catatan_kesepakatan,
        termin: buildTerms(selectedInvoice.value),
      },
    })
    submitMessage.value = 'Pengajuan cicilan dikirim.'
    toast.add({ severity: 'success', summary: 'Berhasil', detail: submitMessage.value, life: 3000 })
    await load()
  } catch (e: any) {
    submitError.value = e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal mengajukan cicilan.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: submitError.value, life: 4000 })
  } finally {
    submitting.value = false
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: Invoice[] }>('/invoices')
    invoices.value = res.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat tagihan.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Tagihan</h1>
      <p class="nk-pagehead__sub">Status dan riwayat tagihan sewa kosmu.</p>
    </header>

    <section class="summary nk-rise">
      <div class="summary__top">
        <span class="summary__label">Total belum dibayar</span>
      </div>
      <p class="summary__amount">{{ rupiah(outstanding) }}</p>
      <p v-if="outstanding === 0" class="summary__note">
        <i class="pi pi-check-circle" /> Tidak ada tunggakan
      </p>
    </section>

    <p v-if="loading" class="nk-muted">Memuat tagihan…</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <section v-else class="nk-stack" style="gap: 10px">
      <div class="section-head">
        <h2 class="nk-sect">Daftar tagihan</h2>
        <p class="section-head__hint">Cetak invoice PDF atau kirim reminder email ke penghuni dari tiap tagihan.</p>
      </div>
      <Message v-if="actionMessage" severity="success" size="small">{{ actionMessage }}</Message>
      <Message v-if="actionError" severity="error" size="small">{{ actionError }}</Message>

      <EmptyState
        v-if="invoices.length === 0"
        icon="pi pi-file"
        title="Belum ada tagihan"
        description="Tagihan sewa akan muncul otomatis di sini setiap awal bulan."
      />

      <div v-else class="invs">
        <article v-for="inv in invoices" :key="inv.id" class="inv nk-rise">
          <div class="inv__body">
            <p class="inv__periode">{{ periodeLabel(inv.periode) }}</p>
            <p class="inv__amount">{{ rupiah(inv.sisa ?? inv.total) }}</p>
          </div>
          <div class="inv__side">
            <Tag :value="statusMeta[inv.status].label" :severity="statusMeta[inv.status].severity" />
            <div class="inv__actions">
              <Button
                icon="pi pi-file-pdf"
                label="Cetak"
                size="small"
                outlined
                :loading="printingId === inv.id"
                @click="confirmPrintInvoice(inv)"
              />
              <Button
                v-if="inv.status !== 'lunas'"
                icon="pi pi-send"
                label="Reminder"
                size="small"
                severity="secondary"
                outlined
                :loading="remindingId === inv.id"
                @click="confirmSendReminder(inv)"
              />
              <Button
                v-if="canRequestInstallment(inv)"
                icon="pi pi-list-check"
                label="Cicilan"
                size="small"
                outlined
                @click="openInstallment(inv)"
              />
            </div>
          </div>
        </article>
      </div>
    </section>

    <Dialog v-model:visible="dialog" modal header="Ajukan cicilan" :style="{ width: '92vw', maxWidth: '420px' }">
      <div v-if="selectedInvoice" class="nk-form">
        <div class="installment-summary">
          <span>{{ periodeLabel(selectedInvoice.periode) }}</span>
          <strong>{{ rupiah(selectedInvoice.sisa ?? selectedInvoice.total) }}</strong>
        </div>
        <div>
          <label class="nk-label">Jumlah termin</label>
          <InputNumber v-model="installmentForm.jumlah_termin" :min="1" :max="12" class="w-full" />
        </div>
        <div>
          <label class="nk-label">Tanggal termin pertama</label>
          <DateField v-model="installmentForm.tanggal_mulai" />
        </div>
        <div>
          <label class="nk-label">Catatan</label>
          <Textarea v-model="installmentForm.catatan_kesepakatan" rows="3" auto-resize class="w-full" />
        </div>
        <div class="terms">
          <div v-for="term in buildTerms(selectedInvoice)" :key="term.urutan" class="terms__row">
            <span>Termin {{ term.urutan }} · {{ term.tanggal_jatuh_tempo }}</span>
            <strong>{{ rupiah(term.nominal_rencana) }}</strong>
          </div>
        </div>
        <Message v-if="submitMessage" severity="success">{{ submitMessage }}</Message>
        <Message v-if="submitError" severity="error">{{ submitError }}</Message>
      </div>
      <template #footer>
        <Button label="Tutup" text @click="dialog = false" />
        <Button label="Ajukan" icon="pi pi-send" :loading="submitting" @click="confirmSubmitInstallment" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="confirmDialog"
      modal
      :header="confirmAction?.title ?? 'Konfirmasi aksi'"
      :style="{ width: '92vw', maxWidth: '440px' }"
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
.summary {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px 22px;
}
.summary__top { display: flex; align-items: center; justify-content: space-between; }
.summary__label { font-size: 13px; color: var(--ink-soft); font-weight: 500; }
.summary__amount {
  margin: 12px 0 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.summary__note {
  margin: 8px 0 0;
  font-size: 13px;
  color: #2f9e6a;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.section-head__hint { margin: 0; color: var(--ink-soft); font-size: 12px; }
.invs { display: grid; gap: 10px; }
@container appview (min-width: 680px) {
  .invs { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
}
.inv {
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
.inv__periode { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.inv__amount { margin: 3px 0 0; font-size: 13px; color: var(--ink-soft); }
.inv__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.inv__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.installment-summary,
.terms__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.installment-summary {
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px;
  color: var(--ink-soft);
  font-size: 13px;
}
.installment-summary strong { color: var(--ink); }
.terms {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.terms__row {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--ink-soft);
}
.terms__row + .terms__row { border-top: 1px solid var(--line); }
.terms__row strong { color: var(--ink); white-space: nowrap; }
.confirm-text { margin: 0; color: var(--ink); line-height: 1.55; }
.w-full { width: 100%; }
</style>
