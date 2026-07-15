<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })
const auth = useAuthStore()
const config = useRuntimeConfig()
const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.email, form.password)
    await navigateTo(auth.isAdmin ? '/admin' : '/home')
  } catch (e: any) {
    error.value = e?.data?.message || 'Login gagal. Coba lagi.'
  } finally {
    loading.value = false
  }
}

/* ---------- Login dengan Google (khusus halaman ini) ---------- */
const googleClientId = config.public.googleClientId as string
const googleError = ref('')
const googleBtn = ref<HTMLElement | null>(null)

async function handleCredential(response: { credential: string }) {
  googleError.value = ''
  try {
    await auth.loginWithGoogle(response.credential)
    await navigateTo(auth.isAdmin ? '/admin' : '/home')
  } catch (e: any) {
    googleError.value = e?.data?.message || 'Login Google gagal.'
  }
}

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any
    if (w.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('load-failed'))
    document.head.appendChild(s)
  })
}

onMounted(async () => {
  if (!import.meta.client || !googleClientId) return
  try {
    await loadGis()
    const w = window as any
    w.google.accounts.id.initialize({ client_id: googleClientId, callback: handleCredential })
    if (googleBtn.value) {
      w.google.accounts.id.renderButton(googleBtn.value, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        locale: 'id',
        width: 300,
      })
    }
  } catch {
    googleError.value = 'Gagal memuat Google. Coba lagi.'
  }
})
</script>

<template>
  <div class="nk-card">
    <h1 class="nk-card__title">Masuk</h1>
    <p class="nk-card__sub">Selamat datang kembali. Yuk lanjut urus kosmu.</p>

    <form class="nk-form" @submit.prevent="submit">
      <div>
        <label class="nk-label" for="email">Email</label>
        <div class="nk-field">
          <i class="pi pi-envelope nk-field__icon" />
          <InputText id="email" v-model="form.email" type="email" placeholder="nama@email.com" autocomplete="email" />
        </div>
      </div>

      <div>
        <label class="nk-label" for="password">Password</label>
        <div class="nk-field">
          <i class="pi pi-lock nk-field__icon" />
          <Password input-id="password" v-model="form.password" placeholder="Masukkan password" :feedback="false" toggle-mask />
        </div>
      </div>

      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <Button class="nk-cta" type="submit" label="Masuk" :loading="loading" />
    </form>

    <div class="g-sep"><span>atau</span></div>

    <div class="g-wrap">
      <div v-if="googleClientId" ref="googleBtn" class="g-btn" />
      <Button
        v-else
        class="g-fallback"
        icon="pi pi-google"
        label="Masuk dengan Google"
        severity="secondary"
        outlined
        disabled
      />
      <small v-if="!googleClientId" class="g-note">Login Google belum dikonfigurasi.</small>
      <Message v-if="googleError" severity="error" :closable="false">{{ googleError }}</Message>
    </div>

    <p class="nk-linkrow mt-10">Belum punya akun? <NuxtLink to="/register">Daftar</NuxtLink></p>
  </div>
</template>

<style scoped>
.g-sep {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 14px;
  color: var(--ink-soft);
  font-size: 12.5px;
}
.g-sep::before,
.g-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}
.g-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.g-btn { min-height: 40px; display: flex; justify-content: center; }
.g-fallback { width: 100%; }
.g-note { color: var(--ink-soft); font-size: 12px; }
</style>
