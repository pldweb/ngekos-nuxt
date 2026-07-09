<script setup lang="ts">
const api = useApi()
const status = ref<string>('memeriksa...')

onMounted(async () => {
  try {
    const res = await api<{ status: string; app: string }>('/health')
    status.value = `${res.app}: ${res.status}`
  } catch {
    status.value = 'gagal terhubung ke API'
  }
})
</script>

<template>
  <div>
    <Card>
      <template #title>Status Sistem</template>
      <template #content>
        <p>Koneksi API: <strong>{{ status }}</strong></p>
      </template>
    </Card>
  </div>
</template>
