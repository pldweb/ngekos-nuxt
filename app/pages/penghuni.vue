<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Tenant = {
  id: number
  nama: string
  no_hp: string
  email: string | null
  status: 'pending' | 'aktif' | 'nonaktif'
}

const api = useApi()

const tenants = ref<Tenant[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const statusSeverity: Record<Tenant['status'], string> = {
  pending: 'warn',
  aktif: 'success',
  nonaktif: 'secondary',
}

const initials = (nama: string) =>
  nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: Tenant[] }>('/tenants')
    tenants.value = res.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat data penghuni.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Penghuni</h1>
      <p class="nk-pagehead__sub">Daftar penghuni dan status verifikasinya.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memuat penghuni…</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <EmptyState
      v-else-if="tenants.length === 0"
      icon="pi pi-users"
      title="Belum ada penghuni"
      description="Penghuni yang terdaftar akan tampil di sini."
    />

    <section v-else class="nk-stack" style="gap: 10px">
      <article v-for="t in tenants" :key="t.id" class="tenant nk-rise">
        <span class="tenant__avatar">{{ initials(t.nama) }}</span>
        <div class="tenant__body">
          <p class="tenant__name">{{ t.nama }}</p>
          <p class="tenant__contact">{{ t.no_hp }}</p>
        </div>
        <Tag :value="t.status" :severity="statusSeverity[t.status]" />
      </article>
    </section>
  </div>
</template>

<style scoped>
.tenant {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
}
.tenant__avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--sand-soft);
  color: var(--brand);
  font-weight: 700;
  font-size: 14px;
}
.tenant__body { flex: 1; min-width: 0; }
.tenant__name { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.tenant__contact { margin: 3px 0 0; font-size: 12.5px; color: var(--ink-soft); }
</style>
