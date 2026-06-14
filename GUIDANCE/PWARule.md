# PWA (Progressive Web App) Standard Rule

Dokumen ini mengatur standar konfigurasi agar aplikasi tetap memiliki pengalaman "Native-Like" di perangkat mobile (Android/iOS).

## 🛠️ CORE CONFIGURATION
1. **Manifest Integrity**:
   - File `/manifest.json` WAJIB dijaga validitasnya.
   - `display` HARUS tetap `standalone` untuk menghilangkan bar navigasi browser.
   - `orientation` HARUS `portrait` (kecuali ada modul khusus yang memerlukan landscape).
   - `icons` harus merujuk pada logo resmi yang tersimpan di `/public/`.

2. **SEO & App Shell Metas**:
   - Di `index.html`, tag meta berikut HARUS ada:
     - `apple-mobile-web-app-capable`: "yes"
     - `apple-mobile-web-app-status-bar-style`: "default" (atau sesuai tema)
     - `viewport-fit=cover`: Wajib untuk menangani *notch* pada layar HP modern.

## 📦 SERVICE WORKER (SW)
1. **SW Registration**:
   - Registrasi dilakukan di `src/main.tsx` hanya pada environment `production` (`import.meta.env.PROD`).
2. **Caching Strategy**:
   - Gunakan strategi **Cache First** untuk assets statis (Logo, Fonts, CSS, JS).
   - Gunakan strategi **Network First** atau **Stale-While-Revalidate** untuk data API agar data tetap aktual namun tetap bisa dibuka saat *offline*.
3. **Notification Handling**:
   - SW di `/public/sw.js` bertanggung jawab menangani event `push` dan `notificationclick`.

## 🎨 UI/UX INVARIANTS
1. **No Overscroll**: Hindari efek *pull-to-refresh* default dari browser jika mengganggu kenyamanan navigasi custom.
2. **Safe Area**: Gunakan utilitas Tailwind (misal: `padding-top: env(safe-area-inset-top)`) jika diperlukan untuk area *top bar* atau *navigation notch*.
3. **Theme Color**: `theme-color` di manifest dan meta tag harus selaras dengan `tokens.ts` (Background App).

## 🚀 MAINTENANCE
- DILARANG menghapus atau mengubah path `/sw.js` atau `/manifest.json` tanpa alasan teknis yang fundamental.
- Saat rilis versi baru, pastikan `CACHE_NAME` di `sw.js` diupdate jika ada perubahan struktur file yang masif untuk memaksa browser melakukan refresh cache.
