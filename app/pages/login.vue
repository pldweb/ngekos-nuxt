<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
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
    error.value = e?.data?.message || 'Login gagal.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <template #title>Masuk</template>
    <template #content>
      <form @submit.prevent="submit" class="form">
        <InputText v-model="form.email" placeholder="Email" type="email" />
        <Password v-model="form.password" placeholder="Password" :feedback="false" toggleMask />
        <Message v-if="error" severity="error">{{ error }}</Message>
        <Button type="submit" label="Masuk" :loading="loading" />
        <NuxtLink to="/register">Belum punya akun? Daftar</NuxtLink>
      </form>
    </template>
  </Card>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 12px; }
</style>
