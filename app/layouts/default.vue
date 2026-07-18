<template>
  <div class="app">
    <header class="app__bar">
      <BrandMark size="sm" />
      <NotifBell />
    </header>

    <main class="app__main">
      <slot />
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.app {
  max-width: var(--app-max-width);
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 60px -30px rgba(40, 30, 20, 0.25);
}
.app__bar {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.app__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: none;
  background: var(--surface-2);
  border-radius: 12px;
  color: var(--brand);
  font-size: 17px;
  cursor: pointer;
}
.app__main {
  flex: 1;
  padding: 18px 16px calc(84px + env(safe-area-inset-bottom));
  container: appview / inline-size;
}
</style>
