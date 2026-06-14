# Aturan Database Aktif (ActiveDatabaseRule)

Dokumen ini menjelaskan mekanisme untuk menjaga database Turso tetap aktif dan mencegah penonaktifan otomatis (auto-pause) akibat inaktivitas.

## 1. Mekanisme Ping Mandiri (Self-Ping)
Untuk menjaga database tetap aktif, aplikasi wajib melakukan operasi tulis (write operation) secara berkala.
- **Metode**: Melakukan `Update/INSERT (UPSERT)` ke tabel `PingMonitoring` pada 1 baris data (Singleton).
- **Jadwal**: Minimal satu kali setiap 24 jam.
- **Waktu Rekomendasi**: Pukul 02:00 AM (Waktu lokal server/pengguna) melalui Cron.

## 2. Struktur Tabel Pemantauan
Aktivitas ping dicatat pada tabel khusus. Agar data tidak membengkak, tabel ini HANYA menyimpan 1 baris data (singleton) yang akan selalu ditimpa (overwritten).
- **Nama Tabel**: `PingMonitoring`
- **Kolom Wajib Primer**:
    - `id`: `TEXT` (Hardcoded primary key, contoh: 'singleton-ping-monitor').
    - `ping_at`: `DATETIME` (Waktu eksekusi ping terakhir).
    - `status`: `TEXT` (Status keberhasilan: 'SUCCESS', 'FAILED').
    - `message`: `TEXT` (Pesan detail atau error jika ada).
    - `triggered_by`: `TEXT` (Sumber pemicu: 'CRON', 'SYSTEM', 'MANUAL').
- **Kolom Audit Trail** (Sesuai Aturan Database Dasar):
    - `created_at`, `created_by`, `created_timezone`
    - `updated_at`, `updated_by`, `updated_timezone`

## 3. Implementasi Cron (Server-Side)
Karena aplikasi difasilitasi dengan `server.ts` (Express), mekanisme dijalankan via Cron Server:
- **Libary**: `node-cron`.
- **Logika Eksekusi (UPSERT)**:
  Sistem mengeksekusi perintah SQL `ON CONFLICT` untuk memastikan hanya ada satu row yang terbarui:
  ```sql
  INSERT INTO PingMonitoring (id, status, message, triggered_by, ping_at)
  VALUES ('singleton-ping-monitor', ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    status = excluded.status,
    message = excluded.message,
    triggered_by = excluded.triggered_by,
    ping_at = excluded.ping_at
  ```

## 4. Penanganan Kegagalan
Jika ping gagal:
- Tetap dicoba mencatat ke database dengan status 'FAILED' (jika koneksi parsial memungkinkan).
- Notifikasi dikoordinasikan lewat `errorService.ts` untuk pantauan Developer.

---
*Dibuat untuk memastikan ketersediaan data secara real-time dan mencegah downtime database dengan footprint penyimpanan minimal.*
