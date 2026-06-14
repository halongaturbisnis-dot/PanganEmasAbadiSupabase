---

# Aturan Database (DatabaseRule)

Dokumen ini mengatur standar dan integritas data untuk aplikasi yang menggunakan **Turso (LibSQL)** sebagai database utama. Seluruh pengembangan skema, perubahan struktur, dan manipulasi data wajib mengikuti aturan ini.

## 1. Identitas Unik (Unique UUID)

Setiap baris data dalam tabel wajib memiliki kolom identitas unik berupa UUID v4 yang digenerate langsung oleh database engine LibSQL.

* **Tipe Data**: `TEXT`
* **Implementasi SQL**:

```sql
id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))

```

## 2. Audit Trail (Jejak Audit)

Setiap tabel wajib memiliki kolom audit trail untuk mencatat riwayat pembuatan dan perubahan data menggunakan waktu aktual di level database.

### Pembuatan (Creation)

* `created_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`
* `created_by`: `TEXT` (UUID User)
* `created_timezone`: `TEXT` (IANA Identifier lokasi asli user, misal: `'Asia/Jakarta'`, `'Europe/London'`).

### Pembaruan (Update)

* `updated_at`: `DATETIME`
* `updated_by`: `TEXT` (UUID User)
* `updated_timezone`: `TEXT` (IANA Identifier lokasi asli user).

### Implementasi Trigger Pembaruan

Wajib menggunakan native SQLite/LibSQL Trigger untuk memperbarui `updated_at` secara otomatis saat terjadi operasi `UPDATE`.

```sql
CREATE TRIGGER IF NOT EXISTS [table_name]_update_audit
AFTER UPDATE ON [table_name]
FOR EACH ROW
BEGIN
  UPDATE [table_name] 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = OLD.id;
END;

```

## 3. Integritas Referensial (Referential Integrity)

Hubungan antar tabel (Foreign Keys) di Turso wajib didefinisikan secara eksplisit dengan aksi penanganan relasi:

* **ON DELETE CASCADE**: Jika data induk dihapus, data anak (child) wajib ikut terhapus otomatis.
* **ON UPDATE CASCADE**: Jika kunci utama induk berubah, kunci tamu (foreign key) pada anak otomatis diperbarui.

## 4. Evolusi Skema & Migrasi Data Idempotent

Turso (LibSQL) tidak mendukung `ALTER TABLE` untuk operasi kompleks seperti memodifikasi tipe kolom, mengubah constraint, atau menghapus kolom secara langsung. Perubahan skema wajib ditulis agar bersifat *idempotent* dan aman terhadap data yang sudah ada (*existing*).

### A. Penambahan Kolom Baru (Add Column)

Gunakan `ALTER TABLE` standar. Kolom baru wajib bersifat `NULL` atau memiliki nilai `DEFAULT` agar data *existing* tidak memicu error constraint.

```sql
ALTER TABLE [table_name] ADD COLUMN [column_name] [type] DEFAULT [value];

```

### B. Perubahan Kompleks (Hapus Kolom, Ubah Tipe Data, Ubah Constraint)

Untuk memodifikasi tabel yang sudah berisi data, gunakan metode **Shadow Table Re-creation** yang dikombinasikan dengan **Baseline Handler**. Pola ini menjamin skema selalu update baik pada database kosong maupun database yang sudah berisi data lama (*Migrasi Idempotent*).

**Template Prosedur Migrasi Turso:**

```sql
-- 1. Mulai transaksi aman level database
BEGIN TRANSACTION;

-- 2. Nonaktifkan foreign key check untuk mempermudah manipulasi tabel relasional
PRAGMA foreign_keys = OFF;

-- 3. [PENTING] Handler Baseline: Pastikan tabel target ada (minimal struktur ID)
-- Tujuannya agar klausa SELECT/INSERT di langkah berikutnya tidak error jika dijalankan pada database baru/kosong.
CREATE TABLE IF NOT EXISTS [table_name] (
    id TEXT PRIMARY KEY
);

-- 4. Buat tabel bayangan dengan skema FINAL/Paling Update
CREATE TABLE IF NOT EXISTS [table_name]_new (
    id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' || 
        lower(hex(randomblob(2))) || '-4' || 
        substr(lower(hex(randomblob(2))), 2) || '-' || 
        substr('89ab', abs(random()) % 4 + 1, 1) || 
        substr(lower(hex(randomblob(2))), 2) || '-' || 
        lower(hex(randomblob(6)))
    ),
    [seluruh_kolom_final_termasuk_yang_baru]
);

-- 5. Kloning data dari tabel existing ke tabel baru
-- WAJIB menggunakan pemilihan kolom secara EKSPLISIT. DILARANG menggunakan SELECT *
INSERT INTO [table_name]_new (id, [kolom_lama_yang_ingin_dipertahankan])
SELECT id, [kolom_lama_yang_ingin_dipertahankan]
FROM [table_name];

-- [PENTING] Penanganan Kolom Baru dalam Migrasi:
-- Jika Anda baru saja menambahkan kolom baru di langkah 4, JANGAN sertakan kolom baru tersebut 
-- dalam klausa SELECT di langkah 5 untuk data lama (karena akan error 'no such column').
-- Nilai kolom baru untuk data lama secara teknis akan tetap NULL/Default sesuai definisi di langkah 4.

-- 6. Hapus tabel lama (yang out-of-date atau yang baru dibuat baseline-nya)
DROP TABLE IF EXISTS [table_name];

-- 7. Ubah nama tabel bayangan menjadi nama tabel utama
ALTER TABLE [table_name]_new RENAME TO [table_name];

-- 8. Daftarkan ulang trigger audit trail
CREATE TRIGGER IF NOT EXISTS [table_name]_update_audit
AFTER UPDATE ON [table_name]
FOR EACH ROW
BEGIN
  UPDATE [table_name] SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 9. Aktifkan kembali pengecekan foreign key
PRAGMA foreign_keys = ON;

-- 10. Eksekusi permanen (Commit)
COMMIT;

```

## 5. Metadata Lokasi File

Seluruh skema database utama wajib didokumentasikan, dilacak pada version control, dan diperbarui secara berkala pada file:
`/database/schema.sql`

---

*Dibuat untuk menjamin keamanan, integritas, dan kemudahan audit data pada sistem berbasis Turso (LibSQL).*

---