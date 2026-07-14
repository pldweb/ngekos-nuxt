<template>
  <div class="auth">
    <div class="auth__col">
      <header class="auth__brand nk-rise">
        <BrandMark size="lg" />
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
