<script setup lang="ts">
// Loading bar navigasi kustom — dijamin tampil tiap pindah halaman
// (NuxtLoadingIndicator bawaan tak kelihatan karena navigasi SPA kita instan).
const active = ref(false)
const progress = ref(0)
let tick: ReturnType<typeof setInterval> | null = null
let hide: ReturnType<typeof setTimeout> | null = null

function start() {
  if (hide) clearTimeout(hide)
  active.value = true
  progress.value = 10
  if (tick) clearInterval(tick)
  tick = setInterval(() => {
    progress.value = Math.min(90, progress.value + (90 - progress.value) * 0.14 + 1)
  }, 120)
}

function done() {
  if (tick) clearInterval(tick)
  progress.value = 100
  hide = setTimeout(() => {
    active.value = false
    progress.value = 0
  }, 260)
}

const router = useRouter()
router.beforeEach(() => {
  start()
})
router.afterEach(() => {
  setTimeout(done, 180)
})
router.onError(() => done())
</script>

<template>
  <div v-show="active" class="navbar" :style="{ width: progress + '%' }" aria-hidden="true" />
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--brand), var(--honey));
  z-index: 99999;
  transition: width 0.2s ease;
  box-shadow: 0 0 10px rgba(82, 55, 36, 0.5);
}
</style>
