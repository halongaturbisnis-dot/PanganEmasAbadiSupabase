# Strategi Migrasi Database: Turso (LibSQL) ke Supabase (PostgreSQL)

Dokumen ini berfungsi sebagai **Single Source of Truth (SSOT)** untuk proses migrasi database guna meningkatkan skalabilitas dan efisiensi resource (RAM/CPU).

## 1. Alasan Strategis
- **Skalabilitas**: PostgreSQL menangani dataset besar dan konkurensi tinggi lebih baik daripada SQLite/LibSQL.
- **Efisiensi Resource**: Menghindari *Full Table Scan* melalui mekanisme indexing PostgreSQL yang lebih advanced (GIN, GiST, BRIN).
- **Fitur Ekosistem**: Memanfaatkan Row Level Security (RLS) dan Real-time Subscriptions secara native.

## 2. Pemetaan Teknis (SQLite vs PostgreSQL)

| Fitur | Turso/SQLite (Lama) | Supabase/PostgreSQL (Baru) |
| :--- | :--- | :--- |
| **UUID Generator** | `lower(hex(randomblob(4)))...` | `gen_random_uuid()` atau `uuid_generate_v4()` |
| **Audit Trigger** | `BEFORE/AFTER UPDATE ON ...` | `CREATE FUNCTION` + `CREATE TRIGGER` |
| **Full Text Search** | FTS5 Virtual Tables | GIN Index + `tsvector` |
| **Indeks Default** | B-Tree | B-Tree (Lebih optimal untuk data besar) |
| **Tipe Data JSON** | String (TEXT) | Native JSONB (Indexing didukung) |

## 3. Langkah-Langkah Migrasi

### Fase 1: Persiapan Skema (DDL)
1.  Menyelaraskan seluruh file di `/database/*.sql` dengan sintaks PostgreSQL.
2.  Menjamin standar **Audit Trail** (`created_at`, `updated_at`, `created_by`) tetap terjaga menggunakan standar SQL PostgreSQL.
3.  Implementasi GIN Index pada tabel-tabel transaksional besar (Penjualan, Stok, Customer).

### Fase 2: Infrastruktur & Koneksi
1.  Update `.env.example` untuk menyertakan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
2.  Modifikasi `src/logic/utils/config.ts` untuk memvalidasi kredensial baru.
3.  Refaktor `src/logic/libs/database.ts` agar `dbClient` mengarah ke Supabase Instance.

### Fase 3: Refaktor Service (Modular Monolith)
1.  Memastikan `baseService.ts` mendukung query builder Supabase untuk mendukung *Rural Fetching* (Infinite Scroll) sesuai `GUIDANCE/FetchingRule.md`.
2.  Migrasi logic manual SQL di service-service spesifik (misal: `piutangService.ts`) agar menggunakan dialek PostgreSQL.

### Fase 4: Otomatisasi Migrasi Data
1.  Pembuatan script `migrate_to_supabase.ts` (idempotent).
2.  Script akan membaca skema dari folder `/database/` dan menerapkan indeks secara otomatis.

## 4. Keamanan & Performa
- **Indexting**: Setiap query filter wajib memiliki index pendukung (B-Tree atau Gin).
- **CPU/RAM Guard**: Penggunaan `LIMIT` dan `OFFSET` (atau keyset pagination) wajib diterapkan pada semua list view untuk mencegah *memory spikes*.
- **Connection Management**: Memanfaatkan connection pooling dari Supabase untuk menjaga kestabilan backend.

---

*Dibuat oleh AI Developer sebagai panduan implementasi berkelanjutan.*
