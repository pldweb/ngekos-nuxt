<script setup lang="ts">
definePageMeta({ layout: 'penghuni', middleware: 'auth' })
const auth = useAuthStore()
const loading = ref(false)

const initial = computed(() => (auth.user?.name?.trim()?.[0] ?? '?').toUpperCase())
const roleLabel = computed(() => {
  const r = auth.user?.roles?.[0] ?? ''
  return { super_admin: 'Super Admin', pengelola: 'Pengelola', penghuni: 'Penghuni' }[r] ?? r
})
const avatarBust = ref(0)
const avatarSrc = computed(() =>
  auth.user?.avatar_url ? `${auth.user.avatar_url}${avatarBust.value ? `?t=${avatarBust.value}` : ''}` : null,
)
const bergabung = computed(() =>
  auth.user?.created_at
    ? new Date(auth.user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—',
)

/* ---------- Edit profil ---------- */
const editDialog = ref(false)
const saving = ref(false)
const editError = ref<string | null>(null)
const notice = ref<string | null>(null)
const form = reactive({ name: '', phone: '', password: '', password_confirmation: '' })
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

function onPickAvatar(file: File, previewUrl: string) {
  avatarFile.value = file
  avatarPreview.value = previewUrl
}

function openEdit() {
  form.name = auth.user?.name ?? ''
  form.phone = auth.user?.phone ?? ''
  form.password = ''
  form.password_confirmation = ''
  avatarFile.value = null
  avatarPreview.value = auth.user?.avatar_url ?? null
  editError.value = null
  editDialog.value = true
}

async function submitEdit() {
  editError.value = null
  if (!form.name.trim()) return (editError.value = 'Nama wajib diisi.')
  if (form.password) {
    if (form.password.length < 8) return (editError.value = 'Password minimal 8 karakter.')
    if (form.password !== form.password_confirmation)
      return (editError.value = 'Konfirmasi password tidak cocok.')
  }
  saving.value = true
  try {
    await auth.updateProfile({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      ...(form.password
        ? { password: form.password, password_confirmation: form.password_confirmation }
        : {}),
      ...(avatarFile.value ? { avatar: avatarFile.value } : {}),
    })
    if (avatarFile.value) avatarBust.value = Date.now()
    editDialog.value = false
    notice.value = 'Profil diperbarui.'
    setTimeout(() => (notice.value = null), 3000)
  } catch (e: any) {
    editError.value =
      e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal memperbarui profil.'
  } finally {
    saving.value = false
  }
}

const logoutDialog = ref(false)

async function doLogout() {
  loading.value = true
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="nk-stack">
    <Message v-if="notice" severity="success" :closable="false">{{ notice }}</Message>

    <section class="prof nk-rise">
      <div class="prof__avatar">
        <img v-if="avatarSrc" :src="avatarSrc" alt="Foto profil" />
        <span v-else>{{ initial }}</span>
      </div>
      <h1 class="prof__name">{{ auth.user?.name || 'Memuat…' }}</h1>
      <p class="prof__email">{{ auth.user?.email }}</p>
      <span v-if="roleLabel" class="prof__badge">{{ roleLabel }}</span>
      <Button
        class="prof__edit"
        label="Edit profil"
        icon="pi pi-pencil"
        size="small"
        outlined
        @click="openEdit"
      />
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
      <div class="list__row">
        <span class="list__ic"><i class="pi pi-calendar" /></span>
        <div class="list__body">
          <p class="list__k">Bergabung sejak</p>
          <p class="list__v">{{ bergabung }}</p>
        </div>
      </div>
    </section>

    <Button
      class="nk-cta"
      severity="danger"
      outlined
      icon="pi pi-sign-out"
      label="Keluar"
      @click="logoutDialog = true"
    />

    <Dialog v-model:visible="editDialog" modal header="Edit profil" :style="{ width: '92vw', maxWidth: '420px' }">
      <div class="nk-form">
        <div class="nk-field prof__pick">
          <ImagePicker
            :model-value="avatarPreview"
            label="Foto profil"
            rounded
            @select="onPickAvatar"
          />
        </div>
        <div class="nk-field">
          <label class="nk-label">Nama</label>
          <InputText v-model="form.name" class="w-full" placeholder="Nama lengkap" />
        </div>
        <div class="nk-field">
          <label class="nk-label">No. HP</label>
          <InputText v-model="form.phone" class="w-full" placeholder="08…" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Password baru <span class="opt">(opsional)</span></label>
          <Password v-model="form.password" class="w-full" input-class="w-full" toggle-mask :feedback="false" placeholder="Min. 8 karakter" />
        </div>
        <div class="nk-field">
          <label class="nk-label">Konfirmasi password baru</label>
          <Password v-model="form.password_confirmation" class="w-full" input-class="w-full" toggle-mask :feedback="false" placeholder="Ulangi password" />
        </div>
        <Message v-if="editError" severity="error" :closable="false">{{ editError }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="editDialog = false" />
        <Button label="Simpan" icon="pi pi-check" :loading="saving" @click="submitEdit" />
      </template>
    </Dialog>

    <Dialog v-model:visible="logoutDialog" modal header="Keluar akun" :style="{ width: '90vw', maxWidth: '380px' }">
      <p class="nk-muted">Yakin ingin keluar dari akun ini?</p>
      <template #footer>
        <Button label="Batal" text @click="logoutDialog = false" />
        <Button label="Keluar" severity="danger" icon="pi pi-sign-out" :loading="loading" @click="doLogout" />
      </template>
    </Dialog>
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
  overflow: hidden;
  background: linear-gradient(135deg, var(--sand) 0%, #b89a7d 100%);
  color: var(--brand-strong);
  font-size: 32px;
  font-weight: 700;
  box-shadow: 0 10px 22px -12px rgba(70, 48, 31, 0.7);
}
.prof__avatar img { width: 100%; height: 100%; object-fit: cover; }
.prof__pick { align-items: center; }
.opt { font-weight: 400; color: var(--ink-soft); }
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
.prof__edit { margin-top: 16px; }
.w-full { width: 100%; }

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
