-- Table: penerimaan
-- Description: Skema database untuk modul Penerimaan (Receipt) Produk.
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS penerimaan (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- KEBUTUHAN RELASI DATABASE (Mandatory)
    purchase_id UUID NOT NULL,          -- FK ke pembelian.id
    purchase_product_id UUID NOT NULL,  -- FK ke pembelian_produk.id
    shipping_id UUID NOT NULL,          -- FK ke pengiriman.id
    
    -- Tanggal & Waktu
    datetime TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Sorting Type (Mandatory)
    sorting_type TEXT NOT NULL CHECK(sorting_type IN ('Non QC', 'QC')),
    
    -- Rejection Data
    qty_rejection DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(qty_rejection >= 0),
    rejected_valuation DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(rejected_valuation >= 0),
    rejected_reason TEXT,
    rejected_proof_url TEXT,            -- Multiple files JSON string
    
    -- Acceptance Data
    qty_received_actual DOUBLE PRECISION NOT NULL CHECK(qty_received_actual >= 0),
    qty_diff DOUBLE PRECISION NOT NULL DEFAULT 0,
    accepted_valuation DOUBLE PRECISION NOT NULL CHECK(accepted_valuation >= 0),
    price_per_unit_accepted DOUBLE PRECISION NOT NULL CHECK(price_per_unit_accepted >= 0),
    
    -- Quality Attributes
    actual_moisture DOUBLE PRECISION,               -- Kadar air aktual
    
    -- Additional Metadata
    description TEXT,
    receipt_proof_url TEXT NOT NULL,    -- Multiple files JSON string (Mandatory)
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                -- UUID User pembuat
    created_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                                -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    -- Relationships
    FOREIGN KEY (purchase_id) REFERENCES pembelian(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (purchase_product_id) REFERENCES pembelian_produk(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_penerimaan_datetime ON penerimaan(datetime);
CREATE INDEX IF NOT EXISTS idx_penerimaan_purchase_id ON penerimaan(purchase_id);
CREATE INDEX IF NOT EXISTS idx_penerimaan_purchase_product_id ON penerimaan(purchase_product_id);
CREATE INDEX IF NOT EXISTS idx_penerimaan_shipping_id ON penerimaan(shipping_id);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'penerimaan_update_audit') THEN
        CREATE TRIGGER penerimaan_update_audit
            BEFORE UPDATE ON penerimaan
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
