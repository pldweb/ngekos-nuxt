<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Role = string
type RoleOption = { id?: number; name: string }
type UserRow = {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  email_verified: boolean
  roles: Role[]
}

const api = useApi()
const toast = useToast()
const { confirmDialog, confirming, confirmAction, askConfirm, runConfirmedAction, cancelConfirmedAction } = useActionConfirm()

const users = ref<UserRow[]>([])
const roles = ref<RoleOption[]>([
  { name: 'super_admin' },
  { name: 'pengelola' },
  { name: 'penghuni' },
])
const loading = ref(true)
const error = ref<string | null>(null)
const q = ref('')

const detail = ref<UserRow | null>(null)
const detailOpen = ref(false)
const formOpen = ref(false)
const formSubmitting = ref(false)
const formError = ref<string | null>(null)
const editing = ref<UserRow | null>(null)
const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  roles: [] as Role[],
})

const roleMeta: Record<string, { label: string; severity: string }> = {
  super_admin: { label: 'Super Admin', severity: 'danger' },
  pengelola: { label: 'Pengelola', severity: 'warn' },
  penghuni: { label: 'Penghuni', severity: 'info' },
}
const initials = (n: string) =>
  n.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
const roleLabel = (role: string) => roleMeta[role]?.label ?? role.replaceAll('_', ' ')

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return users.value
  return users.value.filter(
    (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
  )
})

function openDetail(u: UserRow) {
  detail.value = u
  detailOpen.value = true
}

function resetForm() {
  form.name = ''
  form.email = ''
  form.phone = ''
  form.password = ''
  form.roles = ['penghuni']
  formError.value = null
}

function openCreate() {
  editing.value = null
  resetForm()
  formOpen.value = true
}

function openEdit(u: UserRow) {
  editing.value = u
  form.name = u.name
  form.email = u.email
  form.phone = u.phone ?? ''
  form.password = ''
  form.roles = [...u.roles]
  formError.value = null
  formOpen.value = true
}

function confirmSubmitForm() {
  askConfirm({
    title: editing.value ? 'Simpan perubahan akun?' : 'Tambah akun?',
    message: editing.value ? `Akun ${form.name} akan diperbarui.` : `Akun ${form.name} akan dibuat.`,
    confirmLabel: 'Simpan',
    run: submitForm,
  })
}

async function submitForm() {
  formSubmitting.value = true
  formError.value = null
  try {
    const body: Record<string, any> = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      roles: form.roles,
    }
    if (form.password) body.password = form.password
    const url = editing.value ? `/users/${editing.value.id}` : '/users'
    const method = editing.value ? 'PUT' : 'POST'
    const res = await api<{ data: UserRow }>(url, { method, body })
    if (editing.value) {
      users.value = users.value.map((u) => (u.id === res.data.id ? res.data : u))
      if (detail.value?.id === res.data.id) detail.value = res.data
    } else {
      users.value = [res.data, ...users.value]
    }
    formOpen.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: editing.value ? 'Akun diperbarui.' : 'Akun ditambahkan.', life: 3000 })
  } catch (e: any) {
    formError.value = e?.data?.message ?? 'Gagal menyimpan akun.'
    toast.add({ severity: 'error', summary: 'Gagal', detail: formError.value, life: 4000 })
  } finally {
    formSubmitting.value = false
  }
}

async function loadRoles() {
  try {
    const res = await api<{ data: RoleOption[] }>('/roles')
    roles.value = res.data.length ? res.data : roles.value
  } catch {
    // Pengelola masih boleh melihat pengguna, tetapi hanya super admin yang mendapat daftar role lengkap.
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api<{ data: UserRow[] }>('/users')
    users.value = res.data
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat data pengguna.'
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  await Promise.all([load(), loadRoles()])
})
</script>

<template>
  <div class="nk-stack">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="nk-pagehead__title">Pengguna</h1>
        <p class="nk-pagehead__sub">Seluruh akun terdaftar di sistem.</p>
      </div>
      <div class="usr__tools">
        <IconField class="usr__search">
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Cari nama / email" />
        </IconField>
        <Button label="Tambah akun" icon="pi pi-plus" @click="openCreate" />
      </div>
    </header>

    <p v-if="loading" class="nk-muted">Memuat pengguna…</p>

    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-triangle"
      title="Gagal memuat"
      :description="error"
    >
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <EmptyState
      v-else-if="filtered.length === 0"
      icon="pi pi-id-card"
      title="Tidak ada pengguna"
      description="Belum ada akun yang cocok dengan pencarian."
    />

    <div v-else class="usr__wrap">
      <table class="usr">
        <thead>
          <tr>
            <th>Nama</th>
            <th class="usr__hide-sm">Kontak</th>
            <th>Peran</th>
            <th class="usr__hide-sm">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
            <td>
              <div class="flex items-center gap-3">
                <span class="usr__avatar">{{ initials(u.name) }}</span>
                <div class="min-w-0">
                  <p class="usr__name">{{ u.name }}</p>
                  <p class="usr__email usr__show-sm">{{ u.email }}</p>
                </div>
              </div>
            </td>
            <td class="usr__hide-sm">
              <p class="usr__email">{{ u.email }}</p>
              <p class="usr__phone">{{ u.phone ?? '—' }}</p>
            </td>
            <td>
              <div class="flex flex-wrap gap-1">
                <Tag
                  v-for="r in u.roles"
                  :key="r"
                  :value="roleMeta[r]?.label ?? r"
                  :severity="roleMeta[r]?.severity"
                />
              </div>
            </td>
            <td class="usr__hide-sm">
              <Tag
                :value="u.email_verified ? 'Terverifikasi' : 'Belum'"
                :severity="u.email_verified ? 'success' : 'secondary'"
              />
            </td>
            <td class="text-right">
              <div class="usr__row-actions">
                <Button label="Detail" icon="pi pi-arrow-up-right" size="small" text @click="openDetail(u)" />
                <Button label="Edit" icon="pi pi-pencil" size="small" text @click="openEdit(u)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Dialog v-model:visible="formOpen" modal :header="editing ? 'Edit akun' : 'Tambah akun'" :style="{ width: '92vw', maxWidth: '520px' }">
      <form class="usrform" @submit.prevent="confirmSubmitForm">
        <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>
        <div class="usrform__grid">
          <div class="field">
            <label for="name">Nama</label>
            <InputText id="name" v-model="form.name" required />
          </div>
          <div class="field">
            <label for="email">Email</label>
            <InputText id="email" v-model="form.email" type="email" required />
          </div>
          <div class="field">
            <label for="phone">Nomor HP</label>
            <InputText id="phone" v-model="form.phone" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <InputText
              id="password"
              v-model="form.password"
              type="password"
              :required="!editing"
              :placeholder="editing ? 'Kosongkan jika tidak diganti' : ''"
            />
          </div>
        </div>
        <div class="field">
          <label>Role</label>
          <div class="usrform__roles">
            <label v-for="r in roles" :key="r.name" class="usrform__role">
              <Checkbox v-model="form.roles" :input-id="`role-${r.name}`" :value="r.name" />
              <span>{{ roleLabel(r.name) }}</span>
            </label>
          </div>
        </div>
        <div class="usrform__actions">
          <Button type="button" label="Batal" text @click="formOpen = false" />
          <Button type="submit" label="Simpan" icon="pi pi-save" :loading="formSubmitting" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="detailOpen" modal header="Detail pengguna" :style="{ width: '92vw', maxWidth: '420px' }">
      <div v-if="detail" class="det">
        <div class="det__head">
          <span class="det__avatar">{{ initials(detail.name) }}</span>
          <div>
            <p class="det__name">{{ detail.name }}</p>
            <div class="flex flex-wrap gap-1 mt-1">
              <Tag
                v-for="r in detail.roles"
                :key="r"
                :value="roleMeta[r]?.label ?? r"
                :severity="roleMeta[r]?.severity"
              />
            </div>
          </div>
        </div>
        <dl class="det__list">
          <div class="det__row"><dt>Email</dt><dd>{{ detail.email }}</dd></div>
          <div class="det__row"><dt>Nomor HP</dt><dd>{{ detail.phone ?? '—' }}</dd></div>
          <div class="det__row">
            <dt>Status email</dt>
            <dd>
              <Tag
                :value="detail.email_verified ? 'Terverifikasi' : 'Belum diverifikasi'"
                :severity="detail.email_verified ? 'success' : 'secondary'"
              />
            </dd>
          </div>
          <div class="det__row"><dt>ID</dt><dd>#{{ detail.id }}</dd></div>
        </dl>
      </div>
      <template #footer>
        <Button label="Tutup" text @click="detailOpen = false" />
      </template>
    </Dialog>
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
.usr__tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; }
.usr__search :deep(.p-inputtext) { min-width: 220px; }
.usr__row-actions { display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px; }

.usr__wrap {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.usr { width: 100%; border-collapse: collapse; }
.usr thead th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
  padding: 13px 18px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-2);
}
.usr tbody td { padding: 13px 18px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.usr tbody tr:last-child td { border-bottom: 0; }
.usr tbody tr:hover { background: var(--surface-2); }
.usr__avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--sand-soft);
  color: var(--brand);
  font-weight: 700;
  font-size: 13px;
}
.usr__name { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.usr__email { margin: 0; font-size: 13px; color: var(--ink); }
.usr__phone { margin: 3px 0 0; font-size: 12.5px; color: var(--ink-soft); }
.usr__show-sm { display: none; }

.det { display: flex; flex-direction: column; gap: 16px; }
.det__head { display: flex; align-items: center; gap: 14px; }
.det__avatar {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand);
  color: var(--sand);
  font-weight: 700;
  font-size: 20px;
}
.det__name { margin: 0; font-size: 17px; font-weight: 700; color: var(--ink); }
.det__list { margin: 0; display: flex; flex-direction: column; }
.det__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-top: 1px solid var(--line);
  font-size: 14px;
}
.det__row dt { color: var(--ink-soft); }
.det__row dd { margin: 0; color: var(--ink); font-weight: 500; text-align: right; }

.usrform { display: flex; flex-direction: column; gap: 16px; }
.usrform__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.usrform .field { display: flex; flex-direction: column; gap: 6px; }
.usrform label { font-size: 13px; font-weight: 600; color: var(--ink); }
.usrform__roles { display: flex; flex-wrap: wrap; gap: 10px; }
.usrform__role {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-2);
}
.usrform__role span { text-transform: capitalize; }
.usrform__actions { display: flex; justify-content: flex-end; gap: 8px; }

/* Mobile: sederhanakan tabel */
@container appview (max-width: 640px) {
  .usr__hide-sm { display: none; }
  .usr__show-sm { display: block; margin-top: 3px; font-size: 12.5px; color: var(--ink-soft); }
  .usr__tools { width: 100%; justify-content: stretch; }
  .usr__search, .usr__tools :deep(.p-inputtext), .usr__tools :deep(.p-button) { width: 100%; }
  .usr__row-actions { flex-direction: column; align-items: flex-end; }
  .usrform__grid { grid-template-columns: 1fr; }
}
</style>
