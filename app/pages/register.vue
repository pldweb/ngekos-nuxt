<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })
const auth = useAuthStore()
const form = reactive({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(form)
    await navigateTo(`/otp?email=${encodeURIComponent(form.email)}`)
  } catch (e: any) {
    error.value = e?.data?.message || 'Registrasi gagal. Periksa data Anda.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="nk-card">
    <h1 class="nk-card__title">Buat akun</h1>
    <p class="nk-card__sub">Daftar sekali, kelola semua urusan kos dari sini.</p>

    <form class="nk-form" @submit.prevent="submit">
      <div>
        <label class="nk-label" for="name">Nama lengkap</label>
        <div class="nk-field">
          <i class="pi pi-user nk-field__icon" />
          <InputText id="name" v-model="form.name" placeholder="Nama kamu" autocomplete="name" />
        </div>
      </div>

      <div>
        <label class="nk-label" for="email">Email</label>
        <div class="nk-field">
          <i class="pi pi-envelope nk-field__icon" />
          <InputText id="email" v-model="form.email" type="email" placeholder="nama@email.com" autocomplete="email" />
        </div>
      </div>

      <div>
        <label class="nk-label" for="phone">No. HP <span class="nk-opt">(opsional)</span></label>
        <div class="nk-field">
          <i class="pi pi-phone nk-field__icon" />
          <InputText id="phone" v-model="form.phone" placeholder="08xxxxxxxxxx" inputmode="tel" autocomplete="tel" />
        </div>
      </div>

      <div>
        <label class="nk-label" for="password">Password</label>
        <div class="nk-field">
          <i class="pi pi-lock nk-field__icon" />
          <Password input-id="password" v-model="form.password" placeholder="Minimal 8 karakter" :feedback="false" toggle-mask />
        </div>
      </div>

      <div>
        <label class="nk-label" for="password2">Ulangi password</label>
        <div class="nk-field">
          <i class="pi pi-lock nk-field__icon" />
          <Password input-id="password2" v-model="form.password_confirmation" placeholder="Ketik ulang password" :feedback="false" toggle-mask />
        </div>
      </div>

      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <Button class="nk-cta" type="submit" label="Daftar" :loading="loading" />
    </form>

    <p class="nk-linkrow">Sudah punya akun? <NuxtLink to="/login">Masuk</NuxtLink></p>
  </div>
</template>

<style scoped>
.nk-opt { color: var(--ink-soft); font-weight: 400; }
</style>
