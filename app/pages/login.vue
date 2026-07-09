<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })
const auth = useAuthStore()
const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.email, form.password)
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || 'Login gagal. Coba lagi.'
  } finally {
    loading.value = false
  }
}
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

    <p class="nk-linkrow">Belum punya akun? <NuxtLink to="/register">Daftar</NuxtLink></p>
  </div>
</template>
