export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  const token = localStorage.getItem('token')
  if (token) {
    auth.setToken(token)
    await auth.fetchMe()
  }
})
