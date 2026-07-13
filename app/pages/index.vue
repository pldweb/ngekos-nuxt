<script setup lang="ts">
import type { PublicKos } from '~/composables/usePublicKos'

definePageMeta({ layout: 'public' })
useHead({ title: 'Ngekoskuy — Cari Kos Nyaman & Gampang' })

const { list } = usePublicKos()
const kosList = ref<PublicKos[]>([])
const loading = ref(true)
const search = ref('')

onMounted(async () => {
  try {
    kosList.value = (await list({ limit: 10 })).data
  } catch {
    /* biarkan kosong */
  } finally {
    loading.value = false
  }
})

function goSearch() {
  navigateTo({ path: '/cari-kos', query: search.value ? { q: search.value } : {} })
}

const responsiveOptions = [
  { breakpoint: '1200px', numVisible: 3, numScroll: 1 },
  { breakpoint: '900px', numVisible: 2, numScroll: 1 },
  { breakpoint: '620px', numVisible: 1, numScroll: 1 },
]

const trust = [
  { icon: 'pi pi-verified', title: '100%', sub: 'Terverifikasi' },
  { icon: 'pi pi-th-large', title: 'Banyak Pilihan', sub: 'Sesuai Budget' },
  { icon: 'pi pi-bolt', title: 'Proses Mudah', sub: 'Tanpa Ribet' },
]

const features = [
  { icon: 'pi pi-shield', title: 'Terverifikasi', desc: 'Semua kos sudah melalui proses verifikasi untuk keamanan dan kenyamananmu.' },
  { icon: 'pi pi-search', title: 'Pencarian Mudah', desc: 'Cari kos sesuai lokasi, budget, dan fasilitas yang kamu inginkan dengan cepat.' },
  { icon: 'pi pi-comments', title: 'Langsung Hubungi', desc: 'Hubungi pemilik kos langsung melalui chat atau WhatsApp tanpa perantara.' },
  { icon: 'pi pi-thumbs-up', title: 'Banyak Pilihan', desc: 'Ribuan pilihan kos dengan harga terjangkau di berbagai kota.' },
]

const testimoni = [
  { nama: 'Rani Putri', kota: 'Jakarta', teks: 'Cari kos jadi gampang banget. Fasilitasnya sesuai foto dan pemiliknya ramah!', star: 5 },
  { nama: 'Dimas Ardi', kota: 'Depok', teks: 'Prosesnya cepat, langsung dapat kos dekat kampus dengan harga pas di kantong.', star: 5 },
  { nama: 'Sinta Maharani', kota: 'Bekasi', teks: 'Semua kos terverifikasi, jadi lebih tenang dan aman. Recommended!', star: 5 },
]
</script>

<template>
  <div class="lp">
    <!-- HERO -->
    <section id="beranda" class="hero">
      <div class="hero__grid">
        <div class="hero__copy">
          <h1 class="hero__title">
            Cari Kos Nyaman,<br />Gampang di
            <span class="hero__brand">Ngekoskuy</span>
          </h1>
          <p class="hero__sub">
            Temukan kos terbaik sesuai kebutuhanmu. Mudah, cepat, dan terpercaya.
          </p>

          <form class="hero__search" @submit.prevent="goSearch">
            <span class="hero__search-field">
              <i class="pi pi-map-marker" />
              <InputText
                v-model="search"
                placeholder="Cari lokasi kos, kota, atau area…"
                unstyled
                class="hero__input"
              />
            </span>
            <Button type="submit" label="Cari Kos" rounded />
          </form>

          <div class="hero__trust">
            <div v-for="t in trust" :key="t.sub" class="hero__trust-item">
              <span class="hero__trust-ic"><i :class="t.icon" /></span>
              <span>
                <strong>{{ t.title }}</strong><br />
                <small>{{ t.sub }}</small>
              </span>
            </div>
          </div>
        </div>

        <div class="hero__art">
          <img src="https://picsum.photos/seed/ngekos-hero/900/900" alt="Bangunan kos" />
        </div>
      </div>
    </section>

    <!-- REKOMENDASI (CAROUSEL) -->
    <section id="rekomendasi" class="rec">
      <span class="pill">Pilihan Terbaik</span>
      <h2 class="sect-title">Rekomendasi Kos Untukmu</h2>
      <p class="sect-sub">Kos pilihan dengan fasilitas lengkap dan lokasi strategis</p>

      <div v-if="loading" class="rec__loading">Memuat kos…</div>
      <div v-else-if="!kosList.length" class="rec__loading">Belum ada kos tersedia.</div>
      <Carousel
        v-else
        :value="kosList"
        :numVisible="4"
        :numScroll="1"
        :responsiveOptions="responsiveOptions"
        circular
        class="rec__carousel"
      >
        <template #item="{ data }">
          <div class="rec__slide">
            <KosCard :kos="data" />
          </div>
        </template>
      </Carousel>

      <div class="rec__more">
        <NuxtLink to="/cari-kos"><Button label="Lihat Semua Kos" rounded /></NuxtLink>
      </div>
    </section>

    <!-- KENAPA / FITUR -->
    <section id="fasilitas" class="why">
      <div id="cara-kerja" class="why__box">
        <h2 class="sect-title">Kenapa Ngekoskuy?</h2>
        <p class="sect-sub">Kami hadir untuk membuat mencari kos jadi lebih mudah dan aman.</p>
        <div class="why__grid">
          <div v-for="f in features" :key="f.title" class="why__item">
            <span class="why__ic"><i :class="f.icon" /></span>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- TESTIMONI -->
    <section id="testimoni" class="tm">
      <span class="pill">Testimoni</span>
      <h2 class="sect-title">Apa Kata Mereka?</h2>
      <p class="sect-sub">Cerita penghuni yang sudah menemukan kos idamannya.</p>
      <div class="tm__grid">
        <div v-for="t in testimoni" :key="t.nama" class="tm__card">
          <div class="tm__stars">
            <i v-for="s in t.star" :key="s" class="pi pi-star-fill" />
          </div>
          <p class="tm__text">“{{ t.teks }}”</p>
          <div class="tm__who">
            <span class="tm__avatar">{{ t.nama.charAt(0) }}</span>
            <span>
              <strong>{{ t.nama }}</strong><br />
              <small>{{ t.kota }}</small>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="cta__box">
        <div class="cta__copy">
          <h2>Siap Pindah ke<br />Kos Idamanmu?</h2>
          <p>Temukan kos terbaikmu sekarang juga di Ngekoskuy, hunian nyaman untuk hidup lebih produktif.</p>
          <NuxtLink to="/cari-kos">
            <Button label="Cari Kos Sekarang" icon="pi pi-arrow-right" iconPos="right" rounded />
          </NuxtLink>
        </div>
        <div class="cta__art">
          <img src="https://picsum.photos/seed/ngekos-room/800/600" alt="Kamar kos" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lp { --pad: 24px; }
.pill {
  display: inline-block;
  background: var(--sand);
  color: var(--brand-strong);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 999px;
}
.sect-title {
  margin: 14px 0 6px;
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 800;
  color: var(--brand-strong);
  letter-spacing: -0.02em;
}
.sect-sub { margin: 0; color: var(--ink-soft); font-size: 15px; }

/* HERO */
.hero {
  background: linear-gradient(180deg, #efe6d9 0%, #f6efe6 100%);
}
.hero__grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: 24px;
  padding: 56px var(--pad);
}
.hero__title {
  margin: 0;
  font-size: clamp(34px, 5.4vw, 56px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: var(--brand-strong);
}
.hero__brand { color: var(--sand); }
.hero__sub { margin: 20px 0 26px; font-size: 16px; color: var(--brand-soft); max-width: 420px; }
.hero__search {
  display: flex;
  gap: 8px;
  background: #fff;
  padding: 8px;
  border-radius: 16px;
  box-shadow: 0 18px 40px -24px rgba(70, 48, 31, 0.5);
  max-width: 520px;
}
.hero__search-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  color: var(--ink-soft);
}
.hero__input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font);
  font-size: 15px;
  color: var(--ink);
}
.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 26px;
  margin-top: 30px;
}
.hero__trust-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--brand-soft); }
.hero__trust-item strong { color: var(--brand-strong); font-size: 14px; }
.hero__trust-ic {
  width: 38px; height: 38px;
  display: grid; place-items: center;
  border-radius: 50%;
  border: 1.5px solid var(--sand);
  color: var(--brand);
  font-size: 16px;
}
.hero__art img {
  width: 100%;
  border-radius: 20px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  box-shadow: 0 30px 60px -30px rgba(70, 48, 31, 0.55);
}

/* REKOMENDASI */
.rec {
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px var(--pad);
  text-align: center;
}
.rec__carousel { margin-top: 34px; text-align: left; }
.rec__slide { padding: 10px 8px; height: 100%; }
.rec__loading { margin-top: 34px; color: var(--ink-soft); }
.rec__more { margin-top: 30px; }

/* WHY */
.why { padding: 20px var(--pad) 64px; }
.why__box {
  max-width: 1160px;
  margin: 0 auto;
  background: var(--sand-soft);
  border-radius: 28px;
  padding: 48px 32px;
  text-align: center;
}
.why__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 34px;
  text-align: center;
}
.why__ic {
  width: 66px; height: 66px;
  display: grid; place-items: center;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #fff;
  color: var(--brand);
  font-size: 24px;
  box-shadow: 0 12px 26px -16px rgba(70, 48, 31, 0.5);
}
.why__item h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: var(--brand-strong); }
.why__item p { margin: 0; font-size: 13px; line-height: 1.6; color: var(--brand-soft); }

/* TESTIMONI */
.tm {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px var(--pad) 64px;
  text-align: center;
}
.tm__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  margin-top: 34px;
  text-align: left;
}
.tm__card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 12px 30px -24px rgba(40, 30, 20, 0.5);
}
.tm__stars { color: var(--honey); font-size: 14px; display: flex; gap: 3px; }
.tm__text { margin: 14px 0 18px; font-size: 14.5px; line-height: 1.6; color: var(--ink); }
.tm__who { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--ink-soft); }
.tm__who strong { color: var(--brand-strong); }
.tm__avatar {
  width: 42px; height: 42px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: var(--brand);
  color: var(--sand);
  font-weight: 700;
}

/* CTA */
.cta { padding: 20px var(--pad) 72px; }
.cta__box {
  max-width: 1160px;
  margin: 0 auto;
  background: linear-gradient(135deg, #5c3f28, var(--brand-strong));
  border-radius: 28px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  box-shadow: var(--shadow-brand);
}
.cta__copy { padding: 48px 40px; color: #f4ece1; }
.cta__copy h2 { margin: 0 0 14px; font-size: clamp(26px, 3.4vw, 34px); font-weight: 800; line-height: 1.15; }
.cta__copy p { margin: 0 0 26px; font-size: 15px; color: #e3d6c6; max-width: 380px; line-height: 1.6; }
.cta__art { height: 100%; }
.cta__art img { width: 100%; height: 100%; min-height: 260px; object-fit: cover; display: block; }

/* Responsive */
@media (max-width: 980px) {
  .hero__grid { grid-template-columns: 1fr; }
  .hero__art { order: -1; }
  .why__grid { grid-template-columns: repeat(2, 1fr); }
  .tm__grid { grid-template-columns: 1fr; }
  .cta__box { grid-template-columns: 1fr; }
  .cta__art { order: -1; }
}
@media (max-width: 560px) {
  .why__grid { grid-template-columns: 1fr; }
  .hero__search { flex-direction: column; }
}
</style>
