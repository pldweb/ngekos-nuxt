<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })
useHead({ title: 'Lupa Password — Ngekoskuy' })

const api = useApi()
const route = useRoute()

const step = ref<'email' | 'reset'>('email')
const email = ref((route.query.email as string) || '')
const code = ref('')
const password = ref('')
const passwordConfirm = ref('')

const loading = ref(false)
const resending = ref(false)
const error = ref('')
const info = ref('')

async function requestOtp() {
  error.value = ''
  info.value = ''
  loading.value = true
  try {
    await api('/auth/password/forgot', { method: 'POST', body: { email: email.value } })
    step.value = 'reset'
    info.value = 'Jika email terdaftar, kode OTP sudah dikirim. Cek kotak masuk (dan spam).'
  } catch (e: any) {
    error.value = e?.data?.message || 'Gagal mengirim kode. Coba lagi.'
  } finally {
    loading.value = false
  }
}

async function resend() {
  error.value = ''
  info.value = ''
  resending.value = true
  try {
    await api('/auth/password/forgot', { method: 'POST', body: { email: email.value } })
    info.value = 'Kode baru sudah dikirim ke email kamu.'
  } catch {
    error.value = 'Gagal mengirim ulang kode.'
  } finally {
    resending.value = false
  }
}

async function reset() {
  error.value = ''
  info.value = ''
  if (password.value !== passwordConfirm.value) {
    error.value = 'Konfirmasi password tidak cocok.'
    return
  }
  loading.value = true
  try {
    await api('/auth/password/reset', {
      method: 'POST',
      body: {
        email: email.value,
        code: code.value,
        password: password.value,
        password_confirmation: passwordConfirm.value,
      },
    })
    await navigateTo({ path: '/login', query: { reset: '1' } })
  } catch (e: any) {
    error.value = e?.data?.message || 'Gagal mereset password. Periksa kode & coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="nk-card">
    <span class="lp-badge"><i class="pi pi-lock" /></span>

    <template v-if="step === 'email'">
      <h1 class="nk-card__title">Lupa password?</h1>
      <p class="nk-card__sub">
        Masukkan email akunmu. Kami kirim kode OTP untuk menyetel ulang password.
      </p>

      <form class="nk-form" @submit.prevent="requestOtp">
        <div>
          <label class="nk-label" for="email">Email</label>
          <div class="nk-field">
            <i class="pi pi-envelope nk-field__icon" />
            <InputText id="email" v-model="email" type="email" placeholder="nama@email.com" autocomplete="email" />
          </div>
        </div>

        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

        <Button class="nk-cta" type="submit" label="Kirim kode OTP" :loading="loading" />
      </form>
    </template>

    <template v-else>
      <h1 class="nk-card__title">Setel ulang password</h1>
      <p class="nk-card__sub">
        Masukkan kode OTP yang dikirim ke
        <strong class="lp-email">{{ email }}</strong> dan password barumu.
      </p>

      <form class="nk-form" @submit.prevent="reset">
        <div>
          <label class="nk-label" for="code">Kode OTP</label>
          <InputText id="code" v-model="code" class="lp-code" placeholder="000000" inputmode="numeric" maxlength="6" />
        </div>

        <div>
          <label class="nk-label" for="password">Password baru</label>
          <div class="nk-field">
            <i class="pi pi-lock nk-field__icon" />
            <Password input-id="password" v-model="password" placeholder="Minimal 8 karakter" :feedback="false" toggle-mask />
          </div>
        </div>

        <div>
          <label class="nk-label" for="password2">Ulangi password</label>
          <div class="nk-field">
            <i class="pi pi-lock nk-field__icon" />
            <Password input-id="password2" v-model="passwordConfirm" placeholder="Ulangi password baru" :feedback="false" toggle-mask />
          </div>
        </div>

        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="info" severity="success" :closable="false">{{ info }}</Message>

        <Button class="nk-cta" type="submit" label="Simpan password baru" :loading="loading" />
      </form>

      <p class="nk-linkrow">
        Tidak menerima kode?
        <a href="#" @click.prevent="resend">{{ resending ? 'Mengirim…' : 'Kirim ulang' }}</a>
      </p>
    </template>

    <p class="nk-linkrow mt-10">Ingat password? <NuxtLink to="/login">Masuk</NuxtLink></p>
  </div>
</template>

<style scoped>
.lp-badge {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 20px;
  margin-bottom: 14px;
}
.lp-email { color: var(--ink); }
.lp-code {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.4em;
  padding: 0.7rem 0;
  color: var(--brand);
}
.lp-code::placeholder { letter-spacing: 0.4em; color: #d7d2cb; }
</style>
