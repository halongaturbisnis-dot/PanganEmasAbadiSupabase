-- Table: akun
-- Description: Menyimpan data akun pengguna untuk autentikasi dan otorisasi modul.
-- Standard: Mengikut aturan DatabaseRule.md dan StorageRule.md (untuk foto profil)

CREATE TABLE IF NOT EXISTS akun (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Kredensial & Identitas
    kode_akses TEXT NOT NULL UNIQUE, -- Digunakan untuk Login
    password TEXT NOT NULL,         -- Hash password (disarankan hash di level aplikasi)
    username TEXT NOT NULL,
    foto_profil TEXT,               -- URL file di Tigris Storage
    telepon TEXT,
    
    -- Otorisasi
    jabatan TEXT NOT NULL,
    peran TEXT NOT NULL CHECK(peran IN ('User', 'Admin', 'Guest')),
    akses_modul TEXT NOT NULL,      -- Array JSON berisi daftar modul yang diizinkan
    has_invoice_approval INTEGER DEFAULT 0, -- 1 jika memiliki hak akses invoice approval, 0 jika tidak
    is_active INTEGER DEFAULT 1,    -- 1 jika Aktif, 0 jika Non-Aktif
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                -- UUID User pembuat (Null jika pendaftaran mandiri/pertama)
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta'
);

-- Index untuk performa login
CREATE INDEX IF NOT EXISTS idx_akun_kode_akses ON akun(kode_akses);

-- Trigger Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'akun_update_audit') THEN
        CREATE TRIGGER akun_update_audit
            BEFORE UPDATE ON akun
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
