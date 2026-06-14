-- Table: suplier
-- Description: Menyimpan data suplier untuk modul Pengadaan.
-- Standard: Mengikuti aturan DatabaseRule.md

CREATE TABLE IF NOT EXISTS suplier (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data Suplier
    name TEXT NOT NULL,
    telepon TEXT NOT NULL,
    email TEXT,
    latlong TEXT NOT NULL,                -- Format: "latitude,longitude"
    alamat TEXT NOT NULL,                
    bank_name TEXT,
    no_rekening TEXT,
    nama_pemilik_rekening TEXT,                
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta'
);

-- Buat Index
CREATE INDEX IF NOT EXISTS idx_suplier_name ON suplier(name);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'suplier_update_audit') THEN
        CREATE TRIGGER suplier_update_audit
            BEFORE UPDATE ON suplier
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
