<template>
  <div class="app-shell">
    <header class="app-bar">NgekosKuy</header>
    <main class="app-content">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.app-shell {
  max-width: var(--app-max-width);
  margin: 0 auto;
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}
.app-bar {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-weight: 700;
  background: #0ea5e9;
  color: #fff;
}
.app-content {
  flex: 1;
  padding: 16px;
  padding-bottom: 72px;
}
</style>
