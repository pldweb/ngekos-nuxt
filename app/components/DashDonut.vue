<script setup lang="ts">
const props = defineProps<{ terisi: number; kosong: number }>()

const total = computed(() => Math.max(0, props.terisi + props.kosong))
const pct = computed(() => (total.value ? Math.round((props.terisi / total.value) * 100) : 0))

const R = 66
const C = 2 * Math.PI * R
const dash = computed(() => (pct.value / 100) * C)
</script>

<template>
  <div class="donut">
    <svg viewBox="0 0 180 180" class="donut__svg" role="img" :aria-label="`Tingkat hunian ${pct} persen`">
      <circle cx="90" cy="90" :r="R" fill="none" stroke-width="24" class="donut__bg" />
      <circle
        cx="90"
        cy="90"
        :r="R"
        fill="none"
        stroke-width="24"
        class="donut__fg"
        :stroke-dasharray="`${dash} ${C - dash}`"
        stroke-linecap="round"
        transform="rotate(-90 90 90)"
      />
      <text x="90" y="86" class="donut__pct">{{ pct }}%</text>
      <text x="90" y="106" class="donut__cap">Tingkat Hunian</text>
    </svg>
  </div>
</template>

<style scoped>
.donut { display: grid; place-items: center; }
.donut__svg { width: 180px; height: 180px; }
.donut__bg { stroke: var(--sand-soft); }
.donut__fg { stroke: var(--brand); transition: stroke-dasharray 0.6s ease; }
.donut__pct {
  text-anchor: middle;
  font-size: 30px;
  font-weight: 800;
  fill: var(--brand-strong);
}
.donut__cap {
  text-anchor: middle;
  font-size: 11px;
  fill: var(--ink-soft);
}
</style>
