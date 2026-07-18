<script setup lang="ts">
import type { PublicKos } from '~/composables/usePublicKos'

definePageMeta({ layout: 'public' })
useHead({ title: 'Ngekoskuy — Cari Kos Nyaman & Gampang' })

const { list } = usePublicKos()
const api = useApi()
const kosList = ref<PublicKos[]>([])
const loading = ref(true)
const TAHUN_BERDIRI = 2010
type Testimoni = { nama: string; kota: string; teks: string; star: number }
type KonsultasiWa = { nomor: string | null; template: string }

const statsData = ref({ total_kos: 0, total_kamar: 0, total_pengguna: 0 })
const testimoni = ref<Testimoni[]>([])
const konsultasiWa = ref<KonsultasiWa | null>(null)

onMounted(async () => {
  try {
    kosList.value = (await list({ limit: 10 })).data
    const kosPertama = kosList.value[0]
    if (kosPertama) {
      try {
        const res = await api<{ data: KonsultasiWa }>(`/public/kos/${kosPertama.id}/konsultasi`)
        konsultasiWa.value = res.data
      } catch {
        /* fallback ke informasi kantor */
      }
    }
  } catch {
    /* biarkan kosong */
  } finally {
    loading.value = false
  }

  try {
    const res = await api<{ data: typeof statsData.value }>('/public/stats')
    statsData.value = res.data
  } catch {
    /* biarkan nilai default 0 */
  }

  try {
    const res = await api<{ data: Testimoni[] }>('/public/testimoni')
    testimoni.value = res.data
  } catch {
    /* pakai testimoni bawaan */
  }
})

function ringkas(n: number): string {
  return n >= 1000 ? `${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, '0')}` : String(n)
}

const responsiveOptions = [
  { breakpoint: '1200px', numVisible: 3, numScroll: 1 },
  { breakpoint: '900px', numVisible: 2, numScroll: 1 },
  { breakpoint: '620px', numVisible: 1, numScroll: 1 },
]

// Galeri dinamis: ambil foto dari kos asli (maks 8 kartu untuk 2 baris × 4).
// Placeholder hanya dipakai bila belum ada foto kos sama sekali.
const galeri = computed(() => {
  const fromKos = kosList.value.flatMap((k) =>
    (k.foto ?? []).map((url) => ({ url, nama: k.nama })),
  )
  if (fromKos.length) return fromKos.slice(0, 8)

  const seeds = ['kamar-1', 'kamar-2', 'kamar-3', 'fasilitas', 'teras', 'dapur', 'taman', 'lorong']
  return seeds.map((s) => ({
    url: `https://picsum.photos/seed/ngekos-galeri-${s}/800/600`,
    nama: 'Ngekoskuy',
  }))
})

const trust = [
  { icon: 'pi pi-verified', title: '100%', sub: 'Terverifikasi' },
  { icon: 'pi pi-th-large', title: 'Banyak Pilihan', sub: 'Sesuai Budget' },
  { icon: 'pi pi-bolt', title: 'Proses Mudah', sub: 'Tanpa Ribet' },
]

const stats = computed(() => [
  { icon: 'pi pi-home', value: String(statsData.value.total_kos), label: 'Total Kos' },
  { icon: 'pi pi-building', value: ringkas(statsData.value.total_kamar), label: 'Total Kamar' },
  { icon: 'pi pi-users', value: ringkas(statsData.value.total_pengguna), label: 'Pengguna' },
  { icon: 'pi pi-calendar', value: String(TAHUN_BERDIRI), label: 'Berdiri Sejak' },
])

const sewaWaLink = computed(() => {
  const kos = kosList.value[0]
  const nomor = konsultasiWa.value?.nomor
    || kos?.informasi_kantor?.whatsapp
    || kos?.informasi_kantor?.telepon
  if (!nomor) return null

  const digits = nomor.replace(/\D/g, '').replace(/^0/, '62')
  const template = konsultasiWa.value?.template
    || 'Halo Admin Ngekoskuy, saya mau sewa kos di {kos}. Apakah masih tersedia?'
  const teks = template.replaceAll('{kos}', kos?.nama ?? 'Ngekoskuy')

  return `https://wa.me/${digits}?text=${encodeURIComponent(teks)}`
})

const defaultTestimoni: Testimoni[] = [
  { nama: 'Rani Putri', kota: 'Jakarta', teks: 'Cari kos jadi gampang banget. Fasilitasnya sesuai foto dan pemiliknya ramah!', star: 5 },
  { nama: 'Dimas Ardi', kota: 'Depok', teks: 'Prosesnya cepat, langsung dapat kos dekat kampus dengan harga pas di kantong.', star: 5 },
  { nama: 'Sinta Maharani', kota: 'Bekasi', teks: 'Semua kos terverifikasi, jadi lebih tenang dan aman. Recommended!', star: 5 },
]
const testimoniTampil = computed(() => testimoni.value.length ? testimoni.value : defaultTestimoni)
</script>

<template>
  <div class="lp">
    <!-- HERO -->
    <section id="beranda" class="hero">
      <div class="hero__grid">
        <div class="hero__copy">
          <span class="hero__badge"><i class="pi pi-home" /> Temukan kos terbaik untukmu</span>

          <h1 class="hero__title">
            Cari Kos Nyaman,<br />Mudah &amp; Terpercaya<br />
            <span class="hero__brand">di Ngekoskuy</span>
          </h1>
          <p class="hero__sub">
            Ribuan pilihan kos dengan fasilitas lengkap,<br />lokasi strategis, dan harga terbaik.
          </p>

          <a
            class="hero__wa"
            :class="{ 'hero__wa--disabled': !sewaWaLink }"
            :href="sewaWaLink ?? undefined"
            target="_blank"
            rel="noopener"
          >
            <Button
              label="Mau Sewa Kos"
              icon="pi pi-whatsapp"
              iconPos="right"
              rounded
              :disabled="!sewaWaLink"
            />
          </a>

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
      </div>

      <div class="hero__float">
        <span class="hero__float-ic"><i class="pi pi-users" /></span>
        <span><strong>5.000+</strong><br /><small>Pengguna Puas</small></span>
      </div>
    </section>

    <!-- STATISTIK -->
    <section class="stats">
      <div class="stats__bar">
        <div v-for="s in stats" :key="s.label" class="stats__item">
          <span class="stats__ic"><i :class="s.icon" /></span>
          <span class="stats__meta">
            <strong>{{ s.value }}</strong>
            <small>{{ s.label }}</small>
          </span>
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
        <a
          :href="sewaWaLink ?? undefined"
          target="_blank"
          rel="noopener"
          :class="{ 'hero__wa--disabled': !sewaWaLink }"
        >
          <Button label="Mau Sewa Kos" icon="pi pi-whatsapp" rounded :disabled="!sewaWaLink" />
        </a>
      </div>
    </section>

    <!-- GALERI (GRID KARTU 4×2) -->
    <section id="galeri" class="gal">
      <span class="pill">Galeri</span>
      <h2 class="sect-title">Intip Suasana Kos Kami</h2>
      <p class="sect-sub">Foto kamar, fasilitas, dan lingkungan kos kami.</p>

      <div class="gal__grid">
        <div v-for="(g, i) in galeri" :key="i" class="gal__card">
          <img :src="g.url" :alt="g.nama" loading="lazy" />
          <span class="gal__cap">{{ g.nama }}</span>
        </div>
      </div>
    </section>

    <!-- TESTIMONI -->
    <section id="testimoni" class="tm">
      <span class="pill">Testimoni</span>
      <h2 class="sect-title">Apa Kata Mereka?</h2>
      <p class="sect-sub">Cerita penghuni yang sudah menemukan kos idamannya.</p>
      <div class="tm__grid">
        <div v-for="t in testimoniTampil" :key="t.nama" class="tm__card">
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
          <a
            :href="sewaWaLink ?? undefined"
            target="_blank"
            rel="noopener"
            :class="{ 'hero__wa--disabled': !sewaWaLink }"
          >
            <Button label="Mau Sewa Kos" icon="pi pi-whatsapp" iconPos="right" rounded :disabled="!sewaWaLink" />
          </a>
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
  position: relative;
  min-height: clamp(560px, 82dvh, 720px);
  overflow: hidden;
  background-image: url('/hero-bg.png');
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f4ece0 0%, rgba(244, 236, 224, 0.72) 46%, rgba(244, 236, 224, 0) 72%);
  z-index: 0;
}
.hero__grid {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 108px var(--pad) 112px;
}
.hero__copy { max-width: 590px; }
.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--sand);
  color: var(--brand-strong);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 999px;
  margin-bottom: 22px;
}
.hero__badge i { color: var(--brand); }
.hero__title {
  margin: 0;
  font-size: clamp(26px, 5.4vw, 43px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: var(--brand-strong);
}
.hero__brand { color: var(--sand); }
.hero__sub { margin: 20px 0 26px; font-size: 16px; color: var(--brand-soft); max-width: 460px; line-height: 1.65; }
.hero__wa {
  display: inline-flex;
  text-decoration: none;
}
.hero__wa--disabled {
  pointer-events: none;
}

.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 22px 26px;
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
/* Kartu mengambang "Pengguna Puas" di kanan bawah hero */
.hero__float {
  position: absolute;
  z-index: 1;
  right: 40px;
  bottom: 96px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  padding: 14px 20px;
  border-radius: 16px;
  box-shadow: 0 22px 46px -26px rgba(70, 48, 31, 0.65);
}
.hero__float-ic {
  width: 42px; height: 42px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 18px;
}
.hero__float strong { color: var(--brand-strong); font-size: 18px; }
.hero__float small { color: var(--ink-soft); font-size: 12.5px; }

/* STATISTIK */
.stats {
  max-width: 1160px;
  margin: -64px auto 0;
  padding: 0 var(--pad);
  position: relative;
  z-index: 5;
}
.stats__bar {
  background: #fff;
  border-radius: 24px;
  padding: 26px 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  box-shadow: 0 26px 60px -34px rgba(70, 48, 31, 0.55);
}
.stats__item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border-right: 1px solid var(--line);
}
.stats__item:last-child { border-right: none; }
.stats__ic {
  width: 48px; height: 48px;
  display: grid; place-items: center;
  border-radius: 14px;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 20px;
}
.stats__meta { display: flex; flex-direction: column; }
.stats__meta strong { color: var(--brand-strong); font-size: 24px; font-weight: 800; line-height: 1.1; }
.stats__meta small { color: var(--ink-soft); font-size: 13px; }
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

/* GALERI (grid kartu 4×2) */
.gal {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px var(--pad) 64px;
  text-align: center;
}
.gal__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 34px;
}
.gal__card {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 34px -24px rgba(70, 48, 31, 0.6);
}
.gal__card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}
.gal__card:hover img { transform: scale(1.06); }
.gal__cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 26px 14px 12px;
  background: linear-gradient(transparent, rgba(40, 28, 18, 0.8));
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
}

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
  .hero { min-height: auto; background-position: center; }
  .hero::before { background: rgba(36, 24, 15, 0.72); }
  .hero__grid { padding: 104px var(--pad) 86px; }
  .hero__copy { max-width: 680px; }
  .hero__badge { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.32); color: #fff7ed; backdrop-filter: blur(8px); }
  .hero__title { color: #fffaf4; text-shadow: 0 3px 22px rgba(0, 0, 0, 0.34); }
  .hero__brand { color: #f2c879; }
  .hero__sub { color: rgba(255, 250, 244, 0.86); }
  .hero__trust-item { color: rgba(255, 250, 244, 0.76); }
  .hero__trust-item strong { color: #fffaf4; }
  .hero__trust-ic { border-color: rgba(242, 200, 121, 0.72); color: #f2c879; }
  .hero__float { display: none; }
  .stats { margin-top: -48px; }
  .stats__bar { grid-template-columns: repeat(2, 1fr); gap: 22px 16px; }
  .stats__item:nth-child(2n) { border-right: none; }
  .gal__grid { grid-template-columns: repeat(2, 1fr); }
  .tm__grid { grid-template-columns: 1fr; }
  .cta__box { grid-template-columns: 1fr; }
  .cta__art { order: -1; }
}
@media (max-width: 560px) {
  .lp { --pad: 18px; }
  .hero { background-position: center top; }
  .hero::before { background: rgba(36, 24, 15, 0.78); }
  .hero__grid { padding: 90px var(--pad) 72px; }
  .hero__title { font-size: clamp(32px, 11vw, 42px); }
  .hero__sub br { display: none; }
  .hero__trust { gap: 14px; }
  .stats { margin-top: 0; padding-top: 18px; }
  .stats__bar { grid-template-columns: 1fr; border-radius: 18px; }
  .stats__item { justify-content: flex-start; border-right: none; }
  .gal__grid { grid-template-columns: 1fr; }
}
</style>
