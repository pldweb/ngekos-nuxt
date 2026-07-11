// Guard global: jalan di setiap navigasi.
// - Rute publik (login/register/otp + halaman verifikasi QR) dilewati.
// - Tanpa token -> selalu diarahkan ke /login.
// - Sudah login -> pilih layout sesuai peran:
//     admin (pengelola/super_admin) => tampilan desktop ('admin')
//     selain itu (penghuni)          => tampilan mobile ('default')
const PUBLIC_ROUTES = ['/login', '/register', '/otp']

export default defineNuxtRouteMiddleware((to) => {
  const isPublic =
    PUBLIC_ROUTES.includes(to.path) || to.path.startsWith('/verifikasi')
  if (isPublic) return

  const token = import.meta.client ? localStorage.getItem('token') : null
  if (!token) {
    return navigateTo('/login')
  }

  const auth = useAuthStore()
  setPageLayout(auth.isAdmin ? 'admin' : 'default')
})
