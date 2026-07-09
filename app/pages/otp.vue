<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
const auth = useAuthStore()
const route = useRoute()
const email = ref((route.query.email as string) || '')
const code = ref('')
const error = ref('')
const info = ref('')
const loading = ref(false)

async function verify() {
  error.value = ''
  loading.value = true
  try {
    await auth.verifyOtp(email.value, code.value)
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || 'Verifikasi gagal.'
  } finally {
    loading.value = false
  }
}

async function resend() {
  error.value = ''; info.value = ''
  try {
    await auth.requestOtp(email.value)
    info.value = 'Kode OTP dikirim ulang.'
  } catch {
    error.value = 'Gagal mengirim ulang.'
  }
}
</script>

<template>
  <Card>
    <template #title>Verifikasi OTP</template>
    <template #content>
      <form @submit.prevent="verify" class="form">
        <InputText v-model="email" placeholder="Email" type="email" />
        <InputText v-model="code" placeholder="Kode 6 digit" inputmode="numeric" />
        <Message v-if="error" severity="error">{{ error }}</Message>
        <Message v-if="info" severity="success">{{ info }}</Message>
        <Button type="submit" label="Verifikasi" :loading="loading" />
        <Button type="button" label="Kirim ulang kode" severity="secondary" text @click="resend" />
      </form>
    </template>
  </Card>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 12px; }
</style>
