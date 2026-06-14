-- Table: stok_berjalan
-- Description: Master data produk dan ringkasan stok berjalan (Running Stock).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS stok_berjalan (
    -- Identitas Unik (UUID v4) 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- DATA MASTER PRODUK (Mandatory)
    sku TEXT NOT NULL UNIQUE,           -- Stock Keeping Unit
    category TEXT NOT NULL,             -- Kategori Produk
    sub_category TEXT NOT NULL,         -- Sub-Kategori Produk
    name TEXT NOT NULL,                 -- Nama Produk
    unit TEXT NOT NULL,                 -- Satuan (kg, pcs, box, dll)
    
    -- DATA STOK OPNAME TERAKHIR (Persistent / Snapshot)
    last_so_datetime TIMESTAMPTZ,          -- Waktu SO terakhir dilakukan
    qty_so DOUBLE PRECISION DEFAULT 0,              -- Hasil qty fisik saat SO terakhir
    
    -- HARGA ACUAN (Persistent)
    base_price DOUBLE PRECISION NOT NULL DEFAULT 0, -- Harga dasar untuk valuasi awal
    
    -- SOFT DELETE (Active/Inactive Status)
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                -- UUID User pembuat
    created_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                                -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta'     -- Standar IANA sesuai TimeRule.md
);

-- INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_stok_berjalan_sku ON stok_berjalan(sku);
CREATE INDEX IF NOT EXISTS idx_stok_berjalan_category ON stok_berjalan(category);
CREATE INDEX IF NOT EXISTS idx_stok_berjalan_sub_category ON stok_berjalan(sub_category);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'stok_berjalan_update_audit') THEN
        CREATE TRIGGER stok_berjalan_update_audit
            BEFORE UPDATE ON stok_berjalan
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
