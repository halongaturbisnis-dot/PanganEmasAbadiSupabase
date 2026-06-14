# Panduan Penulisan & Pembacaan Datetime di Database (SQLite & Turso)

Dokumen ini menjelaskan standardisasi penulisan dan filter data berbasis waktu (Tanggal & Waktu) di seluruh backend dan service agar tidak terjadi kebingungan format maupun perbedaan Timezone offset yang memunculkan bug kehilangan akurasi filter seperti yang kita alami sebelumnya.

## 1. Menulis Datetime ke Database

Pastikan selalu menyimpan waktu aktual ISO 8601 atau String standard lokal `YYYY-MM-DD HH:MM:SS`. Backend kita menggunakan tipe data datetime. Jangan menggunakan fungsi timestamp auto secara serampangan kecuali sudah diatur oleh database.

Gunakan Standard JS `Date.toISOString()` untuk UTC fallback atau fungsi khusus formater lokal kita. Form frontend telah menyiapkan format `YYYY-MM-DD HH:mm:ss`.

**Contoh Benar**:
Data datetime masuk sebagai format `2024-05-31 16:35:00` atau ISO string.

## 2. Membaca & Melakukan Filter Berdasarkan Tanggal (Date Picker)

**MASALAH SEBELUMNYA:**
Sebelumnya, kita memanipulasi string di backend dengan menggabungkan `" 00:00:00"` dan `" 23:59:59"` pada variabel `startDate` dan `endDate` dari DatePicker:
```typescript
// BIKIN BUG
if (startDate) {
  whereClause += ` AND p.datetime >= '${startDate} 00:00:00'`;
}
if (endDate) {
  whereClause += ` AND p.datetime <= '${endDate} 23:59:59'`;
}
```
Pendekatan ini berisiko:
1. Menghasilkan mismatch zona waktu internal saat string dibandingkan tanpa fungsi konversi.
2. Tidak menangkap millisecond ujung hari dengan presisi.
3. Menimbulkan masalah "tanggal 31 Mei tidak bisa muncul setelah difilter".

**SOLUSI STANDAR BARU:**
Gunakan fungsi bawaan `DATE()` milik SQL/SQLite untuk memotong spesifik komponen tanggalnya dan hilangkan seluruh pernak-pernik waktu dan zona waktu, kemudian lakukan filter komparasi hanya dengan literal `YYYY-MM-DD`.

```typescript
// STANDARD BENAR
if (options?.startDate) {
  whereConditions.push(`date(p.datetime) >= ?`);
  params.push(options.startDate); // Contoh: "2024-05-31"
}

if (options?.endDate) {
  whereConditions.push(`date(p.datetime) <= ?`);
  params.push(options.endDate);  // Contoh: "2024-05-31"
}
```

Apabila ingin langsung di query string SQL (tanpa params):
```typescript
const dateFilter = startDate && endDate ? ` AND date(p.datetime) BETWEEN '${startDate}' AND '${endDate}'` : '';
```

Perubahan ini membuat SQLite membaca: "Apakah tanggal dari parameter p.datetime (yang di extract dengan instruksi DATE() ke dalam YYYY-MM-DD) berada di antara atau sama dengan YYYY-MM-DD pilihan datepicker?". Dan ini 100% akurat. 

## 3. Server-Side Fetching (Mengapa Ini Efisien?)

Kapanpun user memilih tanggal pada elemen DatePicker UI:
1. Aksi ini mengubah *state* filter (contoh: `endDate` atau `startDate`).
2. Proses ini kemudian dengan otomatis "memanggil uangan (re-fetch)" data ke Services (`penjualanService`, `pemasukanService`, dll.).
3. State difilter di level Database (Server-Side), **BUKAN** data mentah Client-side difilter di dalam memori browser. Ini akan meringankan kerja aplikasi dan menjaga integrasi paginasi.

Jadikan panduan ini referensi wajib untuk segala modul di masa mendatang!
