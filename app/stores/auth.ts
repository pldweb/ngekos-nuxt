import { defineStore } from 'pinia'

interface AuthUser {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  avatar_url: string | null
  email_verified: boolean
  created_at: string | null
  roles: string[]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    token: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) =>
      (state.user?.roles ?? []).some((r) => r === 'pengelola' || r === 'super_admin'),
    isSuperAdmin: (state) => (state.user?.roles ?? []).includes('super_admin'),
  },
  actions: {
    setToken(token: string | null) {
      this.token = token
      if (import.meta.client) {
        if (token) localStorage.setItem('token', token)
        else localStorage.removeItem('token')
      }
    },
    async register(payload: {
      name: string; email: string; phone?: string
      password: string; password_confirmation: string
    }) {
      const api = useApi()
      return await api('/auth/register', { method: 'POST', body: payload })
    },
    async requestOtp(email: string) {
      const api = useApi()
      return await api('/auth/otp/request', { method: 'POST', body: { email } })
    },
    async verifyOtp(email: string, code: string) {
      const api = useApi()
      const res = await api<{ token: string; user: AuthUser }>('/auth/otp/verify', {
        method: 'POST', body: { email, code },
      })
      this.setToken(res.token)
      this.user = res.user
      return res
    },
    async loginWithGoogle(idToken: string) {
      const api = useApi()
      const res = await api<{ token: string; user: AuthUser }>('/auth/google', {
        method: 'POST', body: { id_token: idToken },
      })
      this.setToken(res.token)
      this.user = res.user
      return res
    },
    async login(email: string, password: string) {
      const api = useApi()
      const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST', body: { email, password },
      })
      this.setToken(res.token)
      this.user = res.user
      return res
    },
    async updateProfile(payload: {
      name?: string; phone?: string | null
      password?: string; password_confirmation?: string
      avatar?: File | null
    }) {
      const api = useApi()
      let res: { user: AuthUser }
      if (payload.avatar) {
        // File upload: FormData + method spoofing (PHP tak isi $_FILES di PUT).
        const fd = new FormData()
        fd.append('_method', 'PUT')
        if (payload.name != null) fd.append('name', payload.name)
        if (payload.phone != null) fd.append('phone', payload.phone)
        if (payload.password) {
          fd.append('password', payload.password)
          fd.append('password_confirmation', payload.password_confirmation ?? '')
        }
        fd.append('avatar', payload.avatar)
        res = await api<{ user: AuthUser }>('/auth/profile', { method: 'POST', body: fd })
      } else {
        const { avatar, ...body } = payload
        res = await api<{ user: AuthUser }>('/auth/profile', { method: 'PUT', body })
      }
      this.user = res.user
      return res
    },
    async fetchMe() {
      const api = useApi()
      try {
        const res = await api<{ user: AuthUser }>('/auth/me')
        this.user = res.user
      } catch {
        this.setToken(null)
        this.user = null
      }
    },
    async logout() {
      const api = useApi()
      try { await api('/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
      this.setToken(null)
      this.user = null
    },
  },
})
