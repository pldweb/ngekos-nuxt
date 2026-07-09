<script setup lang="ts">
defineProps<{ icon: string; title: string; description?: string }>()
</script>

<template>
  <div class="empty">
    <span class="empty__ic"><i :class="icon" /></span>
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="description" class="empty__text">{{ description }}</p>
    <div v-if="$slots.default" class="empty__action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.empty__ic {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: var(--surface-2);
  color: var(--sand);
  font-size: 26px;
  margin-bottom: 16px;
}
.empty__title { margin: 0; font-size: 16px; font-weight: 600; color: var(--ink); }
.empty__text {
  margin: 7px 0 0;
  font-size: 13.5px;
  color: var(--ink-soft);
  line-height: 1.55;
  max-width: 280px;
}
.empty__action { margin-top: 18px; }
</style>
