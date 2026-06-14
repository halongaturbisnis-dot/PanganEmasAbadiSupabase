-- Table: pengiriman
-- Description: Skema database untuk modul Pengiriman (Logistik).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS pengiriman (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ID Pembelian (Mandatory)
    purchase_id UUID NOT NULL,
    
    -- Tanggal & Waktu Pengiriman
    datetime TIMESTAMPTZ NOT NULL,
    
    -- Jenis Pengiriman (Mandatory)
    shipping_type TEXT NOT NULL,
    
    -- Keterangan Pengiriman (Optional)
    description TEXT,
    
    -- Informasi Kendaraan (Optional)
    vehicle_number TEXT,
    vehicle_type TEXT,
    
    -- Informasi Driver (Optional)
    driver_name TEXT,
    driver_phone TEXT,
    
    -- Status Pengiriman
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'shipped', 'delivered', 'cancelled')),
    
    -- Bukti Pengiriman
    proof_fileurl TEXT NOT NULL,
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                -- UUID User pembuat
    created_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                                -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    -- Relationships
    FOREIGN KEY (purchase_id) REFERENCES pembelian(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_pengiriman_datetime ON pengiriman(datetime);
CREATE INDEX IF NOT EXISTS idx_pengiriman_purchase_id ON pengiriman(purchase_id);
CREATE INDEX IF NOT EXISTS idx_pengiriman_status ON pengiriman(status);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pengiriman_update_audit') THEN
        CREATE TRIGGER pengiriman_update_audit
            BEFORE UPDATE ON pengiriman
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
