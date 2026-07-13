export interface FasilitasInfo {
  label: string
  icon: string
}

const MAP: Record<string, FasilitasInfo> = {
  kamar_mandi_dalam: { label: 'K. Mandi Dalam', icon: 'pi pi-inbox' },
  kamar_mandi_luar: { label: 'K. Mandi Luar', icon: 'pi pi-inbox' },
  wifi: { label: 'WiFi', icon: 'pi pi-wifi' },
  ac: { label: 'AC', icon: 'pi pi-cloud' },
  dapur: { label: 'Dapur', icon: 'pi pi-shopping-bag' },
  parkir: { label: 'Parkir', icon: 'pi pi-car' },
  kasur: { label: 'Kasur', icon: 'pi pi-moon' },
  lemari: { label: 'Lemari', icon: 'pi pi-box' },
}

export function fasilitasInfo(slug: string): FasilitasInfo {
  return (
    MAP[slug] ?? {
      label: slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: 'pi pi-check-circle',
    }
  )
}
