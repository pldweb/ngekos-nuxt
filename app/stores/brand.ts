import { defineStore } from 'pinia'

export const useBrandStore = defineStore('brand', {
  state: () => ({
    kosName: null as string | null,
    logoUrl: null as string | null,
    loaded: false,
  }),
  actions: {
    applyFavicon() {
      if (!import.meta.client || !this.logoUrl) return
      const head = document.head
      // Hapus favicon lama agar tidak bentrok, lalu pasang logo situs.
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
        // Logo situs GLOBAL (bukan per kos) untuk sidebar admin + favicon.
        const res = await api<{ data: { logo_url: string | null } }>('/public/site')
        this.logoUrl = res.data?.logo_url ?? null
        this.applyFavicon()
      } catch {
        /* abaikan */
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
