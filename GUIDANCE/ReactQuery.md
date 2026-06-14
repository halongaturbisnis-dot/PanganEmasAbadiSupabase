# Strategi Pengambilan Data & Larangan React Query (ReactQueryRule)

Dokumen ini menjelaskan standar pengambilan data dalam aplikasi untuk memastikan efisiensi payload, performa tinggi, dan pencegahan kebocoran memori.

## 1. Optimalisasi Payload (Payload Optimization)
Untuk meminimalkan penggunaan bandwidth dan mempercepat waktu respon, setiap permintaan data wajib hanya mengambil kolom yang diperlukan.
- **Prinsip**: Gunakan parameter `select` atau `columns` pada service level.
- **Implementasi**: Method service harus menerima array string kolom yang diinginkan. Contoh: `service.getAll({ columns: ['id', 'name', 'status'] })`.
- **Dampak**: Mengurangi beban parsing JSON di sisi client dan query engine di sisi database.

## 2. Manajemen Lifecycle & Cleanup
Setiap hook pengambilan data wajib menangani pembersihan (cleanup) saat komponen di-unmount.
- **Metode**: Gunakan `AbortController` untuk membatalkan fetch request yang sedang berjalan.
- **Hook Kustom**: Gunakan `useDataFetch` (bukan React Query) yang secara internal mengelola state `loading`, `data`, `error`, dan `cleanup`.

## 3. Data Dinamis & Real-time
Aplikasi harus selalu menampilkan data yang mutakhir.
- **Polling**: Mendukung mekanisme refresh otomatis dengan interval tertentu (optional).
- **Manual Refresh**: Menyediakan fungsi `refetch` untuk memicu pengambilan data ulang secara programmatik.
- **Invalidation**: Saat terjadi perubahan data (Create/Update/Delete), data terkait harus segera diperbarui.

## 4. Larangan Penggunaan React Query
Sesuai arahan teknis, TanStack/React Query **tidak digunakan** dalam proyek ini. Semua kebutuhan caching dan state management data ditangani melalui:
- Custom hooks (`useDataFetch`).
- Service level caching (jika diperlukan) menggunakan `dataService.ts`.

## 5. Seleksi Kolom di Service Level
Semua service yang diturunkan dari `BaseService` harus memiliki kemampuan seleksi kolom.
- Default: Ambil semua kolom (tidak direkomendasikan untuk tabel besar).
- Praktik Terbaik: Selalu tentukan kolom yang dibutuhkan di level Page atau Component.

---
*Dibuat untuk memastikan aplikasi tetap ringan, responsif, dan bebas dari memory leak.*
