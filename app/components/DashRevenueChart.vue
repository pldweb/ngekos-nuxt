<script setup lang="ts">
const props = defineProps<{
  labels: string[]
  pendapatan: number[]
  pengeluaran: number[]
}>()

const W = 720
const H = 300
const PAD = { top: 18, right: 18, bottom: 34, left: 58 }
const iw = W - PAD.left - PAD.right
const ih = H - PAD.top - PAD.bottom

function niceStep(m: number) {
  const rough = m / 4
  const pow = Math.pow(10, Math.floor(Math.log10(rough || 1)))
  const n = rough / pow
  const nice = n >= 5 ? 5 : n >= 2 ? 2 : 1
  return nice * pow
}

const maxVal = computed(() => {
  const m = Math.max(1, ...props.pendapatan, ...props.pengeluaran)
  const step = niceStep(m)
  return Math.ceil(m / step) * step
})

function x(i: number) {
  const n = props.labels.length
  return PAD.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
}
function y(v: number) {
  return PAD.top + ih - (v / maxVal.value) * ih
}

const line = (arr: number[]) =>
  arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
const area = (arr: number[]) =>
  `${line(arr)} L${x(arr.length - 1)},${PAD.top + ih} L${x(0)},${PAD.top + ih} Z`

const yTicks = computed(() => {
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, i) => (maxVal.value / steps) * i)
})

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
function fmtLabel(l: string) {
  const m = l.split('-')[1]
  return m ? months[parseInt(m, 10) - 1] : l
}
function fmtY(v: number) {
  if (v >= 1_000_000) return 'Rp ' + Math.round(v / 1_000_000) + 'jt'
  if (v >= 1000) return 'Rp ' + Math.round(v / 1000) + 'rb'
  return 'Rp ' + v
}
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="chart" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--brand)" stop-opacity="0.22" />
        <stop offset="100%" stop-color="var(--brand)" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- grid + y labels -->
    <g class="chart__grid">
      <template v-for="(t, i) in yTicks" :key="i">
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="y(t)" :y2="y(t)" />
        <text :x="PAD.left - 10" :y="y(t) + 4" class="chart__ylabel">{{ fmtY(t) }}</text>
      </template>
    </g>

    <!-- x labels -->
    <text
      v-for="(l, i) in labels"
      :key="'x' + i"
      :x="x(i)"
      :y="H - 10"
      class="chart__xlabel"
    >{{ fmtLabel(l) }}</text>

    <!-- pendapatan area + line -->
    <path :d="area(pendapatan)" fill="url(#revFill)" />
    <path :d="line(pendapatan)" class="chart__line chart__line--in" />
    <circle v-for="(v, i) in pendapatan" :key="'p' + i" :cx="x(i)" :cy="y(v)" r="4" class="chart__dot--in" />

    <!-- pengeluaran line (dashed) -->
    <path :d="line(pengeluaran)" class="chart__line chart__line--out" />
  </svg>
</template>

<style scoped>
.chart { width: 100%; height: auto; display: block; }
.chart__grid line { stroke: var(--line); stroke-width: 1; }
.chart__ylabel { text-anchor: end; font-size: 11px; fill: var(--ink-soft); }
.chart__xlabel { text-anchor: middle; font-size: 11px; fill: var(--ink-soft); }
.chart__line { fill: none; stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
.chart__line--in { stroke: var(--brand); }
.chart__line--out { stroke: var(--sand); stroke-dasharray: 6 6; stroke-width: 2.5; }
.chart__dot--in { fill: var(--brand); }
</style>
