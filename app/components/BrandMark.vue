<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
</script>

<template>
  <div class="brand" :class="`brand--${size}`">
    <span class="brand__plate" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="9" r="4.2" />
        <path d="M12 12l6.5 6.5" />
        <path d="M16.2 16.2l2.1-2.1" />
        <path d="M18.7 18.7l1.6-1.6" />
      </svg>
    </span>
    <span class="brand__word">Ngekos<span>Kuy</span></span>
  </div>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.brand__plate {
  display: grid;
  place-items: center;
  background: var(--brand);
  color: var(--sand);
  border-radius: 12px;
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.14),
    0 6px 14px -6px rgba(70, 48, 31, 0.6);
}
.brand__word {
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
  line-height: 1;
}
.brand__word span { color: var(--brand); }

/* sizes */
.brand--sm .brand__plate { width: 34px; height: 34px; }
.brand--sm .brand__plate svg { width: 17px; height: 17px; }
.brand--sm .brand__word { font-size: 19px; }

.brand--md .brand__plate { width: 40px; height: 40px; }
.brand--md .brand__plate svg { width: 20px; height: 20px; }
.brand--md .brand__word { font-size: 22px; }

.brand--lg .brand__plate { width: 52px; height: 52px; border-radius: 15px; }
.brand--lg .brand__plate svg { width: 26px; height: 26px; }
.brand--lg .brand__word { font-size: 27px; }
</style>
