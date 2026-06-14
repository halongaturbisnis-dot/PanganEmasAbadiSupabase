-- Table: stok_opname
-- Description: Menyimpan data pencatatan Stok Opname (Audit stok fisik vs sistem)

CREATE TABLE IF NOT EXISTS stok_opname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_so TEXT NOT NULL,
    sku TEXT NOT NULL,
    qty_system INTEGER NOT NULL,
    qty_actual INTEGER NOT NULL,
    qty_diff INTEGER NOT NULL,
    harga_per_unit DOUBLE PRECISION DEFAULT 0,
    total_valuasi_aktual DOUBLE PRECISION DEFAULT 0,
    total_valuasi_selisih DOUBLE PRECISION DEFAULT 0,
    notes TEXT,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_timezone TEXT,

    FOREIGN KEY (sku) REFERENCES stok_berjalan(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indeks untuk mempercepat pencarian berdasarkan SKU dan Nomor SO
CREATE INDEX IF NOT EXISTS idx_stok_opname_sku ON stok_opname(sku);
CREATE INDEX IF NOT EXISTS idx_stok_opname_no_so ON stok_opname(no_so);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'stok_opname_update_audit') THEN
        CREATE TRIGGER stok_opname_update_audit
            BEFORE UPDATE ON stok_opname
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
