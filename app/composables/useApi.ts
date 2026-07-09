export function useApi() {
  const config = useRuntimeConfig()

  return $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      const token = import.meta.client ? localStorage.getItem('token') : null
      options.headers = new Headers(options.headers)
      if (token) {
        options.headers.set('Authorization', `Bearer ${token}`)
      }
      options.headers.set('Accept', 'application/json')
    },
  })
}
