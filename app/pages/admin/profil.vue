<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const auth = useAuthStore()
const loading = ref(false)
const { confirmDialog, confirming, confirmAction, askConfirm, runConfirmedAction, cancelConfirmedAction } = useActionConfirm()

const initial = computed(() => (auth.user?.name?.trim()?.[0] ?? '?').toUpperCase())
const roleLabel = computed(() => {
  const r = auth.user?.roles?.[0] ?? ''
  return { super_admin: 'Super Admin', pengelola: 'Pengelola', penghuni: 'Penghuni' }[r] ?? r
})

function confirmLogout() {
  askConfirm({
    title: 'Keluar dari akun?',
    message: 'Sesi admin akan diakhiri dan kamu perlu login kembali.',
    confirmLabel: 'Keluar',
    severity: 'danger',
    run: doLogout,
  })
}

async function doLogout() {
  loading.value = true
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="nk-stack">
    <section class="prof nk-rise">
      <div class="prof__avatar">{{ initial }}</div>
      <h1 class="prof__name">{{ auth.user?.name || 'Memuat…' }}</h1>
      <p class="prof__email">{{ auth.user?.email }}</p>
      <span v-if="roleLabel" class="prof__badge">{{ roleLabel }}</span>
    </section>

    <section class="list">
      <div class="list__row">
        <span class="list__ic"><i class="pi pi-envelope" /></span>
        <div class="list__body">
          <p class="list__k">Email</p>
          <p class="list__v">{{ auth.user?.email || '-' }}</p>
        </div>
      </div>
      <div class="list__row">
        <span class="list__ic"><i class="pi pi-phone" /></span>
        <div class="list__body">
          <p class="list__k">No. HP</p>
          <p class="list__v">{{ auth.user?.phone || 'Belum diisi' }}</p>
        </div>
      </div>
      <div class="list__row">
        <span class="list__ic"><i class="pi pi-verified" /></span>
        <div class="list__body">
          <p class="list__k">Status email</p>
          <p class="list__v">
            <span v-if="auth.user?.email_verified" class="ok">Terverifikasi</span>
            <span v-else class="warn">Belum diverifikasi</span>
          </p>
        </div>
      </div>
    </section>

    <Button
      class="nk-cta"
      severity="danger"
      outlined
      icon="pi pi-sign-out"
      label="Keluar"
      :loading="loading"
      @click="confirmLogout"
    />
    <ActionConfirmDialog
      :visible="confirmDialog"
      :action="confirmAction"
      :loading="confirming"
      @cancel="cancelConfirmedAction"
      @confirm="runConfirmedAction"
    />
  </div>
</template>

<style scoped>
.prof {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.prof__avatar {
  width: 76px;
  height: 76px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--sand) 0%, #b89a7d 100%);
  color: var(--brand-strong);
  font-size: 32px;
  font-weight: 700;
  box-shadow: 0 10px 22px -12px rgba(70, 48, 31, 0.7);
}
.prof__name { margin: 14px 0 0; font-size: 20px; font-weight: 700; }
.prof__email { margin: 4px 0 0; font-size: 14px; color: var(--ink-soft); }
.prof__badge {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  background: var(--sand-soft);
  padding: 5px 12px;
  border-radius: 999px;
}

.list {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.list__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 18px;
}
.list__row + .list__row { border-top: 1px solid var(--line); }
.list__ic {
  width: 38px;
  height: 38px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--surface-2);
  color: var(--brand);
  font-size: 15px;
}
.list__body { min-width: 0; }
.list__k { margin: 0; font-size: 12px; color: var(--ink-soft); }
.list__v { margin: 2px 0 0; font-size: 14px; font-weight: 500; }
.ok { color: #2f9e6a; font-weight: 600; }
.warn { color: var(--honey); font-weight: 600; }
</style>
