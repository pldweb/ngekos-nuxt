<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Invoice = {
  id: number
  periode: string
  status: 'belum_bayar' | 'menunggu_verifikasi' | 'lunas'
  total: number
  due_date: string | null
}

const api = useApi()

const invoices = ref<Invoice[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const statusMeta: Record<Invoice['status'], { label: string; severity: string }> = {
  belum_bayar: { label: 'Belum dibayar', severity: 'danger' },
  menunggu_verifikasi: { label: 'Menunggu verifikasi', severity: 'warn' },
  lunas: { label: 'Lunas', severity: 'success' },
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
    .reduce((sum, i) => sum + i.total, 0),
)

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
      <h2 class="nk-sect">Daftar tagihan</h2>

      <EmptyState
        v-if="invoices.length === 0"
        icon="pi pi-file"
        title="Belum ada tagihan"
        description="Tagihan sewa akan muncul otomatis di sini setiap awal bulan."
      />

      <article v-for="inv in invoices" :key="inv.id" class="inv nk-rise">
        <div class="inv__body">
          <p class="inv__periode">{{ periodeLabel(inv.periode) }}</p>
          <p class="inv__amount">{{ rupiah(inv.total) }}</p>
        </div>
        <Tag :value="statusMeta[inv.status].label" :severity="statusMeta[inv.status].severity" />
      </article>
    </section>
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
</style>
