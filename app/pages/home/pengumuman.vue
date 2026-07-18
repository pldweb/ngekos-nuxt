<script setup lang="ts">
definePageMeta({ layout: 'penghuni', middleware: 'auth' })

type Announcement = {
  id: number
  kos_id: number | null
  tipe: 'umum' | 'maintenance' | 'pembayaran' | 'fasilitas'
  judul: string
  isi: string
  published_at: string | null
}

const api = useApi()

const announcements = ref<Announcement[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const tipeMeta: Record<Announcement['tipe'], { label: string; severity: string; icon: string }> = {
  umum: { label: 'Umum', severity: 'info', icon: 'pi pi-megaphone' },
  maintenance: { label: 'Maintenance', severity: 'warn', icon: 'pi pi-wrench' },
  pembayaran: { label: 'Pembayaran', severity: 'success', icon: 'pi pi-wallet' },
  fasilitas: { label: 'Fasilitas', severity: 'secondary', icon: 'pi pi-building' },
}

const tanggal = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: Announcement[] }>('/announcements')
    announcements.value = res.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat pengumuman.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Pengumuman</h1>
      <p class="nk-pagehead__sub">Informasi terbaru dari pengelola kos.</p>
    </header>

    <p v-if="loading" class="nk-muted">Memuat pengumuman...</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <EmptyState
      v-else-if="announcements.length === 0"
      icon="pi pi-megaphone"
      title="Belum ada pengumuman"
      description="Pengumuman dari pengelola akan tampil di sini."
    />

    <section v-else class="nk-stack" style="gap: 10px">
      <article v-for="item in announcements" :key="item.id" class="ann nk-rise">
        <div class="ann__icon">
          <i :class="tipeMeta[item.tipe]?.icon ?? 'pi pi-megaphone'" />
        </div>
        <div class="ann__body">
          <div class="ann__top">
            <Tag
              :value="tipeMeta[item.tipe]?.label ?? item.tipe"
              :severity="tipeMeta[item.tipe]?.severity ?? 'info'"
            />
            <span class="ann__date">{{ tanggal(item.published_at) }}</span>
          </div>
          <h2 class="ann__title">{{ item.judul }}</h2>
          <p class="ann__text">{{ item.isi }}</p>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.ann {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px;
}
.ann__icon {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--sand-soft);
  color: var(--brand);
}
.ann__body {
  min-width: 0;
  flex: 1;
}
.ann__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.ann__date {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--ink-soft);
}
.ann__title {
  margin: 8px 0 0;
  font-size: 15px;
  line-height: 1.35;
  color: var(--ink);
}
.ann__text {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-soft);
  white-space: pre-line;
}
</style>
