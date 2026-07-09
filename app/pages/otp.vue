<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })
const auth = useAuthStore()
const route = useRoute()
const email = ref((route.query.email as string) || '')
const code = ref('')
const error = ref('')
const info = ref('')
const loading = ref(false)
const resending = ref(false)

async function verify() {
  error.value = ''
  info.value = ''
  loading.value = true
  try {
    await auth.verifyOtp(email.value, code.value)
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || 'Kode salah atau kedaluwarsa.'
  } finally {
    loading.value = false
  }
}

async function resend() {
  error.value = ''
  info.value = ''
  resending.value = true
  try {
    await auth.requestOtp(email.value)
    info.value = 'Kode baru sudah dikirim ke email kamu.'
  } catch {
    error.value = 'Gagal mengirim ulang kode.'
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="nk-card">
    <span class="otp-badge"><i class="pi pi-envelope" /></span>
    <h1 class="nk-card__title">Verifikasi email</h1>
    <p class="nk-card__sub">
      Masukkan 6 digit kode yang kami kirim ke
      <strong class="otp-email">{{ email || 'email kamu' }}</strong>.
    </p>

    <form class="nk-form" @submit.prevent="verify">
      <div v-if="!email.length">
        <label class="nk-label" for="email">Email</label>
        <div class="nk-field">
          <i class="pi pi-envelope nk-field__icon" />
          <InputText id="email" v-model="email" type="email" placeholder="nama@email.com" />
        </div>
      </div>

      <div>
        <label class="nk-label" for="code">Kode OTP</label>
        <InputText id="code" v-model="code" class="otp-code" placeholder="000000" inputmode="numeric" maxlength="6" />
      </div>

      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
      <Message v-if="info" severity="success" :closable="false">{{ info }}</Message>

      <Button class="nk-cta" type="submit" label="Verifikasi" :loading="loading" />
    </form>

    <p class="nk-linkrow">
      Tidak menerima kode?
      <a href="#" @click.prevent="resend">{{ resending ? 'Mengirim…' : 'Kirim ulang' }}</a>
    </p>
  </div>
</template>

<style scoped>
.otp-badge {
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
.otp-email { color: var(--ink); }
.otp-code {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.4em;
  padding: 0.7rem 0;
  color: var(--brand);
}
.otp-code::placeholder { letter-spacing: 0.4em; color: #d7d2cb; }
</style>
