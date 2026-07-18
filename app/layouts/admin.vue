<script setup lang="ts">
const auth = useAuthStore()
const brand = useBrandStore()
const route = useRoute()
const api = useApi()

const collapsed = ref(false)

/* ---------- Notifikasi ---------- */
type Notif = {
  id: string
  tipe: string | null
  judul: string | null
  pesan: string | null
  read_at: string | null
  created_at: string | null
}
const notifs = ref<Notif[]>([])
const unread = ref(0)
const notifOpen = ref(false)
let notifTimer: ReturnType<typeof setInterval> | null = null

async function loadNotifs() {
  try {
    const res = await api<{ data: Notif[]; unread: number }>('/notifications')
    notifs.value = res.data
    unread.value = res.unread
  } catch {
    /* abaikan */
  }
}

async function markRead(n: Notif) {
  if (!n.read_at) {
    try {
      await api(`/notifications/${n.id}/read`, { method: 'POST' })
      n.read_at = new Date().toISOString()
      unread.value = Math.max(0, unread.value - 1)
    } catch {
      /* abaikan */
    }
  }
}

function waktuSingkat(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const detik = Math.floor((Date.now() - d.getTime()) / 1000)
  if (detik < 60) return 'baru saja'
  if (detik < 3600) return `${Math.floor(detik / 60)} mnt lalu`
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

onMounted(() => {
  brand.load()
  collapsed.value = localStorage.getItem('sidebarCollapsed') === '1'
  loadNotifs()
  notifTimer = setInterval(loadNotifs, 45000)
})

onUnmounted(() => {
  if (notifTimer) clearInterval(notifTimer)
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebarCollapsed', collapsed.value ? '1' : '0')
}

const nav = [
  { label: 'Dashboard', icon: 'pi pi-th-large', to: '/admin', group: 'Utama' },
  { label: 'Kamar', icon: 'pi pi-building', to: '/admin/kamar', group: 'Kelola' },
  { label: 'Penghuni', icon: 'pi pi-users', to: '/admin/penghuni', group: 'Kelola' },
  { label: 'Pengguna', icon: 'pi pi-id-card', to: '/admin/pengguna', group: 'Kelola' },
  { label: 'Tagihan', icon: 'pi pi-file', to: '/admin/tagihan', group: 'Keuangan' },
  { label: 'Laporan', icon: 'pi pi-chart-bar', to: '/admin/laporan', group: 'Keuangan' },
  { label: 'Kos Harian', icon: 'pi pi-calendar', to: '/admin/harian', group: 'Keuangan' },
  { label: 'Pengaduan', icon: 'pi pi-comment', to: '/admin/pengaduan', group: 'Lainnya' },
  { label: 'Log Aktivitas', icon: 'pi pi-history', to: '/admin/aktivitas', group: 'Lainnya' },
  { label: 'Peran & Akses', icon: 'pi pi-shield', to: '/admin/peran', group: 'Lainnya', superAdmin: true },
  { label: 'Pengaturan', icon: 'pi pi-cog', to: '/admin/pengaturan', group: 'Lainnya' },
]

const visibleNav = computed(() => nav.filter((n) => !n.superAdmin || auth.isSuperAdmin))
const groups = computed(() => {
  const order = ['Utama', 'Kelola', 'Keuangan', 'Lainnya']
  return order
    .map((g) => ({ name: g, items: visibleNav.value.filter((n) => n.group === g) }))
    .filter((g) => g.items.length > 0)
})

const pageTitle = computed(() => nav.find((n) => n.to === route.path)?.label ?? 'NgekosKuy')

const drawerOpen = ref(false)
watch(() => route.path, () => (drawerOpen.value = false))
</script>

<template>
  <div class="shell" :class="{ 'shell--collapsed': collapsed }">
    <!-- Sidebar -->
    <aside class="side" :class="{ 'side--open': drawerOpen }">
      <NuxtLink to="/admin" class="side__brand">
        <span class="side__logo">
          <img :src="brand.logoUrl || '/logo-ngekoskuy.png'" alt="Logo" />
        </span>
        <span v-if="brand.kosName" class="side__kosname">{{ brand.kosName }}</span>
      </NuxtLink>

      <nav class="side__nav">
        <div v-for="g in groups" :key="g.name" class="side__group">
          <p class="side__grouplabel">{{ g.name }}</p>
          <NuxtLink
            v-for="item in g.items"
            :key="item.to"
            :to="item.to"
            class="navlink"
            :class="{ 'navlink--active': route.path === item.to }"
            :title="collapsed ? item.label : undefined"
          >
            <span class="navlink__ic"><i :class="item.icon" /></span>
            <span class="navlink__label">{{ item.label }}</span>
            <span v-if="route.path === item.to" class="navlink__dot" />
          </NuxtLink>
        </div>
      </nav>

      <div class="side__foot">
        <div class="who">
          <span class="who__avatar">{{ (auth.user?.name?.[0] ?? '?').toUpperCase() }}</span>
          <div class="who__meta">
            <p class="who__name">{{ auth.user?.name ?? 'Admin' }}</p>
            <p class="who__role">{{ auth.user?.email }}</p>
          </div>
        </div>
      </div>
    </aside>

    <div v-if="drawerOpen" class="scrim" aria-hidden="true" @click="drawerOpen = false" />

    <!-- Main column -->
    <div class="main">
      <header class="topbar">
        <button class="topbar__burger" type="button" aria-label="Buka menu" @click="drawerOpen = true">
          <i class="pi pi-bars" />
        </button>
        <button
          class="topbar__collapse"
          type="button"
          :aria-label="collapsed ? 'Buka menu samping' : 'Sembunyikan menu samping'"
          @click="toggleCollapse"
        >
          <i class="pi" :class="collapsed ? 'pi-angle-double-right' : 'pi-angle-double-left'" />
        </button>
        <h1 class="topbar__title">{{ pageTitle }}</h1>
        <div class="topbar__actions">
          <div class="notif">
            <button
              class="topbar__icon"
              type="button"
              aria-label="Notifikasi"
              @click="notifOpen = !notifOpen"
            >
              <i class="pi pi-bell" />
              <span v-if="unread > 0" class="topbar__badge">{{ unread > 9 ? '9+' : unread }}</span>
            </button>

            <template v-if="notifOpen">
              <div class="notif__backdrop" @click="notifOpen = false" />
              <div class="notif__panel">
                <header class="notif__head">
                  <strong>Notifikasi</strong>
                  <span v-if="unread > 0" class="notif__count">{{ unread }} baru</span>
                </header>
                <div class="notif__list">
                  <p v-if="!notifs.length" class="notif__empty">Belum ada notifikasi.</p>
                  <button
                    v-for="n in notifs"
                    :key="n.id"
                    type="button"
                    class="notif__item"
                    :class="{ 'notif__item--unread': !n.read_at }"
                    @click="markRead(n)"
                  >
                    <span class="notif__dot" :class="{ 'is-on': !n.read_at }" />
                    <span class="notif__body">
                      <span class="notif__title">{{ n.judul ?? 'Notifikasi' }}</span>
                      <span class="notif__msg">{{ n.pesan }}</span>
                      <span class="notif__time">{{ waktuSingkat(n.created_at) }}</span>
                    </span>
                  </button>
                </div>
              </div>
            </template>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main class="content">
        <div class="content__inner">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  --side-w: 258px;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: var(--side-w) 1fr;
  background: var(--bg);
  transition: grid-template-columns 0.22s ease;
}

/* ---------- Collapsed rail (desktop only) ---------- */
@media (min-width: 1024px) {
  .shell--collapsed { --side-w: 78px; }
  .shell--collapsed .side__kosname,
  .shell--collapsed .side__grouplabel,
  .shell--collapsed .navlink__label,
  .shell--collapsed .navlink__dot,
  .shell--collapsed .who__meta { display: none; }
  .shell--collapsed .side__brand { justify-content: center; padding: 20px 12px 16px; }
  .shell--collapsed .side__brand :deep(.brand__word) { display: none; }
  .shell--collapsed .side__nav { padding: 6px 12px 12px; }
  .shell--collapsed .navlink { justify-content: center; padding: 9px 8px; }
  .shell--collapsed .navlink__ic { width: 36px; height: 36px; }
  .shell--collapsed .side__foot { padding: 14px 12px 18px; }
  .shell--collapsed .who { justify-content: center; }
}

/* ---------- Sidebar ---------- */
.side {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  color: #e9dccc;
  background:
    radial-gradient(120% 60% at 100% 0%, rgba(201, 175, 148, 0.16), transparent 60%),
    linear-gradient(185deg, #5b3f28 0%, var(--brand-strong) 55%, #3a2717 100%);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
}
.side__brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 20px 20px 16px;
  margin-bottom: 4px;
}
.side__logo {
  display: grid;
  place-items: center;
  min-width: 38px;
  height: 38px;
  border-radius: 11px;
  overflow: hidden;
}
.side__logo img { width: 38px; height: 38px; object-fit: cover; border-radius: 11px; }
.side__brand :deep(.brand__word) { color: #fff; }
.side__brand :deep(.brand__word span) { color: var(--sand); }
.side__kosname {
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side__nav {
  flex: 1;
  overflow-y: auto;
  padding: 6px 14px 12px;
}
.side__group { margin-bottom: 14px; }
.side__grouplabel {
  margin: 0 0 6px 10px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: rgba(233, 220, 204, 0.42);
}
.navlink {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #d3c1ad;
  transition: background 0.15s, color 0.15s;
}
.navlink__ic {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 15px;
  transition: background 0.15s, color 0.15s;
}
.navlink--active,
.navlink:hover:not(.navlink--active) {
  background: linear-gradient(90deg, var(--sand), #d8c3a6);
  color: var(--brand-strong);
  font-weight: 600;
  box-shadow: 0 8px 18px -10px rgba(201, 175, 148, 0.8);
}
.navlink--active .navlink__ic,
.navlink:hover:not(.navlink--active) .navlink__ic {
  background: rgba(70, 48, 31, 0.14);
  color: var(--brand-strong);
}
.navlink__label { flex: 1; }
.navlink__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--brand-strong); }

.side__foot {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 16px 18px;
}
.who { display: flex; align-items: center; gap: 11px; }
.who__avatar {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--sand);
  color: var(--brand-strong);
  font-weight: 700;
  font-size: 15px;
}
.who__meta { min-width: 0; }
.who__name { margin: 0; font-size: 13.5px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.who__role { margin: 2px 0 0; font-size: 11.5px; color: rgba(233, 220, 204, 0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ---------- Main ---------- */
.main { display: flex; flex-direction: column; min-width: 0; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 66px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 26px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.topbar__burger {
  display: none;
  width: 40px;
  height: 40px;
  place-items: center;
  border: none;
  background: var(--surface-2);
  border-radius: 10px;
  color: var(--brand);
  font-size: 17px;
  cursor: pointer;
}
.topbar__collapse {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 10px;
  color: var(--brand);
  font-size: 15px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.topbar__collapse:hover { border-color: var(--sand); background: var(--surface-2); }
.topbar__title { margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }
.topbar__actions { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.topbar__icon {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 10px;
  color: var(--brand);
  font-size: 16px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.topbar__icon:hover { border-color: var(--sand); }
.topbar__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

/* ---------- Notifikasi dropdown ---------- */
.notif { position: relative; display: flex; }
.notif__backdrop { position: fixed; inset: 0; z-index: 40; }
.notif__panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 41;
  width: 340px;
  max-width: calc(100vw - 32px);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 22px 50px -24px rgba(40, 28, 18, 0.5);
  overflow: hidden;
}
.notif__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}
.notif__count { font-size: 12px; color: var(--brand); font-weight: 600; }
.notif__list { max-height: 380px; overflow-y: auto; }
.notif__empty { margin: 0; padding: 26px 16px; text-align: center; color: var(--ink-soft); font-size: 13px; }
.notif__item {
  width: 100%;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid var(--line);
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.notif__item:last-child { border-bottom: none; }
.notif__item:hover { background: var(--surface-2); }
.notif__item--unread { background: color-mix(in srgb, var(--sand-soft), transparent 40%); }
.notif__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: transparent;
}
.notif__dot.is-on { background: var(--brand); }
.notif__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.notif__title { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.notif__msg { font-size: 12.5px; color: var(--ink-soft); line-height: 1.45; }
.notif__time { font-size: 11px; color: var(--brand-soft); margin-top: 2px; }

.content { flex: 1; padding: 26px; }
.content__inner {
  max-width: 1180px;
  margin: 0 auto;
  container: appview / inline-size;
}

.scrim { display: none; }

/* ---------- Responsive: drawer < 1024px ---------- */
@media (max-width: 1023px) {
  .shell { grid-template-columns: 1fr; }
  .side {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 60;
    width: 270px;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: 0 0 60px -12px rgba(0, 0, 0, 0.5);
  }
  .side--open { transform: translateX(0); }
  .scrim { display: block; position: fixed; inset: 0; z-index: 50; background: rgba(20, 14, 9, 0.45); }
  .topbar__burger { display: grid; }
  .topbar__collapse { display: none; }
  .content { padding: 18px 16px 32px; }
}
@media (max-width: 560px) {
  .topbar { padding: 0 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .side { transition: none; }
}
</style>
