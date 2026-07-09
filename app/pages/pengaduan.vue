<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const notice = ref(false)
</script>

<template>
  <div class="nk-stack">
    <header class="nk-pagehead">
      <h1 class="nk-pagehead__title">Pengaduan</h1>
      <p class="nk-pagehead__sub">Ada kendala di kos? Laporkan, kami bantu tindak lanjuti.</p>
    </header>

    <Button
      class="nk-cta"
      icon="pi pi-plus"
      label="Buat pengaduan"
      @click="notice = true"
    />

    <Message v-if="notice" severity="info" :closable="true" @close="notice = false">
      Fitur pengaduan akan segera aktif — sedang kami siapkan.
    </Message>

    <section class="nk-stack" style="gap: 10px">
      <h2 class="nk-sect">Riwayat</h2>
      <EmptyState
        icon="pi pi-comments"
        title="Belum ada pengaduan"
        description="Pengaduan yang kamu buat akan tampil di sini beserta statusnya."
      />
    </section>
  </div>
</template>
