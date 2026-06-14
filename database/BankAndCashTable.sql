-- Table: bank_and_cash
-- Description: Menyimpan data Kas & Bank untuk transaksi finansial.
-- Standard: Mengikuti aturan DatabaseRule.md

CREATE TABLE IF NOT EXISTS bank_and_cash (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data Utama
    nama_akun TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK(tipe IN ('Kas', 'Bank')),
    
    -- Data Bank (Mandatory jika tipe = 'Bank')
    nama_bank TEXT, 
    nomor_rekening TEXT,
    nama_pemilik TEXT,
    
    -- Status & Proteksi
    is_default INTEGER NOT NULL DEFAULT 0, -- 1 = Default, 0 = Tidak
    is_deletable INTEGER NOT NULL DEFAULT 1, -- 1 = Boleh hapus, 0 = Terproteksi
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta'
);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'bank_and_cash_update_audit') THEN
        CREATE TRIGGER bank_and_cash_update_audit
            BEFORE UPDATE ON bank_and_cash
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Inisialisasi Data Default "Cash" (Kas)
-- Data ini tidak boleh dihapus dan merupakan data kas fisik utama.
INSERT INTO bank_and_cash (
    nama_akun, 
    tipe, 
    is_default, 
    is_deletable
) 
SELECT 'Cash', 'Kas', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM bank_and_cash WHERE nama_akun = 'Cash' AND tipe = 'Kas');
