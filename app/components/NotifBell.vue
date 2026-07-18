<script setup lang="ts">
import type { Notif } from '~/composables/useNotifications'

const { notifs, unread, markRead, waktuSingkat, start, stop } = useNotifications()
const open = ref(false)

// Tujuan navigasi per jenis notifikasi penghuni (klik = tandai dibaca + buka halaman terkait).
function linkFor(tipe: string | null): string | null {
  switch (tipe) {
    case 'payment_approved':
      return '/home/bayar'
    case 'invoice_issued':
      return '/home/tagihan'
    case 'complaint_status':
      return '/home/pengaduan'
    case 'announcement':
      return '/home/pengumuman'
    default:
      return null
  }
}

async function pilih(n: Notif) {
  await markRead(n)
  const to = linkFor(n.tipe)
  open.value = false
  if (to) await navigateTo(to)
}

onMounted(() => start())
onUnmounted(() => stop())
</script>

<template>
  <div class="nb">
    <button class="nb__btn" type="button" aria-label="Notifikasi" @click="open = !open">
      <i class="pi pi-bell" />
      <span v-if="unread > 0" class="nb__badge">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <template v-if="open">
      <div class="nb__backdrop" @click="open = false" />
      <div class="nb__panel">
        <header class="nb__head">
          <strong>Notifikasi</strong>
          <span v-if="unread > 0" class="nb__count">{{ unread }} baru</span>
        </header>
        <div class="nb__list">
          <p v-if="!notifs.length" class="nb__empty">Belum ada notifikasi.</p>
          <button
            v-for="n in notifs"
            :key="n.id"
            type="button"
            class="nb__item"
            :class="{ 'nb__item--unread': !n.read_at }"
            @click="pilih(n)"
          >
            <span class="nb__dot" :class="{ 'is-on': !n.read_at }" />
            <span class="nb__body">
              <span class="nb__title">{{ n.judul ?? 'Notifikasi' }}</span>
              <span class="nb__msg">{{ n.pesan }}</span>
              <span class="nb__time">{{ waktuSingkat(n.created_at) }}</span>
            </span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.nb { position: relative; display: flex; }
.nb__btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: none;
  background: var(--surface-2);
  border-radius: 12px;
  color: var(--brand);
  font-size: 17px;
  cursor: pointer;
}
.nb__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: #d64545;
  border-radius: 999px;
}
.nb__backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
}
.nb__panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 51;
  width: min(340px, calc(100vw - 32px));
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 18px 40px -20px rgba(40, 30, 20, 0.5);
  overflow: hidden;
}
.nb__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
}
.nb__count { font-size: 12px; color: var(--brand); }
.nb__list { max-height: 60vh; overflow-y: auto; }
.nb__empty { margin: 0; padding: 20px 14px; text-align: center; color: var(--ink-soft); font-size: 13px; }
.nb__item {
  width: 100%;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border: none;
  border-bottom: 1px solid var(--line);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.nb__item:last-child { border-bottom: none; }
.nb__item--unread { background: var(--sand-soft); }
.nb__dot {
  margin-top: 5px;
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: transparent;
}
.nb__dot.is-on { background: var(--brand); }
.nb__body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.nb__title { font-size: 13px; font-weight: 600; color: var(--ink); }
.nb__msg { font-size: 12px; color: var(--ink-soft); }
.nb__time { font-size: 11px; color: var(--ink-soft); }
</style>
