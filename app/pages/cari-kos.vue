<script setup lang="ts">
import type { PublicKos } from '~/composables/usePublicKos'

definePageMeta({ layout: 'public' })
useHead({ title: 'Cari Kos — Ngekoskuy' })

const route = useRoute()
const { list } = usePublicKos()

const q = ref((route.query.q as string) || '')
const items = ref<PublicKos[]>([])
const loading = ref(true)

async function fetchList() {
  loading.value = true
  try {
    items.value = (await list({ q: q.value || undefined, limit: 50 })).data
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function submitSearch() {
  navigateTo({ path: '/cari-kos', query: q.value ? { q: q.value } : {} })
}

onMounted(fetchList)
watch(() => route.query.q, (val) => {
  q.value = (val as string) || ''
  fetchList()
})
</script>

<template>
  <div class="ck">
    <section class="ck__head">
      <div class="ck__head-inner">
        <h1>Cari Kos</h1>
        <p>Temukan kos yang sesuai dengan kebutuhanmu.</p>
        <form class="ck__search" @submit.prevent="submitSearch">
          <span class="ck__field">
            <i class="pi pi-search" />
            <InputText
              v-model="q"
              placeholder="Cari nama kos atau lokasi…"
              unstyled
              class="ck__input"
            />
          </span>
          <Button type="submit" label="Cari" rounded />
        </form>
      </div>
    </section>

    <section class="ck__body">
      <div v-if="loading" class="ck__state">Memuat kos…</div>
      <div v-else-if="!items.length" class="ck__state">
        <i class="pi pi-inbox" />
        <p>Tidak ada kos yang cocok dengan pencarianmu.</p>
      </div>
      <template v-else>
        <p class="ck__count">{{ items.length }} kos ditemukan</p>
        <div class="ck__grid">
          <KosCard v-for="k in items" :key="k.id" :kos="k" />
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.ck__head { background: linear-gradient(180deg, #efe6d9, #f6efe6); }
.ck__head-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
}
.ck__head h1 { margin: 0; font-size: clamp(28px, 4vw, 38px); font-weight: 800; color: var(--brand-strong); }
.ck__head p { margin: 8px 0 22px; color: var(--brand-soft); font-size: 15px; }
.ck__search {
  display: flex;
  gap: 8px;
  background: #fff;
  padding: 8px;
  border-radius: 16px;
  box-shadow: 0 18px 40px -26px rgba(70, 48, 31, 0.5);
  max-width: 560px;
}
.ck__field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  color: var(--ink-soft);
}
.ck__input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font);
  font-size: 15px;
  color: var(--ink);
}
.ck__body { max-width: 1200px; margin: 0 auto; padding: 40px 24px 72px; }
.ck__count { margin: 0 0 20px; color: var(--ink-soft); font-size: 14px; }
.ck__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}
.ck__state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-soft);
}
.ck__state i { font-size: 40px; display: block; margin-bottom: 12px; color: var(--sand); }

@media (max-width: 1100px) { .ck__grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 820px) { .ck__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) {
  .ck__grid { grid-template-columns: 1fr; }
  .ck__search { flex-direction: column; }
}
</style>
