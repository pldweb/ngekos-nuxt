<script setup lang="ts">
const items = [
  { label: 'Beranda', icon: 'pi pi-home', to: '/' },
  { label: 'Tagihan', icon: 'pi pi-file', to: '/tagihan' },
  { label: 'Bayar', icon: 'pi pi-wallet', to: '/bayar' },
  { label: 'Pengaduan', icon: 'pi pi-comment', to: '/pengaduan' },
  { label: 'Profil', icon: 'pi pi-user', to: '/profil' },
]
</script>

<template>
  <nav class="nav">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav__item"
    >
      <span class="nav__ic"><i :class="item.icon" /></span>
      <span class="nav__label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-max-width);
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--line);
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
  z-index: 50;
}
.nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 500;
}
.nav__ic {
  width: 46px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  font-size: 18px;
  transition: background 0.2s, color 0.2s;
}
.nav__item.router-link-active { color: var(--brand); font-weight: 600; }
.nav__item.router-link-active .nav__ic {
  background: var(--sand-soft);
  color: var(--brand);
}
</style>
