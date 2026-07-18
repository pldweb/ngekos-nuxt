<script setup lang="ts">
import type { PublicKos } from '~/composables/usePublicKos'

const props = withDefaults(defineProps<{ kos: PublicKos; base?: string }>(), { base: '/kos' })
const cover = computed(() => props.kos.foto?.[0] || null)
</script>

<template>
  <NuxtLink :to="`${base}/${kos.id}`" class="kos-card">
    <div class="kos-card__media">
      <img v-if="cover" :src="cover" :alt="kos.nama" loading="lazy" />
      <div v-else class="kos-card__ph"><i class="pi pi-home" /></div>
      <span v-if="kos.populer" class="kos-card__badge">Populer</span>
      <span class="kos-card__heart" aria-hidden="true"><i class="pi pi-heart" /></span>
    </div>

    <div class="kos-card__body">
      <div class="kos-card__head">
        <img v-if="kos.logo_url" :src="kos.logo_url" :alt="`Logo ${kos.nama}`" class="kos-card__logo" loading="lazy" />
        <h3 class="kos-card__title">{{ kos.nama }}</h3>
      </div>
      <p class="kos-card__loc">
        <i class="pi pi-map-marker" /><span>{{ kos.alamat }}</span>
      </p>
      <p class="kos-card__price">
        <template v-if="kos.harga_mulai != null">
          <strong>{{ formatRupiah(kos.harga_mulai) }}</strong>
          <span class="kos-card__per">/ bulan</span>
        </template>
        <template v-else>
          <strong>Hubungi</strong>
        </template>
      </p>

      <div class="kos-card__fac">
        <span
          v-for="f in kos.fasilitas.slice(0, 3)"
          :key="f"
          class="kos-card__fac-item"
        >
          <i :class="fasilitasInfo(f).icon" />{{ fasilitasInfo(f).label }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.kos-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
  color: var(--ink);
  box-shadow: 0 10px 30px -22px rgba(40, 30, 20, 0.5);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  height: 100%;
}
.kos-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px -22px rgba(40, 30, 20, 0.55);
}
.kos-card__media {
  position: relative;
  aspect-ratio: 16 / 11;
  background: var(--sand-soft);
}
.kos-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.kos-card__ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--sand-soft), var(--sand));
  color: var(--brand-soft);
  font-size: 40px;
}
.kos-card__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(82, 55, 36, 0.92);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}
.kos-card__heart {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--brand);
  font-size: 15px;
}
.kos-card__body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.kos-card__head { display: flex; align-items: center; gap: 8px; }
.kos-card__logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
  border-radius: 7px;
  background: var(--sand-soft);
  padding: 3px;
  flex-shrink: 0;
}
.kos-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.kos-card__loc {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-soft);
}
.kos-card__loc i { color: var(--brand-soft); font-size: 13px; }
.kos-card__price {
  margin: 2px 0 4px;
  color: var(--brand);
}
.kos-card__price strong { font-size: 17px; font-weight: 700; }
.kos-card__per { font-size: 12px; color: var(--ink-soft); font-weight: 500; }
.kos-card__fac {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--line);
}
.kos-card__fac-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-soft);
}
.kos-card__fac-item i { color: var(--brand-soft); font-size: 13px; }
</style>
