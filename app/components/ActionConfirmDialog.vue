<script setup lang="ts">
import type { ActionConfirm } from '~/composables/useActionConfirm'

defineProps<{
  visible: boolean
  action: ActionConfirm | null
  loading?: boolean
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="action?.title ?? 'Konfirmasi aksi'"
    :style="{ width: '92vw', maxWidth: '440px' }"
    @update:visible="(value) => { if (!value) emit('cancel') }"
  >
    <p class="confirm-text">{{ action?.message }}</p>
    <template #footer>
      <Button label="Batal" text :disabled="loading" @click="emit('cancel')" />
      <Button
        :label="action?.confirmLabel ?? 'Lanjutkan'"
        :severity="action?.severity"
        :loading="loading"
        @click="emit('confirm')"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.confirm-text { margin: 0; color: var(--ink); line-height: 1.55; }
</style>
