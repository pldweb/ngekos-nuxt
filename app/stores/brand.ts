import { defineStore } from 'pinia'

interface Kos {
  id: number
  nama: string
  logo_url: string | null
}

export const useBrandStore = defineStore('brand', {
  state: () => ({
    kosId: null as number | null,
    kosName: null as string | null,
    logoUrl: null as string | null,
    loaded: false,
  }),
  actions: {
    applyFavicon() {
      if (!import.meta.client || !this.logoUrl) return
      const head = document.head
      // Hapus favicon lama agar tidak bentrok, lalu pasang logo kos.
      head.querySelectorAll("link[rel~='icon']").forEach((el) => el.remove())
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = this.logoUrl
      head.appendChild(link)
    },
    async load(force = false) {
      if (this.loaded && !force) return
      const api = useApi()
      try {
        const res = await api<{ data: Kos[] }>('/kos')
        const primary = res.data?.[0] ?? null
        if (primary) {
          this.kosId = primary.id
          this.kosName = primary.nama
          this.logoUrl = primary.logo_url
          this.applyFavicon()
        }
      } catch {
        /* abaikan: user tanpa akses kos / belum ada kos */
      } finally {
        this.loaded = true
      }
    },
    setLogo(url: string | null) {
      // cache-bust agar favicon & tampilan langsung berganti
      this.logoUrl = url ? `${url}?t=${Date.now()}` : null
      this.applyFavicon()
    },
  },
})
