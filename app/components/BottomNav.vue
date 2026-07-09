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
  <nav class="bottom-nav">
    <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="nav-item">
      <i :class="item.icon" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-max-width);
  display: flex;
  justify-content: space-around;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  padding: 6px 0;
  z-index: 50;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #64748b;
  text-decoration: none;
}
.nav-item.router-link-active {
  color: #523724;
}
.nav-item i {
  font-size: 18px;
}
</style>
