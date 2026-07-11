<script setup lang="ts">
const auth = useAuthStore()
const api = useApi()

const online = ref<boolean | null>(null)
onMounted(async () => {
  try {
    await api('/health')
    online.value = true
  } catch {
    online.value = false
  }
})

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '')

const menu = [
  { label: 'Tagihan', icon: 'pi pi-file', to: '/tagihan' },
  { label: 'Bayar', icon: 'pi pi-wallet', to: '/bayar' },
  { label: 'Laporan', icon: 'pi pi-chart-bar', to: '/laporan' },
  { label: 'Pengaduan', icon: 'pi pi-comment', to: '/pengaduan' },
]
</script>

<template>
  <div class="nk-stack">
    <section class="hero nk-rise">
      <p class="hero__eyebrow">Beranda</p>
      <h1 class="hero__title">
        <template v-if="firstName">Halo, {{ firstName }} 👋</template>
        <template v-else>Selamat datang 👋</template>
      </h1>
      <p class="hero__sub">Semoga betah — semua urusan kosmu ada di sini.</p>

      <NuxtLink v-if="!auth.isAuthenticated" to="/login" class="hero__cta">
        Masuk ke akun <i class="pi pi-arrow-right" />
      </NuxtLink>
    </section>

    <section class="nk-stack" style="gap: 10px">
      <h2 class="nk-sect">Menu</h2>
      <div class="tiles">
        <NuxtLink
          v-for="item in menu"
          :key="item.label"
          :to="item.to"
          class="tile"
        >
          <span class="tile__ic"><i :class="item.icon" /></span>
          <span class="tile__label">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </section>

    <p class="status">
      <span class="status__dot" :class="{ 'status__dot--off': online === false }" />
      <span v-if="online === null">Menghubungkan ke server…</span>
      <span v-else-if="online">Terhubung ke server</span>
      <span v-else>Server tidak terjangkau</span>
    </p>
  </div>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, #5c3f28 0%, var(--brand-strong) 100%);
  color: #f4ece1;
  border-radius: 18px;
  padding: 22px;
  box-shadow: var(--shadow-brand);
}
.hero__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sand);
}
.hero__title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
.hero__sub { margin: 8px 0 0; font-size: 14px; line-height: 1.5; color: #e3d6c6; }
.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  background: var(--sand);
  color: var(--brand-strong);
  font-weight: 600;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 12px;
}

.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 6px 12px;
  color: var(--ink);
  text-align: center;
}
.tile__ic {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 19px;
}
.tile__label { font-size: 12px; font-weight: 500; }

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--ink-soft);
}
.status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3fb27f;
}
.status__dot--off { background: var(--danger); }
</style>
