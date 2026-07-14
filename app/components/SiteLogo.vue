<script setup lang="ts">
withDefaults(defineProps<{ height?: number }>(), { height: 40 })
const { logoUrl } = useSiteBrand()
const FALLBACK = '/logo-ngekoskuy.png'
const src = computed(() => logoUrl.value || FALLBACK)
</script>

<template>
  <img
    :src="src"
    alt="Ngekoskuy"
    class="site-logo"
    :style="{ height: height + 'px' }"
  />
</template>

<style scoped>
.site-logo {
  width: auto;
  object-fit: contain;
  display: block;
}
</style>
