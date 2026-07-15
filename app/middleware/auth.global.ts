// Guard global: jalan di setiap navigasi.
// - Halaman auth (login/register/otp) & verifikasi QR: dilewati, pakai layout sendiri.
// - Website publik (landing/cari-kos/detail kos): layout 'public', bisa diakses tanpa login.
// - Sisanya (aplikasi manajemen): tanpa token -> /login; pilih layout sesuai peran.
const AUTH_ROUTES = ['/login', '/register', '/otp']
const WEB_PUBLIC_ROUTES = ['/', '/cari-kos']

export default defineNuxtRouteMiddleware((to) => {
  // Halaman auth & verifikasi QR: biarkan layout masing-masing.
  if (AUTH_ROUTES.includes(to.path) || to.path.startsWith('/verifikasi')) return

  // Website publik: landing, daftar kos, detail kos.
  if (WEB_PUBLIC_ROUTES.includes(to.path) || to.path.startsWith('/kos/')) {
    setPageLayout('public')
    return
  }

  const token = import.meta.client ? localStorage.getItem('token') : null
  if (!token) {
    return navigateTo('/login')
  }

  const auth = useAuthStore()

  // Penghuni: area mereka di /home (bukan /admin). Cegah akses halaman admin.
  if (!auth.isAdmin) {
    if (to.path === '/admin' || to.path.startsWith('/admin/')) {
      return navigateTo('/home')
    }
    setPageLayout('penghuni')
    return
  }

  // Admin/pengelola: area /admin. Bila nyasar ke /home, arahkan ke dashboard.
  if (to.path === '/home' || to.path.startsWith('/home/')) {
    return navigateTo('/admin')
  }
  setPageLayout('admin')
})
