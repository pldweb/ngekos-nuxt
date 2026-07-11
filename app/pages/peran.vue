<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type RoleRow = {
  id: number
  name: string
  is_core: boolean
  locked: boolean
  permissions: string[]
}

const api = useApi()

const roles = ref<RoleRow[]>([])
const allPerms = ref<string[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const selectedId = ref<number | null>(null)
const draft = ref<string[]>([])
const saving = ref(false)
const saveMsg = ref<string | null>(null)
const saveErr = ref<string | null>(null)

const createOpen = ref(false)
const newRole = reactive({ name: '' })
const creating = ref(false)
const createErr = ref<string | null>(null)

/* ---------- Label helpers ---------- */
const groupLabels: Record<string, string> = {
  kos: 'Kos', room: 'Kamar', tenant: 'Penghuni', booking: 'Booking',
  invoice: 'Tagihan', installment: 'Cicilan', payment: 'Pembayaran',
  receipt: 'Kuitansi', expense: 'Pengeluaran', report: 'Laporan',
  setting: 'Pengaturan', short_stay: 'Kos Harian', complaint: 'Pengaduan',
  announcement: 'Pengumuman',
}
const actionLabels: Record<string, string> = {
  view: 'Lihat', create: 'Tambah', update: 'Ubah', delete: 'Hapus',
  verify: 'Verifikasi', approve: 'Setujui', generate: 'Buat', manage: 'Kelola',
}
function roleLabel(name: string) {
  return { super_admin: 'Super Admin', pengelola: 'Pengelola', penghuni: 'Penghuni' }[name]
    ?? name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function permParts(p: string) {
  const idx = p.lastIndexOf('.')
  const prefix = p.slice(0, idx)
  const action = p.slice(idx + 1)
  return { prefix, action, label: actionLabels[action] ?? action }
}

/* ---------- Grouped permission matrix ---------- */
const groupedPerms = computed(() => {
  const map = new Map<string, { key: string; label: string; items: { name: string; label: string }[] }>()
  for (const p of allPerms.value) {
    const { prefix, label } = permParts(p)
    if (!map.has(prefix)) {
      map.set(prefix, { key: prefix, label: groupLabels[prefix] ?? prefix, items: [] })
    }
    map.get(prefix)!.items.push({ name: p, label })
  }
  return [...map.values()]
})

const selectedRole = computed(() => roles.value.find((r) => r.id === selectedId.value) ?? null)
const dirty = computed(() => {
  const r = selectedRole.value
  if (!r) return false
  const a = [...draft.value].sort().join(',')
  const b = [...r.permissions].sort().join(',')
  return a !== b
})

function selectRole(r: RoleRow) {
  selectedId.value = r.id
  draft.value = [...r.permissions]
  saveMsg.value = null
  saveErr.value = null
}
function toggleGroup(items: { name: string }[], on: boolean) {
  const names = items.map((i) => i.name)
  if (on) draft.value = [...new Set([...draft.value, ...names])]
  else draft.value = draft.value.filter((p) => !names.includes(p))
}
function groupAllOn(items: { name: string }[]) {
  return items.every((i) => draft.value.includes(i.name))
}

async function save() {
  const r = selectedRole.value
  if (!r) return
  saving.value = true
  saveMsg.value = null
  saveErr.value = null
  try {
    const res = await api<{ role: RoleRow }>(`/roles/${r.id}/permissions`, {
      method: 'PUT',
      body: { permissions: draft.value },
    })
    r.permissions = res.role.permissions
    saveMsg.value = 'Hak akses tersimpan.'
  } catch (e: any) {
    saveErr.value = e?.data?.message ?? 'Gagal menyimpan hak akses.'
  } finally {
    saving.value = false
  }
}

async function createRole() {
  creating.value = true
  createErr.value = null
  try {
    const res = await api<{ role: RoleRow }>('/roles', {
      method: 'POST',
      body: { name: newRole.name.trim().toLowerCase().replace(/\s+/g, '_') },
    })
    roles.value.push(res.role)
    createOpen.value = false
    newRole.name = ''
    selectRole(res.role)
  } catch (e: any) {
    createErr.value =
      e?.data?.message ?? Object.values(e?.data?.errors ?? {})?.[0]?.[0] ?? 'Gagal membuat peran.'
  } finally {
    creating.value = false
  }
}

async function removeRole(r: RoleRow) {
  if (!confirm(`Hapus peran "${roleLabel(r.name)}"?`)) return
  try {
    await api(`/roles/${r.id}`, { method: 'DELETE' })
    roles.value = roles.value.filter((x) => x.id !== r.id)
    if (selectedId.value === r.id) selectedId.value = roles.value[0]?.id ?? null
    if (selectedRole.value) draft.value = [...selectedRole.value.permissions]
  } catch (e: any) {
    alert(e?.data?.message ?? 'Gagal menghapus peran.')
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [r, p] = await Promise.all([
      api<{ data: RoleRow[] }>('/roles'),
      api<{ data: string[] }>('/permissions'),
    ])
    roles.value = r.data
    allPerms.value = p.data
    if (roles.value.length) selectRole(roles.value[0])
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Gagal memuat peran.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="nk-stack">
    <header class="head">
      <div>
        <h1 class="nk-pagehead__title">Peran &amp; Akses</h1>
        <p class="nk-pagehead__sub">Atur hak akses setiap peran terhadap sistem.</p>
      </div>
      <Button label="Tambah peran" icon="pi pi-plus" @click="createOpen = true" />
    </header>

    <p v-if="loading" class="nk-muted">Memuat peran…</p>

    <EmptyState v-else-if="error" icon="pi pi-exclamation-triangle" title="Gagal memuat" :description="error">
      <Button label="Coba lagi" size="small" @click="load" />
    </EmptyState>

    <div v-else class="rm">
      <!-- Daftar peran -->
      <aside class="rm__roles">
        <button
          v-for="r in roles"
          :key="r.id"
          type="button"
          class="rolecard"
          :class="{ 'rolecard--active': r.id === selectedId }"
          @click="selectRole(r)"
        >
          <span class="rolecard__ic"><i class="pi pi-shield" /></span>
          <span class="rolecard__body">
            <span class="rolecard__name">{{ roleLabel(r.name) }}</span>
            <span class="rolecard__meta">
              {{ r.locked ? 'Akses penuh' : `${r.permissions.length} hak akses` }}
            </span>
          </span>
          <span v-if="r.is_core" class="rolecard__badge">inti</span>
          <i
            v-else
            class="pi pi-trash rolecard__del"
            role="button"
            aria-label="Hapus peran"
            @click.stop="removeRole(r)"
          />
        </button>
      </aside>

      <!-- Matriks hak akses -->
      <section class="rm__perms">
        <template v-if="selectedRole">
          <div class="rm__permhead">
            <div>
              <h2 class="rm__title">{{ roleLabel(selectedRole.name) }}</h2>
              <p class="rm__subtitle">Centang hak akses yang boleh digunakan peran ini.</p>
            </div>
            <Button
              v-if="!selectedRole.locked"
              label="Simpan"
              icon="pi pi-check"
              :disabled="!dirty"
              :loading="saving"
              @click="save"
            />
          </div>

          <Message v-if="selectedRole.locked" severity="info" class="rm__msg">
            Super Admin selalu memiliki akses penuh ke seluruh sistem dan tidak dapat diubah.
          </Message>
          <Message v-if="saveMsg" severity="success" class="rm__msg">{{ saveMsg }}</Message>
          <Message v-if="saveErr" severity="error" class="rm__msg">{{ saveErr }}</Message>

          <div class="perms">
            <div v-for="g in groupedPerms" :key="g.key" class="permgroup">
              <div class="permgroup__head">
                <span class="permgroup__title">{{ g.label }}</span>
                <label v-if="!selectedRole.locked" class="permgroup__all">
                  <Checkbox
                    :model-value="groupAllOn(g.items)"
                    binary
                    @update:model-value="(v) => toggleGroup(g.items, !!v)"
                  />
                  Semua
                </label>
              </div>
              <div class="permgroup__items">
                <label v-for="it in g.items" :key="it.name" class="permitem">
                  <Checkbox
                    v-model="draft"
                    :value="it.name"
                    :disabled="selectedRole.locked"
                  />
                  <span>{{ it.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>

    <Dialog v-model:visible="createOpen" modal header="Tambah peran" :style="{ width: '90vw', maxWidth: '380px' }">
      <div class="nk-form">
        <div class="nk-field">
          <label class="nk-label">Nama peran</label>
          <InputText v-model="newRole.name" class="w-full" placeholder="mis. kasir, supervisor" />
          <p class="rm__hint">Huruf kecil, tanpa spasi (spasi otomatis jadi garis bawah).</p>
        </div>
        <Message v-if="createErr" severity="error">{{ createErr }}</Message>
      </div>
      <template #footer>
        <Button label="Batal" text @click="createOpen = false" />
        <Button label="Buat" icon="pi pi-check" :loading="creating" :disabled="!newRole.name.trim()" @click="createRole" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin: 2px 2px 0;
}
.rm { display: grid; grid-template-columns: 1fr; gap: 16px; }
@container appview (min-width: 780px) {
  .rm { grid-template-columns: 270px 1fr; align-items: start; }
}

.rm__roles { display: flex; flex-direction: column; gap: 10px; }
.rolecard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, transform 0.12s;
}
.rolecard:hover { border-color: var(--sand); }
.rolecard--active { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(82, 55, 36, 0.1); }
.rolecard__ic {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--sand-soft);
  color: var(--brand);
  font-size: 16px;
}
.rolecard__body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.rolecard__name { font-size: 14px; font-weight: 600; color: var(--ink); }
.rolecard__meta { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
.rolecard__badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--brand);
  background: var(--sand-soft);
  padding: 3px 8px;
  border-radius: 999px;
}
.rolecard__del { color: var(--ink-soft); font-size: 14px; padding: 4px; }
.rolecard__del:hover { color: var(--danger); }

.rm__perms {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px 22px;
}
.rm__permhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.rm__title { margin: 0; font-size: 18px; font-weight: 700; color: var(--ink); }
.rm__subtitle { margin: 4px 0 0; font-size: 13px; color: var(--ink-soft); }
.rm__msg { margin-top: 14px; }
.rm__hint { margin: 6px 0 0; font-size: 12px; color: var(--ink-soft); }

.perms { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 18px; }
@container appview (min-width: 1040px) {
  .perms { grid-template-columns: 1fr 1fr; }
}
.permgroup { border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 14px 16px; }
.permgroup__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}
.permgroup__title { font-size: 14px; font-weight: 700; color: var(--ink); }
.permgroup__all { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--ink-soft); cursor: pointer; }
.permgroup__items { display: flex; flex-wrap: wrap; gap: 10px 18px; }
.permitem { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink); cursor: pointer; }
.w-full { width: 100%; }
</style>
