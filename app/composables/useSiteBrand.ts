// Logo situs: dinamis dari data kos (logo_url pertama yang ada),
// fallback ke aset bundel /logo-ngekoskuy.png bila belum ada.
export function useSiteBrand() {
  const logoUrl = useState<string | null>('site-logo', () => null)
  const loaded = useState<boolean>('site-logo-loaded', () => false)

  async function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const api = useApi()
      const res = await api<{ data: { logo_url: string | null }[] }>('/public/kos', {
        params: { limit: 50 },
      })
      const withLogo = res.data.find((k) => k.logo_url)
      logoUrl.value = withLogo?.logo_url ?? null
    } catch {
      /* fallback ke aset bundel */
    }
  }

  if (import.meta.client) load()

  return { logoUrl }
}
