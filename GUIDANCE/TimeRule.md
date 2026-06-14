# Aturan Pencatatan Waktu & Timezone (TimeRule)

Aturan ini mendefinisikan standar pengambilan, pencatatan, dan pengamanan data waktu di seluruh modul aplikasi. Tujuannya adalah memastikan setiap record waktu akurat, tahan terhadap manipulasi *(device time tampering)*, dan terstandarisasi.

## 1. Pencegahan Manipulasi Waktu (Network Time Sync)
Aplikasi **Sangat Dilarang** mempercayai dan menjadikan waktu lokal perangkat (`Date.now()` atau `new Date()`) sebagai acuan tunggal untuk logika kritis, transaksi, maupun riwayat log.
- **Mekanisme**: Saat aplikasi dimuat (pada GlobalContext), jalankan sinkronisasi waktu terhadap acuan server (`syncActualTime()`).
- **Implementasi Client**: Selalu panggil fungsi `getActualTime()` dari `src/logic/utils/time.ts` (sudah mengakomodasi kalkulasi selisih/drift antara device dan waktu server sebenarnya).

## 2. Standar Timezone (IANA Identifier)
Semua pencatatan kolom timezone di aplikasi ini wajib menggunakan **Standar Internasional IANA (Internet Assigned Numbers Authority) Time Zone Database**.
- **Contoh Valid**: `Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`, `Europe/London`.
- **Contoh TIDAK Valid**: `+07:00`, `WIB`, `GMT+7`.
- **Implementasi**: Deteksi timezone menggunakan Engine dari browser `Intl.DateTimeFormat().resolvedOptions().timeZone` melalui helper `getTimezoneIdentifier()` untuk disisipkan ke payload data.

## 3. Kombinasi Waktu Server & Timezone Klien (Audit Trail Database)
Sesuai rancangan *Guided DatabaseRule*, Audit Trail dibuat dengan skema gabungan untuk meminimalisasi eksploitasi:
1. **Datetime Transaksi (`created_at`, `updated_at`)**: Sepenuhnya diserahkan kepada Engine Database (Turso/SQLite) menggunakan `CURRENT_TIMESTAMP`. Nilai ini menggunakan UTC dan dijamin merupakan sistem waktu abadi yang tak terintervensi klien.
2. **Konteks Timezone (`created_timezone`, `updated_timezone`)**: Tidak bisa di-generate Turso secara lokal perangkat klien geografis. Klien wajib menginjeksi Identifikasi IANA Timezone (`Asia/Jakarta`) yang diambil pada poin #2 di atas lewat SQL `INSERT` maupun `UPDATE`. 

## 4. Pencatatan Aktivitas Aktual Bisnis (Non-Audit)
Untuk modul spesifik yang mencatat "Jam dilakukan aktivitas aktual" (contoh: Shift masuk kerja, Laporan foto survei lapangan):
- **JANGAN JADIKAN** `CURRENT_TIMESTAMP` milik server sebagai field bisnis. Ada kalanya aplikasi bersifat *offline-sync* sehingga jadwal aktivitas terjadi bisa berbeda jauh dari *waktu sampai di server*.
- **REKAM** jam historis tersebut dari hasil return `getActualTime()` saat interaksi pengguna langsung.
- Sebagai validasi tambahan atas manipulasi Fake GPS yang merubah timezone, lakukan validasi ganda terhadap lokasi GPS saat ini dengan `getExpectedTimezone(lat, lng)`.

## 5. Abstraksi Fungsi (`src/logic/utils/time.ts`)
- `syncActualTime()`: Mengkalkulasi selisih *time drift*.
- `getActualTime()`: Memberikan Unix Timestamp terkoreksi.
- `getTimezoneIdentifier()`: Rutin pengambilan IANA string timezone ("Asia/Jakarta").
- `getTimezoneInfo()`: Rutinitas komplit metadata jam klien.
- `getExpectedTimezone(lat, lng)`: Mencari estimasi IANA timezone identifier berdasarkan koordinat geografis.
