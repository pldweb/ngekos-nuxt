export default defineNuxtRouteMiddleware(() => {
  const token = import.meta.client ? localStorage.getItem('token') : null
  if (token) {
    const auth = useAuthStore()
    return navigateTo(auth.isAdmin ? '/admin' : '/home')
  }
})
