-- Table: customer
-- Description: Menyimpan data pembeli/pelanggan untuk modul Customer.
-- Standard: Mengikuti aturan DatabaseRule.md

CREATE TABLE IF NOT EXISTS customer (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data Customer
    name TEXT NOT NULL,
    company TEXT,
    telepon TEXT NOT NULL,
    email TEXT,
    latlong TEXT NOT NULL, -- Format: "latitude,longitude"
    alamat TEXT NOT NULL,
    bidang_usaha TEXT,
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                -- UUID User pembuat
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta'
);

-- Index untuk mempermudah pencarian nama
CREATE INDEX IF NOT EXISTS idx_customer_name ON customer(name);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'customer_update_audit') THEN
        CREATE TRIGGER customer_update_audit
            BEFORE UPDATE ON customer
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
