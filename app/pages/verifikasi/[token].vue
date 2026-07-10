<script setup lang="ts">
// Halaman publik: tujuan QR di kuitansi. Tanpa middleware auth.
const route = useRoute()
const api = useApi()

type Kuitansi = {
  nomor_kuitansi: string
  penghuni: string | null
  periode: string
  total: number
  status: string
  diterbitkan: string | null
}

const loading = ref(true)
const valid = ref(false)
const data = ref<Kuitansi | null>(null)

const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')

onMounted(async () => {
  try {
    const res = await api<{ valid: boolean; kuitansi: Kuitansi }>(
      `/receipts/verify/${route.params.token}`,
    )
    valid.value = res.valid
    data.value = res.kuitansi
  } catch {
    valid.value = false
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="nk-stack" style="padding-top: 24px">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Verifikasi Kuitansi</h1>
      <p class="nk-pagehead__sub">Keaslian kuitansi pembayaran NgekosKuy.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memeriksa…</p>

    <section v-else-if="valid && data" class="card nk-rise">
      <div class="badge badge--ok"><i class="pi pi-verified" /> Kuitansi Sah</div>
      <dl class="rows">
        <div class="row"><dt>Nomor</dt><dd>{{ data.nomor_kuitansi }}</dd></div>
        <div class="row"><dt>Penghuni</dt><dd>{{ data.penghuni ?? '—' }}</dd></div>
        <div class="row"><dt>Periode</dt><dd>{{ data.periode }}</dd></div>
        <div class="row"><dt>Total</dt><dd>{{ rupiah(data.total) }}</dd></div>
        <div class="row"><dt>Status</dt><dd class="cap">{{ data.status }}</dd></div>
      </dl>
    </section>

    <EmptyState
      v-else
      icon="pi pi-times-circle"
      title="Kuitansi tidak ditemukan"
      description="Token verifikasi tidak valid atau kuitansi telah dihapus."
    />
  </div>
</template>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.badge--ok { background: #e5f6ee; color: #2f9e6a; }
.rows { margin: 0; }
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.row:last-child { border-bottom: none; }
.row dt { color: var(--ink-soft); font-size: 13px; }
.row dd { margin: 0; font-weight: 600; color: var(--ink); font-size: 13.5px; text-align: right; }
.cap { text-transform: capitalize; }
</style>
