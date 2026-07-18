<script setup lang="ts">
const auth = useAuthStore()

const nav = [
  { label: 'Beranda', to: '/#beranda' },
  { label: 'Cari Kos', to: '/cari-kos' },
  { label: 'Galeri', to: '/#galeri' },
  { label: 'Testimoni', to: '/#testimoni' },
  { label: 'Tentang Kami', to: '/#tentang' },
]

const menuOpen = ref(false)

// Header transparan di atas hero halaman depan, berlatar putih saat di-scroll.
const route = useRoute()
const isLanding = computed(() => route.path === '/')
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 24
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="site">
    <header
      class="site__bar"
      :class="{
        'site__bar--float': isLanding,
        'site__bar--filled': isLanding && (scrolled || menuOpen),
      }"
    >
      <div class="site__inner">
        <NuxtLink to="/" class="site__brand" @click="menuOpen = false">
          <SiteLogo :height="40" />
        </NuxtLink>

        <nav class="site__nav">
          <NuxtLink v-for="n in nav" :key="n.to" :to="n.to" class="site__link">
            {{ n.label }}
          </NuxtLink>
        </nav>

        <div class="site__actions">
          <NuxtLink v-if="auth.isAuthenticated" :to="auth.isAdmin ? '/admin' : '/home'">
            <Button :label="auth.isAdmin ? 'Dashboard' : 'Beranda'" rounded />
          </NuxtLink>
          <NuxtLink v-else to="/login">
            <Button label="Login / Daftar" icon="pi pi-user" rounded />
          </NuxtLink>
          <button
            class="site__burger"
            type="button"
            aria-label="Menu"
            @click="menuOpen = !menuOpen"
          >
            <i :class="menuOpen ? 'pi pi-times' : 'pi pi-bars'" />
          </button>
        </div>
      </div>

      <nav v-show="menuOpen" class="site__mobile">
        <NuxtLink
          v-for="n in nav"
          :key="n.to"
          :to="n.to"
          class="site__mlink"
          @click="menuOpen = false"
        >
          {{ n.label }}
        </NuxtLink>
      </nav>
    </header>

    <main class="site__main">
      <slot />
    </main>

    <footer id="tentang" class="site__footer">
      <div class="site__footer-inner">
        <div class="site__footer-brand">
          <SiteLogo :height="46" />
          <p>
            Ngekoskuy adalah platform pencarian kos terpercaya yang membantu kamu
            menemukan tempat tinggal nyaman dengan mudah.
          </p>
        </div>

        <div class="site__footer-col">
          <h4>Navigasi</h4>
          <NuxtLink to="/#beranda">Beranda</NuxtLink>
          <NuxtLink to="/cari-kos">Cari Kos</NuxtLink>
          <NuxtLink to="/#galeri">Galeri</NuxtLink>
          <NuxtLink to="/#testimoni">Testimoni</NuxtLink>
          <NuxtLink to="/#tentang">Tentang Kami</NuxtLink>
        </div>

        <div class="site__footer-col">
          <h4>Bantuan</h4>
          <a href="#">FAQ</a>
          <a href="#">Syarat &amp; Ketentuan</a>
          <a href="#">Kebijakan Privasi</a>
          <a href="#">Hubungi Kami</a>
        </div>

        <div class="site__footer-col">
          <h4>Ikuti Kami</h4>
          <div class="site__social">
            <a href="#" aria-label="Instagram"><i class="pi pi-instagram" /></a>
            <a href="#" aria-label="WhatsApp"><i class="pi pi-whatsapp" /></a>
            <a href="#" aria-label="TikTok"><i class="pi pi-video" /></a>
          </div>
        </div>
      </div>
      <p class="site__copy">© 2026 Ngekoskuy. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.site {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* ---------- Header ---------- */
.site__bar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--brand-strong);
  color: #f4ece1;
  transition: background 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
}

/* Halaman depan: header mengambang & transparan di atas hero (teks gelap). */
.site__bar--float {
  position: fixed;
  left: 0;
  right: 0;
  background: transparent;
  color: var(--brand-strong);
}
.site__bar--float .site__link { color: var(--brand-soft); }
.site__bar--float .site__link:hover,
.site__bar--float .site__link.router-link-active { color: var(--brand-strong); }
.site__bar--float .site__burger {
  background: rgba(70, 48, 31, 0.1);
  color: var(--brand-strong);
}
.site__bar--float .site__mobile { border-top-color: rgba(70, 48, 31, 0.14); }
.site__bar--float .site__mlink { color: var(--brand-soft); }

/* Saat di-scroll (atau menu mobile terbuka): latar putih + bayangan halus. */
.site__bar--filled {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(10px);
  box-shadow: 0 6px 26px -18px rgba(70, 48, 31, 0.65);
  border-bottom: 1px solid var(--line);
}
.site__inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 68px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.site__brand { display: flex; align-items: center; }
.site__nav {
  display: flex;
  align-items: center;
  gap: 26px;
  margin: 0 auto;
}
.site__link {
  color: #ecdfce;
  font-size: 14.5px;
  font-weight: 500;
  transition: color 0.15s;
}
.site__link:hover,
.site__link.router-link-active { color: #fff; }
.site__actions { display: flex; align-items: center; gap: 10px; }
.site__burger {
  display: none;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
}
.site__mobile {
  display: none;
  flex-direction: column;
  padding: 8px 24px 16px;
  gap: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.site__mlink {
  color: #ecdfce;
  font-size: 15px;
  font-weight: 500;
  padding: 10px 4px;
}

/* ---------- Main ---------- */
.site__main { flex: 1; }

/* ---------- Footer ---------- */
.site__footer {
  background: var(--brand-strong);
  color: #e6d8c6;
  padding: 48px 24px 24px;
}
.site__footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 32px;
}
.site__footer-brand p {
  margin: 14px 0 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: #c9b8a2;
  max-width: 320px;
}
.site__footer-col h4 {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}
.site__footer-col a {
  display: block;
  color: #c9b8a2;
  font-size: 13.5px;
  padding: 5px 0;
  transition: color 0.15s;
}
.site__footer-col a:hover { color: #fff; }
.site__social { display: flex; gap: 10px; }
.site__social a {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 16px;
}
.site__copy {
  max-width: 1200px;
  margin: 36px auto 0;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12.5px;
  color: #b6a48d;
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .site__nav { display: none; }
  .site__burger { display: grid; place-items: center; }
  .site__mobile { display: flex; }
  .site__footer-inner { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .site__footer-inner { grid-template-columns: 1fr; }
}
</style>
