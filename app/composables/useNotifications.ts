export type Notif = {
  id: string
  tipe: string | null
  judul: string | null
  pesan: string | null
  read_at: string | null
  created_at: string | null
}

/**
 * Logika notifikasi in-app bersama (dipakai bell admin & penghuni):
 * ambil daftar, tandai dibaca, polling berkala, format waktu relatif.
 */
export function useNotifications() {
  const api = useApi()
  const notifs = ref<Notif[]>([])
  const unread = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

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
    if (n.read_at) return
    try {
      await api(`/notifications/${n.id}/read`, { method: 'POST' })
      n.read_at = new Date().toISOString()
      unread.value = Math.max(0, unread.value - 1)
    } catch {
      /* abaikan */
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

  function start(intervalMs = 45000) {
    loadNotifs()
    timer = setInterval(loadNotifs, intervalMs)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  return { notifs, unread, loadNotifs, markRead, waktuSingkat, start, stop }
}
