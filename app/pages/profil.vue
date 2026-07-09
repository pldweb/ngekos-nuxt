<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const auth = useAuthStore()

async function doLogout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <Card>
    <template #title>Profil</template>
    <template #content>
      <div v-if="auth.user" class="profil">
        <p><strong>{{ auth.user.name }}</strong></p>
        <p>{{ auth.user.email }}</p>
        <p>Role: {{ auth.user.roles.join(', ') }}</p>
        <Button label="Keluar" severity="danger" @click="doLogout" />
      </div>
      <p v-else>Memuat…</p>
    </template>
  </Card>
</template>

<style scoped>
.profil { display: flex; flex-direction: column; gap: 8px; }
</style>
