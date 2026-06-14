-- Module: Penyerahan
-- Description: Database schema for Penyerahan module (handover of sold goods).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, StorageRule.md

CREATE TABLE IF NOT EXISTS penyerahan (
    -- Identitas Unik (UUID v4) conforme standards
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    penjualan_id UUID NOT NULL,
    
    -- DATA PENYERAHAN
    penyerahan_type TEXT NOT NULL CHECK(penyerahan_type IN ('Loco', 'Franco')),
    surat_jalan_number TEXT, 
    datetime TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    handover_datetime TIMESTAMPTZ, 
    recipient_name TEXT,
    description TEXT,
    
    -- DATA FRANCO
    shipping_method TEXT,
    vehicle_number TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    driver_user_id UUID,
    resi_number TEXT,
    
    -- DATA GEOTAGGING HANDOVER
    handover_lat DOUBLE PRECISION,
    handover_lng DOUBLE PRECISION,
    handover_distance DOUBLE PRECISION, 
    handover_address TEXT,
    
    -- LAMPIRAN BUKTI & STATUS
    proof_fileurls TEXT DEFAULT '[]', 
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Ready', 'On Delivery', 'Completed', 'Cancelled')),
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- CONSTRAINT RELASI
    FOREIGN KEY (penjualan_id) REFERENCES penjualan(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_penyerahan_penjualan_id ON penyerahan(penjualan_id);
CREATE INDEX IF NOT EXISTS idx_penyerahan_status ON penyerahan(status);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'penyerahan_update_audit') THEN
        CREATE TRIGGER penyerahan_update_audit
            BEFORE UPDATE ON penyerahan
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
