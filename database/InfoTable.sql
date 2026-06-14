-- Table: info
-- Description: Menyimpan data informasi perusahaan (alamat, no_telepon) secara terpusat.
-- Standard: Mengikut aturan DatabaseRule.md

CREATE TABLE IF NOT EXISTS info (
    id TEXT PRIMARY KEY DEFAULT '1',
    alamat TEXT NOT NULL,
    no_telepon TEXT NOT NULL,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta'
);

-- Inisialisasi baris pertama jika belum ada
INSERT INTO info (id, alamat, no_telepon) 
SELECT '1', 'Alamat Perusahaan Belum Disetel', '-'
WHERE NOT EXISTS (SELECT 1 FROM info WHERE id = '1');

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'info_update_audit') THEN
        CREATE TRIGGER info_update_audit
            BEFORE UPDATE ON info
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
