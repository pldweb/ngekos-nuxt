<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
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
    error.value = e?.data?.message || 'Registrasi gagal.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <template #title>Daftar</template>
    <template #content>
      <form @submit.prevent="submit" class="form">
        <InputText v-model="form.name" placeholder="Nama" />
        <InputText v-model="form.email" placeholder="Email" type="email" />
        <InputText v-model="form.phone" placeholder="No. HP (opsional)" />
        <Password v-model="form.password" placeholder="Password" :feedback="false" toggleMask />
        <Password v-model="form.password_confirmation" placeholder="Ulangi Password" :feedback="false" toggleMask />
        <Message v-if="error" severity="error">{{ error }}</Message>
        <Button type="submit" label="Daftar" :loading="loading" />
        <NuxtLink to="/login">Sudah punya akun? Masuk</NuxtLink>
      </form>
    </template>
  </Card>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 12px; }
</style>
