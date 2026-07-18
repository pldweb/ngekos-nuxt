// Logo situs GLOBAL (dari pengaturan → /public/site), dipakai di header landing
// & halaman login/register. Fallback ke aset bundel /logo-ngekoskuy.png.
export function useSiteBrand() {
  const logoUrl = useState<string | null>('site-logo', () => null)
  const loaded = useState<boolean>('site-logo-loaded', () => false)

  async function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const api = useApi()
      const res = await api<{ data: { logo_url: string | null } }>('/public/site')
      logoUrl.value = res.data?.logo_url ?? null
    } catch {
      /* fallback ke aset bundel */
    }
  }

  if (import.meta.client) load()

  return { logoUrl }
}
