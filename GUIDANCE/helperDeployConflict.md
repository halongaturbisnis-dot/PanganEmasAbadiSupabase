# Helper Deployment Conflict & Resolution Guide

Dokumen ini merinci konflik yang sering terjadi saat transisi dari lingkungan **Google AI Studio (Development)** ke **Vercel (Production)**, serta strategi teknis untuk menyelesaikannya secara permanen.

---

## 1. Masalah Utama: "It Works on My AI Studio, but Fails on Vercel"

Aplikasi berbasis Vite + Express/Node.js sering mengalami kegagalan di Vercel karena perbedaan mendasar dalam cara Node.js menangani modul dan variabel lingkungan.

### A. Konflik Module Resolution (ESM vs CJS)
**Masalah:** Node.js (v18+) secara default menggunakan ECMAScript Modules (ESM). Berbeda dengan browser, Node.js sangat ketat. Ia tidak tahu cara melengkapi path file secara otomatis.
- **Gejala:** Error `ERR_MODULE_NOT_FOUND`.
- **Penyebab:** Import seperti `import { x } from './logic'` tanpa ekstensi `.js` dianggap tidak valid oleh runtime Node.js saat eksekusi server-side/API.

### B. Konflik Isomorphic Logic (Browser APIs on Server)
**Masalah:** Kode di `src/logic` sering digunakan oleh Frontend (React) dan Backend (API).
- **Gejala:** Error `window is not defined` atau `localStorage is not defined`.
- **Penyebab:** Kode logika mencoba mengakses API browser saat berjalan di lingkungan server Node.js.

### C. Konflik Variabel Lingkungan (Vite Prefix)
**Masalah:** Vite hanya memaparkan variabel dengan prefix `VITE_` ke frontend. Namun, di CI/CD atau server production, variabel seringkali dikonfigurasi tanpa prefix tersebut.
- **Gejala:** Koneksi Database/Storage gagal karena key kosong.

---

## 2. Strategi Solusi Komprehensif

### A. Mandat Ekstensi .js (The "Dot JS" Rule)
Setiap kali melakukan import relatif di dalam file logika (`src/logic/*`), **WAJIB** menyertakan ekstensi `.js` (meskipun file aslinya adalah `.ts`).
- **Contoh:**
  ```typescript
  // ❌ SALAH
  import { config } from '../utils/config';
  // ✅ BENAR
  import { config } from '../utils/config.js';
  ```
*Mengapa?* TypeScript akan mengompilasi ini, dan Node.js membutuhkannya untuk menemukan file di filesystem Linux Vercel.

### B. Defensive Coding - SSR Guard
Gunakan pengecekan `typeof window` di setiap service yang berpotensi menyentuh browser API atau UI.
- **Contoh untuk Storage:**
  ```typescript
  export const storage = {
    get: (key: string) => {
      if (typeof window === 'undefined') return null; // Safe for server
      return localStorage.getItem(key);
    }
  }
  ```
- **Contoh untuk UI Notifications:**
  Tambahkan guard agar `toast` atau `Swal` tidak dipanggil saat dieksekusi oleh API Backend.

### C. Unified Config Accessor
Buat `src/logic/utils/config.ts` sebagai pintu gerbang tunggal yang cerdas. Gunakan logika deteksi ganda.
- **Contoh:**
  ```typescript
  const getEnv = (key: string) => {
    // Cek Vite (Client)
    const viteVal = (import.meta as any).env?.[`VITE_${key}`];
    // Cek Node (Server)
    const nodeVal = typeof process !== 'undefined' ? (process.env[`VITE_${key}`] || process.env[key]) : '';
    return viteVal || nodeVal || '';
  };

  export const config = {
    tursoUrl: getEnv('TURSO_DB_URL'),
    // ...
  };
  ```

### D. Server-Side Fetch Handling
Saat melakukan `fetch` di dalam logika bersama, pastikan URL-nya absolut jika berjalan di server.
- **Contoh:**
  ```typescript
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.APP_URL || process.env.VITE_APP_URL || '');
  ```

### E. Konflik Storage Key (Full URL vs Key)
**Masalah:** Saat menghapus file (Delete), database seringkali menyimpan Full Path atau Proxy Path (seperti `/api/images/...`). Jika dikirim langsung ke S3 API, penghapusan akan gagal.
- **Gejala:** Log bilang "Permanently deleting", tapi file tetap ada di Tigris/S3.
- **Penyebab:** SDK S3 mencari key `/api/images/file.jpg` di dalam bucket, padahal key aslinya cuma `file.jpg`.
- **Solusi:** Selalu gunakan helper untuk membersihkan key sebelum memanggil `DeleteObjectCommand`.
  ```typescript
  const actualKey = key.split('/api/images/').pop() || key;
  ```

---

## 3. Checklist Sebelum Deploy/Ship
1. [ ] Cek semua file di `src/logic/`: Apakah semua import relatif sudah pakai `.js`?
2. [ ] Jalankan `npm run lint`: Apakah ada error TypeScript?
3. [ ] Pastikan `VITE_APP_URL` sudah dikonfigurasi di dashboard Vercel sesuai domain aslinya.
4. [ ] Periksa `api/index.ts`: Apakah semua modul yang diimport dari `src/logic` sudah mengikuti pola di atas?

---
*Dokumen ini adalah suplemen untuk `EnvironmentSwitchingRule.md`.*
