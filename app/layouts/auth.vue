<template>
  <div class="auth">
    <div class="auth__col">
      <NuxtLink to="/" class="auth__back" aria-label="Kembali ke beranda">
        <i class="pi pi-arrow-left" />
        <span>Kembali</span>
      </NuxtLink>

      <header class="auth__brand nk-rise">
        <NuxtLink to="/" aria-label="Ngekoskuy">
          <SiteLogo :height="64" />
        </NuxtLink>
        <p class="auth__tag">Kelola kos, bayar sewa, dan urus semuanya dari satu aplikasi.</p>
      </header>

      <div class="auth__slot nk-rise">
        <slot />
      </div>

      <p class="auth__foot">NgekosKuy · Manajemen kos terintegrasi</p>
    </div>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  background:
    radial-gradient(130% 55% at 50% 0%, #eae0d2 0%, rgba(234, 224, 210, 0) 60%),
    var(--bg);
}
.auth__col {
  width: 100%;
  max-width: 430px;
  padding: 40px 22px 32px;
  display: flex;
  flex-direction: column;
}
.auth__back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  margin-bottom: 18px;
  padding: 8px 14px 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--line);
  color: var(--brand-strong);
  font-size: 13.5px;
  font-weight: 600;
  transition: background 0.15s, border-color 0.15s;
}
.auth__back:hover { background: #fff; border-color: var(--sand); }
.auth__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  margin-bottom: 24px;
}
.auth__tag {
  margin: 0;
  max-width: 300px;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.55;
}
.auth__foot {
  text-align: center;
  margin: 26px 0 0;
  font-size: 12px;
  color: #adb2ba;
}
@media (min-width: 600px) {
  .auth__col { padding-top: 64px; }
}
</style>
