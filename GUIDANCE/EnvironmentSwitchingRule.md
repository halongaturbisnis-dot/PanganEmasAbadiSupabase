# Guidance: Environment Switching (EnvironmentSwitchingRule)

## 1. Filosofi Utama: Build Once, Run Anywhere
Aplikasi ini dikembangkan untuk berjalan mulus di **Google AI Studio (Development)** dan **Vercel (Production)** tanpa memerlukan perubahan kode manual saat berpindah environment.

### Prinsip Utama:
- **Agnostic Logic**: Logika backend dan frontend tidak boleh "hardcoded" merujuk pada satu platform spesifik.
- **Environment Discovery**: Gunakan `config.ts` sebagai satu-satunya gerbang akses ke variabel lingkungan.
- **Vite Standard-Compliant**: Gunakan prefix `VITE_` untuk variabel yang dibutuhkan di sisi client agar kompatibel dengan sistem build modern.

---

## 2. Struktur Pengelolaan Environment
Semua akses environment variable WAJIB melalui `src/logic/utils/config.ts`.

### Aturan Penamaan:
| Platform | Client Variable (Prefixed) | Server Variable (Secret) |
| :--- | :--- | :--- |
| **Development (AI Studio)** | `VITE_APP_URL` | `GEMINI_API_KEY` |
| **Production (Vercel)** | `VITE_APP_URL` | `GEMINI_API_KEY` |

**DILARANG** mengakses `process.env` atau `import.meta.env` secara langsung di dalam komponen UI.

---

## 3. Strategi Switching Otomatis

### A. API Base URL
Selalu gunakan relative path atau variabel `config.appUrl`. Jangan pernah hardcode `https://ais-dev-...`.

### B. Feature Flags
Gunakan variabel env untuk mengaktifkan/menonaktifkan fitur yang hanya tersedia di satu platform (misal: Debugger tools di dev, Analytics di prod).

```tsx
// Contoh di config.ts
export const config = {
  isDev: import.meta.env.DEV,
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
};
```

---

## 4. Penanganan Common Issues (Vercel & Node.js ESM)

Untuk memastikan aplikasi berjalan dengan sempurna di Vercel (Production) dan AI Studio (Server-side), aturan berikut **WAJIB** diikuti:

### A. Node.js ESM Import Requirement (Ekstensi .js)
Node.js Runtime (ESM mode) mensyaratkan semua **relative import** di dalam folder logika bersama (`src/logic/*`) menyertakan ekstensi file (secara teknis menggunakan `.js` meskipun file aslinya `.ts`).
- **SALAH**: `import { config } from '../utils/config';`
- **BENAR**: `import { config } from '../utils/config.js';`
*Catatan: Hal ini krusial agar logika di `src/logic` dapat dipanggil baik oleh React (Vite) maupun API Backend (Node.js).*

### B. Isomorphic Logic (SSR Safety)
Logika di `src/logic/*` sering kali dipanggil oleh Backend (API). Karena Backend tidak memiliki browser API, semua pemanggilan objek global harus diproteksi:
1. **Guard `window` & `localStorage`**:
   ```typescript
   if (typeof window !== 'undefined' && window.localStorage) {
     const token = localStorage.getItem('token');
   }
   ```
2. **Handle `fetch` Base URL**:
   Di sisi server, `window.location.origin` tidak tersedia. Gunakan logika fallback:
   ```typescript
   const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.APP_URL || '');
   ```

### D. Storage Key Management (S3)
Saat mengirim key untuk penghapusan (delete), pastikan Key yang dikirim adalah **Clean S3 Key**, bukan full URL atau API Proxy path.
- **Masalah**: Mengirim `/api/images/folder/file.jpg` ke S3 `DeleteObject` akan gagal (404 Not Found) karena key yang benar adalah `folder/file.jpg`.
- **Solusi**: Di sisi service, lakukan ekstraksi key secara defensif:
  ```typescript
  const actualKey = key.includes('/api/images/') ? key.split('/api/images/').pop() : key;
  ```

### C. Flexible Environment Access
Sistem build yang berbeda (Vite vs standard CI/CD) seringkali menggunakan prefix variabel yang berbeda. `config.ts` harus mampu mendeteksi keduanya:
```typescript
// Contoh akses bucket storage di config.ts
bucket: process.env.VITE_TIGRIS_STORAGE_BUCKET || process.env.TIGRIS_STORAGE_BUCKET || ''
```

---

## 5. Invariant: Development-Safe, Deployment-Ready
Setiap file baru yang dibuat harus mengikuti aturan:
- **Satu Sumber Validasi**: Gunakan `config.validate()` untuk memastikan semua variabel kunci tersedia.
- **Default Fallbacks**: Berikan nilai default yang aman jika variabel lingkungan tidak ditemukan, agar aplikasi tidak "White Screen" saat deploy tanpa konfigurasi awal.
