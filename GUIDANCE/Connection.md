# 🌐 Panduan Koneksi Database & Storage

Dokumen ini berisi standar implementasi untuk berinteraksi dengan **Turso (Database)** dan **Tigris (Storage)** di dalam aplikasi ini. Seluruh pengembang wajib mengikuti pola ini untuk menjaga keamanan, mencegah crash saat startup, dan memastikan skalabilitas.

---

## 1. Konfigurasi Environment (Secrets)

Sebelum memulai, pastikan variabel berikut telah dikonfigurasi di menu **Settings > Secrets**:

### Database (Turso)
- `VITE_TURSO_DB_URL`: URL dari Turso (contoh: `libsql://your-db.turso.io`)
- `VITE_TURSO_DB_AUTH_TOKEN`: Token autentikasi Turso.

### Storage (Tigris)
- `VITE_TIGRIS_STORAGE_ENDPOINT`: Endpoint S3 Tigris.
- `VITE_TIGRIS_STORAGE_BUCKET`: Nama bucket.
- `VITE_TIGRIS_STORAGE_ACCESS_KEY_ID`: Access Key.
- `VITE_TIGRIS_STORAGE_SECRET_ACCESS_KEY`: Secret Key.

---

## 2. Prinsip "Lazy Initialization"

Aplikasi ini menggunakan teknik **Lazy Initialization** untuk semua SDK pihak ketiga. Artinya, SDK (seperti client Turso atau AWS S3) **TIDAK** diinisialisasi di tingkat atas (top-level scope) file.

**Mengapa?**
Jika SDK diinisialisasi di top-level dan secret belum diisi, aplikasi akan crash saat startup. Dengan Lazy Init, SDK baru akan dibuat saat fungsi dipanggil pertama kali.

### Contoh Implementasi di `src/logic/api/turso.ts`:
```typescript
let clientInstance: Client | null = null;

export const getTursoClient = (): Client => {
  if (clientInstance) return clientInstance; // Return yang sudah ada
  
  // Baru diinisialisasi saat fungsi dipanggil
  clientInstance = createClient({
    url: config.turso.url || "",
    authToken: config.turso.authToken || "",
  });
  
  return clientInstance;
};
```

---

## 3. Cara Menggunakan Database (Turso)

Gunakan utilitas `tursoRequest` yang terletak di `src/logic/api/turso.ts`. Fungsi ini mengembalikan object result dari `@libsql/client`.

### Operasi READ (Select)
```typescript
import { tursoRequest } from '@/logic/api/turso';

const fetchUser = async (id: number) => {
  const result = await tursoRequest("SELECT * FROM users WHERE id = ?", [id]);
  return result.rows[0];
};
```

### Operasi WRITE (Insert/Update)
```typescript
const addUser = async (name: string) => {
  await tursoRequest("INSERT INTO users (name) VALUES (?)", [name]);
};
```

---

## 4. Cara Menggunakan Storage (Tigris)

Gunakan `storageService` yang terletak di `src/logic/services/storage.ts`. Layanan ini telah menangani kompresi gambar otomatis dan pembuatan Public URL.

### Upload File
```typescript
import { storageService } from '@/logic/services/storage';

const handleUpload = async (file: File) => {
  // path: folder tujuan dalam bucket
  const result = await storageService.upload(file, 'avatars');
  console.log('Public URL:', result.url);
  console.log('Key:', result.key); // Simpan key ini di DB untuk keperluan delete
};
```

### Hapus File
```typescript
const handleDelete = async (key: string) => {
  await storageService.delete(key);
};
```

---

## 5. Keamanan & Best Practices

1. **Gunakan Parameterized Queries**: Jangan pernah memasukkan variabel langsung ke string SQL untuk mencegah SQL Injection. Gunakan `?` (placeholder).
2. **Handle Error**: Selalu gunakan `try-catch` saat melakukan operasi jaringan.
3. **Public URL Tigris**: URL publik Tigris memiliki format: `https://<nama-bucket>.t3.tigrisfiles.io/<key-file>`. Pastikan bucket Anda memiliki policy **Public Read** jika file ingin bisa diakses langsung via browser.
4. **CORS**: Jika terjadi masalah CORS pada Storage, pastikan domain aplikasi Anda sudah ditambahkan ke dalam CORS Configuration di dashboard Tigris/AWS S3.
5. **Zero Hardcoding**: Dilarang memasukkan URL atau token langsung ke dalam kode. Gunakan objek `config` di `src/logic/utils/config.ts`.
