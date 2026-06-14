# Panduan Integrasi Turso Database di Google AI Studio

Dokumen ini menjelaskan langkah-langkah untuk menghubungkan aplikasi Anda ke Turso (SQLite Cloud Database) menggunakan LibSQL client.

## 1. Persiapan di Dashboard Turso

1. **Buat Database**: Buat database baru di Turso.
2. **Dapatkan Koneksi**:
   - Salin **Database URL** (biasanya diawali dengan `libsql://`).
   - Buat dan salin **Auth Token** (JWT).

## 2. Konfigurasi Environment Variables di Google AI Studio

Buka menu **Settings** di Google AI Studio dan masukkan variabel berikut. Gunakan prefix `VITE_` agar variabel dapat diakses di sisi client (frontend).

| Nama Variabel | Contoh Nilai | Keterangan |
| :--- | :--- | :--- |
| `VITE_TURSO_DB_URL` | `libsql://nama-db-user.turso.io` | Endpoint URL Database Turso |
| `VITE_TURSO_DB_AUTH_TOKEN` | `eyJhbG...` | Token Autentikasi Turso |

## 3. Implementasi Kode (Vite/React)

Gunakan library `@libsql/client` untuk koneksi. Di Google AI Studio, gunakan sub-package `/web` untuk kompatibilitas environment browser.

```typescript
import { createClient } from "@libsql/client/web";

const url = import.meta.env.VITE_TURSO_DB_URL;
const authToken = import.meta.env.VITE_TURSO_DB_AUTH_TOKEN;

export const dbClient = createClient({
  url: url,
  authToken: authToken,
});
```

## 4. Penggunaan CRUD Dasar

```typescript
// Mengambil data
const result = await dbClient.execute("SELECT * FROM users");
console.log(result.rows);

// Menambah data dengan parameterized query (Aman dari SQL Injection)
await dbClient.execute({
  sql: "INSERT INTO users (name, email) VALUES (?, ?)",
  args: ["Nama User", "user@example.com"]
});
```

## 5. Tips & Best Practices
- **Prefix VITE_**: Selalu gunakan prefix ini jika Anda ingin mengakses DB langsung dari frontend code di AI Studio.
- **Modularitas**: Simpan konfigurasi client di file terpisah (seperti `src/lib/db.ts`) agar mudah diimpor ke seluruh komponen.
- **Error Handling**: Selalu gunakan blok `try-catch` saat melakukan operasi database untuk menangani masalah jaringan atau query yang salah.
