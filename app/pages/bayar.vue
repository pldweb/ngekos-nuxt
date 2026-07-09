<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const methods = [
  { icon: 'pi pi-building-columns', title: 'Transfer bank', desc: 'Bayar via transfer, lalu unggah bukti untuk diverifikasi.' },
  { icon: 'pi pi-money-bill', title: 'Tunai', desc: 'Bayar langsung ke pengelola, dicatat dan diverifikasi.' },
]
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Bayar</h1>
      <p class="nk-pagehead__sub">Bayar tagihan dan lihat metode yang tersedia.</p>
    </header>

    <section class="nk-stack" style="gap: 10px">
      <h2 class="nk-sect">Perlu dibayar</h2>
      <EmptyState
        icon="pi pi-wallet"
        title="Semua lunas"
        description="Tidak ada tagihan yang menunggu pembayaran saat ini."
      />
    </section>

    <section class="nk-stack" style="gap: 10px">
      <h2 class="nk-sect">Metode pembayaran</h2>
      <div class="methods">
        <div v-for="m in methods" :key="m.title" class="method">
          <span class="method__ic"><i :class="m.icon" /></span>
          <div class="method__body">
            <p class="method__title">{{ m.title }}</p>
            <p class="method__desc">{{ m.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.methods {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.method { display: flex; align-items: center; gap: 14px; padding: 16px 18px; }
.method + .method { border-top: 1px solid var(--line); }
.method__ic {
  width: 42px;
  height: 42px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 17px;
}
.method__title { margin: 0; font-size: 14px; font-weight: 600; }
.method__desc { margin: 3px 0 0; font-size: 12.5px; color: var(--ink-soft); line-height: 1.5; }
</style>
