// PM2 ecosystem untuk frontend Nuxt (SPA/PWA, preset node-server).
//
// Produksi:
//   cd frontend
//   npm ci
//   npm run build                       # menghasilkan .output/server/index.mjs
//   pm2 start ecosystem.config.cjs      # jalankan
//   pm2 save                            # simpan agar auto-start saat reboot (butuh: pm2 startup)
//
// Ganti NUXT_PUBLIC_API_BASE ke URL API produksi (runtimeConfig public dibaca saat runtime).
// Reload tanpa downtime setelah build ulang: pm2 reload ngekoskuy-web

module.exports = {
  apps: [
    {
      name: 'ngekoskuy-web',
      cwd: __dirname,
      script: './.output/server/index.mjs',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        NITRO_HOST: '0.0.0.0',
        NITRO_PORT: 3000,
        // WAJIB diganti ke endpoint API produksi:
        NUXT_PUBLIC_API_BASE: 'https://api.ngekoskuy.example/api/v1',
      },
    },
  ],
}
