export interface PublicRoom {
  id: number
  nomor: string
  harga_sewa: number
  tarif_harian: number | null
  status: string
  fasilitas: string[]
}

export interface PublicKos {
  id: number
  nama: string
  alamat: string | null
  deskripsi: string | null
  foto: string[]
  logo_url: string | null
  fasilitas: string[]
  populer: boolean
  harga_mulai: number | null
  kamar_tersedia: number | null
  jumlah_kamar: number
  rooms?: PublicRoom[]
}

export function usePublicKos() {
  const api = useApi()

  const list = (params?: { q?: string; limit?: number }) =>
    api<{ data: PublicKos[] }>('/public/kos', { params })

  const detail = (id: number | string) =>
    api<{ data: PublicKos }>(`/public/kos/${id}`)

  return { list, detail }
}
