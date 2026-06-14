# 🚀 DEPLOYMENT MANUAL: Switching to Vercel

Panduan ini menjelaskan langkah-langkah untuk memindahkan aplikasi dari lingkungan pengembangan **Google AI Studio** ke **Vercel Production**.

## 1. Persiapan Kode (Pre-Flight Check)
Sebelum melakukan push ke GitHub atau upload ke Vercel, pastikan hal berikut:
1. Jalankan `npm run lint` dan pastikan tidak ada error.
2. Periksa `src/logic/utils/config.ts` dan pastikan semua variabel lingkungan penting sudah terdaftar.
3. Pastikan tidak ada "Hardcoded URL" yang merujuk pada `ais-dev-...` atau `localhost`.

## 2. Konfigurasi Environment Variables di Vercel
Masuk ke Dashboard Vercel > Settings > Environment Variables, dan tambahkan:

| Key | Value | Deskripsi |
| :--- | :--- | :--- |
| `VITE_APP_URL` | `https://your-domain.vercel.app` | URL domain produksi Anda |
| `GEMINI_API_KEY` | `AIzaSy...` | API Key dari Google AI Studio |
| `VITE_TIGRIS_BUCKET` | `your-bucket` | Nama bucket storage (jika pakai) |
| `VITE_TIGRIS_SECRET_ACCESS_KEY` | `...` | Secret key storage (jika pakai) |

*Catatan: Variabel bertanda `VITE_` akan diekspos ke client bundle.*

## 3. Konfigurasi Build Settings
Secara default, Vercel akan mendeteksi project ini sebagai Vite project. Pengaturan yang benar adalah:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 4. Penanganan Route API (Vercel Serverless)
Jika project Anda adalah **Full-Stack (Express + Vite)**, Anda mungkin perlu membuat file `vercel.json` di root folder:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 5. Verifikasi Setelah Deploy
Setelah status Vercel menjadi **Ready**:
1. Buka URL produksi.
2. Periksa Console (F12) untuk melihat apakah ada pesan `[Config Warning]`.
3. Test fitur kamera/location (Pastikan menggunakan HTTPS karena fitur ini diblokir di HTTP).
4. Pastikan fitur AI berjalan dengan mengirimkan prompt test.

---
*Dibuat untuk memastikan transisi yang mulus dari Development ke Production.*
