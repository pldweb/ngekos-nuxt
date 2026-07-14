export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  const token = localStorage.getItem('token')
  if (token) {
    auth.setToken(token)
    await auth.fetchMe()
    // Muat branding (logo kos -> favicon) untuk user yang sudah login.
    useBrandStore().load()
  }
})
