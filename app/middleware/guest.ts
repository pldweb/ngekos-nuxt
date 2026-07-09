export default defineNuxtRouteMiddleware(() => {
  const token = import.meta.client ? localStorage.getItem('token') : null
  if (token) {
    return navigateTo('/')
  }
})
