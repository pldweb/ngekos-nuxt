<script setup lang="ts">
const auth = useAuthStore()
const api = useApi()

const pop = ref()
const initial = computed(() => (auth.user?.name?.trim()?.[0] ?? '?').toUpperCase())
const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? 'Akun')
const roleLabel = computed(() => {
  const r = auth.user?.roles?.[0] ?? ''
  return { super_admin: 'Super Admin', pengelola: 'Pengelola', penghuni: 'Penghuni' }[r] ?? r
})

function toggle(e: Event) {
  pop.value?.toggle(e)
}

/* ---------- Edit profil ---------- */
const editOpen = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const form = reactive({ name: '', phone: '', password: '', password_confirmation: '' })
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

function openEdit() {
  form.name = auth.user?.name ?? ''
  form.phone = auth.user?.phone ?? ''
  form.password = ''
  form.password_confirmation = ''
  avatarFile.value = null
  avatarPreview.value = null
  saveError.value = null
  pop.value?.hide()
  editOpen.value = true
}

function onAvatar(file: File, preview: string) {
  avatarFile.value = file
  avatarPreview.value = preview
}

async function saveProfile() {
  saving.value = true
  saveError.value = null
  try {
    const fd = new FormData()
    fd.append('_method', 'PUT') // method spoofing agar file terkirim di multipart
    fd.append('name', form.name)
    fd.append('phone', form.phone ?? '')
    if (avatarFile.value) fd.append('avatar', avatarFile.value)
    if (form.password) {
      fd.append('password', form.password)
      fd.append('password_confirmation', form.password_confirmation)
    }
    const res = await api<{ user: any }>('/auth/profile', { method: 'POST', body: fd })
    auth.user = res.user
    editOpen.value = false
  } catch (e: any) {
    saveError.value =
      e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal menyimpan profil.'
  } finally {
    saving.value = false
  }
}

/* ---------- Logout dengan konfirmasi ---------- */
const logoutOpen = ref(false)
const loggingOut = ref(false)

function openLogout() {
  pop.value?.hide()
  logoutOpen.value = true
}
async function confirmLogout() {
  loggingOut.value = true
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="pm">
    <button class="pm__chip" type="button" aria-label="Menu profil" @click="toggle">
      <span class="pm__avatar">{{ initial }}</span>
      <span class="pm__name">{{ firstName }}</span>
      <i class="pi pi-angle-down pm__caret" />
    </button>

    <Popover ref="pop">
      <div class="pop">
        <div class="pop__head">
          <span class="pop__avatar">{{ initial }}</span>
          <div class="pop__meta">
            <p class="pop__name">{{ auth.user?.name }}</p>
            <p class="pop__email">{{ auth.user?.email }}</p>
            <span class="pop__role">{{ roleLabel }}</span>
          </div>
        </div>
        <div class="pop__actions">
          <button class="pop__item" type="button" @click="openEdit">
            <i class="pi pi-user-edit" /> Edit profil
          </button>
          <button class="pop__item pop__item--danger" type="button" @click="openLogout">
            <i class="pi pi-sign-out" /> Keluar
          </button>
        </div>
      </div>
    </Popover>

    <!-- Dialog edit profil -->
    <Dialog v-model:visible="editOpen" modal header="Edit profil" :style="{ width: '92vw', maxWidth: '440px' }">
      <div class="ef">
        <div class="ef__avatar">
          <ImagePicker :model-value="avatarPreview" label="Foto" rounded @select="onAvatar" />
          <p class="ef__hint">Klik untuk mengganti foto profil</p>
        </div>
        <div class="ef__field">
          <label class="nk-label">Nama</label>
          <InputText v-model="form.name" class="w-full" />
        </div>
        <div class="ef__field">
          <label class="nk-label">Nomor HP</label>
          <InputText v-model="form.phone" class="w-full" placeholder="08…" />
        </div>
        <div class="ef__field">
          <label class="nk-label">Password baru <span class="ef__opt">(opsional)</span></label>
          <Password v-model="form.password" :feedback="false" toggle-mask fluid />
        </div>
        <div v-if="form.password" class="ef__field">
          <label class="nk-label">Ulangi password baru</label>
          <Password v-model="form.password_confirmation" :feedback="false" toggle-mask fluid />
        </div>
        <Message v-if="saveError" severity="error">{{ saveError }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="editOpen = false" />
        <Button label="Simpan" icon="pi pi-check" :loading="saving" @click="saveProfile" />
      </template>
    </Dialog>

    <!-- Konfirmasi logout -->
    <Dialog v-model:visible="logoutOpen" modal header="Keluar dari akun?" :style="{ width: '90vw', maxWidth: '360px' }">
      <p class="lo">Kamu akan keluar dari sesi ini dan perlu login kembali.</p>
      <template #footer>
        <Button label="Batal" text @click="logoutOpen = false" />
        <Button label="Keluar" icon="pi pi-sign-out" severity="danger" :loading="loggingOut" @click="confirmLogout" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.pm__chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 10px 5px 5px;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pm__chip:hover { border-color: var(--sand); box-shadow: var(--shadow); }
.pm__avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand);
  color: var(--sand);
  font-weight: 700;
  font-size: 13px;
}
.pm__name { font-size: 14px; font-weight: 600; color: var(--ink); }
.pm__caret { font-size: 12px; color: var(--ink-soft); }

.pop { width: 250px; }
.pop__head { display: flex; gap: 12px; padding: 4px 4px 14px; border-bottom: 1px solid var(--line); }
.pop__avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand);
  color: var(--sand);
  font-weight: 700;
  font-size: 17px;
}
.pop__meta { min-width: 0; }
.pop__name { margin: 0; font-size: 14px; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pop__email { margin: 2px 0 0; font-size: 12px; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pop__role {
  display: inline-block;
  margin-top: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--brand);
  background: var(--sand-soft);
  padding: 2px 9px;
  border-radius: 999px;
}
.pop__actions { display: flex; flex-direction: column; padding-top: 8px; }
.pop__item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 8px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.12s;
}
.pop__item:hover { background: var(--surface-2); }
.pop__item i { font-size: 15px; color: var(--ink-soft); }
.pop__item--danger { color: var(--danger); }
.pop__item--danger:hover { background: #fdecea; }
.pop__item--danger i { color: var(--danger); }

.ef { display: flex; flex-direction: column; gap: 14px; }
.ef__avatar { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ef__hint { margin: 0; font-size: 12px; color: var(--ink-soft); }
.ef__field { display: flex; flex-direction: column; }
.ef__opt { font-weight: 400; color: var(--ink-soft); }
.w-full { width: 100%; }
.lo { margin: 0; font-size: 14px; color: var(--ink-soft); line-height: 1.55; }
</style>
