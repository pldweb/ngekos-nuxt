<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Payment = {
  id: number
  nama: string | null
  nomor_kamar: string | null
  kos_nama: string | null
  nominal: number
  untuk_pembayaran: string | null
  bulan_ke: number | null
  tahun: number | null
  asal_bank: string | null
  tanggal_transfer: string | null
  bukti_file_url: string | null
  email_penyetor: string | null
  rekening_pengirim: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string | null
}

const api = useApi()
const toast = useToast()
const { confirmDialog, confirming, confirmAction, askConfirm, runConfirmedAction, cancelConfirmedAction } = useActionConfirm()
const payments = ref<Payment[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const actingId = ref<number | null>(null)
const showAll = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: Payment[] }>('/payments', {
      query: showAll.value ? {} : { status: 'pending' },
    })
    payments.value = res.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat pembayaran.'
  } finally {
    loading.value = false
  }
}

function confirmApprove(payment: Payment) {
  askConfirm({
    title: 'Setujui pembayaran?',
    message: `Pembayaran ${payment.nama ?? 'penghuni'} sebesar ${rupiah(payment.nominal)} akan disetujui.`,
    confirmLabel: 'Setujui',
    severity: 'success',
    run: () => approve(payment),
  })
}

async function approve(payment: Payment) {
  actingId.value = payment.id
  error.value = null
  try {
    await api(`/payments/${payment.id}/approve`, { method: 'POST' })
    await load()
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pembayaran disetujui.', life: 3000 })
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal menyetujui pembayaran.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: error.value, life: 4000 })
  } finally {
    actingId.value = null
  }
}

function confirmReject(payment: Payment) {
  askConfirm({
    title: 'Tolak pembayaran?',
    message: `Pembayaran ${payment.nama ?? 'penghuni'} sebesar ${rupiah(payment.nominal)} akan ditolak.`,
    confirmLabel: 'Tolak',
    severity: 'danger',
    run: () => reject(payment),
  })
}

async function reject(payment: Payment) {
  actingId.value = payment.id
  error.value = null
  try {
    await api(`/payments/${payment.id}/reject`, { method: 'POST' })
    await load()
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pembayaran ditolak.', life: 3000 })
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal menolak pembayaran.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: error.value, life: 4000 })
  } finally {
    actingId.value = null
  }
}

const rupiah = (n: number | null) => (n == null ? '-' : 'Rp' + Number(n).toLocaleString('id-ID'))
const tanggal = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')
const waktu = (iso: string | null) => (iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')

watch(showAll, load)
onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Verifikasi Pembayaran</h1>
      <p class="nk-pagehead__sub">Cocokkan mutasi bank dan setujui atau tolak pembayaran penghuni.</p>
    </header>

    <section class="vp-filter nk-rise">
      <label class="vp-toggle">
        <Checkbox v-model="showAll" binary />
        <span>Tampilkan semua status (bukan hanya menunggu)</span>
      </label>
      <Button icon="pi pi-refresh" label="Muat ulang" outlined size="small" @click="load" />
    </section>

    <Message v-if="error" severity="error" size="small">{{ error }}</Message>

    <p v-if="loading" class="nk-muted">Memuat pembayaran…</p>

    <EmptyState
      v-else-if="!payments.length"
      icon="pi pi-wallet"
      title="Tidak ada pembayaran"
      description="Belum ada pembayaran yang menunggu verifikasi."
    />

    <div v-else class="vp-tablewrap nk-rise">
      <DataTable :value="payments" scrollable scroll-height="70vh" class="vp-table">
        <Column field="created_at" header="Timestamp">
          <template #body="{ data }">{{ waktu(data.created_at) }}</template>
        </Column>
        <Column field="nama" header="Nama">
          <template #body="{ data }">{{ data.nama ?? '-' }}</template>
        </Column>
        <Column field="nomor_kamar" header="Nomor Kamar">
          <template #body="{ data }">{{ data.nomor_kamar ?? '-' }}</template>
        </Column>
        <Column field="nominal" header="Uang Sebesar">
          <template #body="{ data }">{{ rupiah(data.nominal) }}</template>
        </Column>
        <Column field="untuk_pembayaran" header="Untuk Pembayaran">
          <template #body="{ data }">{{ data.untuk_pembayaran ?? '-' }}</template>
        </Column>
        <Column field="bulan_ke" header="Bulan Ke">
          <template #body="{ data }">{{ data.bulan_ke ?? '-' }}</template>
        </Column>
        <Column field="tahun" header="Tahun">
          <template #body="{ data }">{{ data.tahun ?? '-' }}</template>
        </Column>
        <Column field="asal_bank" header="Asal Bank Transfer">
          <template #body="{ data }">{{ data.asal_bank ?? '-' }}</template>
        </Column>
        <Column field="tanggal_transfer" header="Tanggal Pembayaran">
          <template #body="{ data }">{{ tanggal(data.tanggal_transfer) }}</template>
        </Column>
        <Column header="Bukti Pembayaran">
          <template #body="{ data }">
            <a v-if="data.bukti_file_url" :href="data.bukti_file_url" target="_blank" rel="noopener noreferrer">Lihat</a>
            <span v-else>-</span>
          </template>
        </Column>
        <Column field="email_penyetor" header="Email aktif">
          <template #body="{ data }">{{ data.email_penyetor ?? '-' }}</template>
        </Column>
        <Column field="rekening_pengirim" header="Nomor Rekening">
          <template #body="{ data }">{{ data.rekening_pengirim ?? '-' }}</template>
        </Column>
        <Column header="Check">
          <template #body="{ data }">
            <div v-if="data.status === 'pending'" class="vp-actions">
              <Button
                icon="pi pi-check"
                severity="success"
                size="small"
                rounded
                :loading="actingId === data.id"
                aria-label="Setujui"
                @click="confirmApprove(data)"
              />
              <Button
                icon="pi pi-times"
                severity="danger"
                size="small"
                rounded
                outlined
                :loading="actingId === data.id"
                aria-label="Tolak"
                @click="confirmReject(data)"
              />
            </div>
            <Tag
              v-else
              :value="data.status === 'approved' ? 'Disetujui' : 'Ditolak'"
              :severity="data.status === 'approved' ? 'success' : 'danger'"
            />
          </template>
        </Column>
      </DataTable>
    </div>
    <ActionConfirmDialog
      :visible="confirmDialog"
      :action="confirmAction"
      :loading="confirming"
      @cancel="cancelConfirmedAction"
      @confirm="runConfirmedAction"
    />
  </div>
</template>

<style scoped>
.vp-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 12px 14px;
}
.vp-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-soft);
}
.vp-tablewrap {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 8px;
  overflow-x: auto;
}
.vp-actions { display: flex; gap: 6px; }
</style>
