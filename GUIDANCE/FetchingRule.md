# Aturan Pengambilan Data (FetchingRule)

Dokumen ini menjelaskan dua metode pengambilan data yang digunakan untuk menyeimbangkan antara kemudahan akses dan efisiensi bandwidth (egress).

## 1. Metropolitan vs Rural (Dua Metode Fetching)

### **Cara Pertama: Full Fetching (Modul Tertentu)**
Digunakan untuk data yang jumlahnya sedikit atau modul yang membutuhkan dataset lengkap untuk fungsi pencarian/filter di sisi client.
- **Kapan Digunakan**: Data < 50-100 item, modul pengaturan, profil, atau data statis.
- **Hook**: `useDataFetch`.
- **Method**: `service.getAll()`.

### **Cara Kedua: Lazy Loading / Paginated (Modul Data Besar)**
Digunakan untuk modul yang memiliki potensi jumlah data sangat banyak (ratusan/ribuan) untuk menghemat kuota data user.
- **Kapan Digunakan**: Daftar transaksi, daftar akun, riwayat log, feed sosial.
- **Hook**: `useInfiniteScroll`.
- **Method**: `service.getPaginated()`.

## 2. Pusat Kontrol (Fetching Center)

Semua pengaturan jumlah data (*limit*) untuk metode Lazy Loading **WAJIB** diatur di satu tempat:
`src/logic/services/fetchingCenter.ts`

- **Tujuan**: Memudahkan tuning performa aplikasi tanpa harus mencari di dalam file komponen UI.
- **Default fallback**: Jika sebuah halaman tidak didefinisikan secara eksplisit, sistem akan menggunakan nilai `DEFAULT`.

## 3. Cara Mendaftarkan Halaman Baru

Jika Anda membuat halaman baru bernama `DaftarProduk.tsx`, ikuti langkah ini:
1. Buka `src/logic/services/fetchingCenter.ts`.
2. Tambahkan entry baru:
```typescript
{
  'DaftarProduk': 15, // Load 15 data per fetch
}
```
3. Di komponen `DaftarProduk.tsx`, gunakan identifier tersebut saat memanggil service atau hook.

## 4. Keamanan & Kebocoran Memori

- Selalu gunakan `signal` (AbortController) yang disediakan oleh hook untuk membatalkan request jika user berpindah halaman sebelum data selesai dimuat.
- Pastikan limit tidak terlalu besar (tidak disarankan > 50 data per fetch untuk mobile).

---
*Dibuat untuk efisiensi egress dan pengalaman pengguna yang responsif.*
