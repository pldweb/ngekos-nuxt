<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const period = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Tagihan</h1>
      <p class="nk-pagehead__sub">Status dan riwayat tagihan sewa kosmu.</p>
    </header>

    <section class="summary nk-rise">
      <div class="summary__top">
        <span class="summary__label">Belum dibayar</span>
        <span class="summary__period">{{ period }}</span>
      </div>
      <p class="summary__amount">Rp0</p>
      <p class="summary__note"><i class="pi pi-check-circle" /> Tidak ada tunggakan</p>
    </section>

    <section class="nk-stack" style="gap: 10px">
      <h2 class="nk-sect">Daftar tagihan</h2>
      <EmptyState
        icon="pi pi-file"
        title="Belum ada tagihan"
        description="Tagihan sewa akan muncul otomatis di sini setiap awal bulan."
      />
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
.summary__period {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  background: var(--sand-soft);
  padding: 4px 10px;
  border-radius: 999px;
}
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
</style>
