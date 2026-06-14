-- Table: daftar_harga
-- Description: Master data daftar harga produk dengan dukungan harga bertingkat (Tiered Pricing/Grosir).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS daftar_harga (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- REFERENSI PRODUK (Relasi ke stok_berjalan)
    sku TEXT NOT NULL UNIQUE,           -- Stock Keeping Unit
    product_id UUID NOT NULL,           -- ID Produk (Internal System ID)
    
    -- DATA MASTER TAMBAHAN
    category TEXT NOT NULL,             -- Kategori Produk
    sub_category TEXT NOT NULL,         -- Sub-Kategori Produk
    name TEXT NOT NULL,                 -- Nama Produk
    unit TEXT NOT NULL,                 -- Satuan
    
    -- HARGA BERTINGKAT
    tiered_pricing TEXT NOT NULL DEFAULT '[]', 
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                -- UUID User pembuat
    created_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                                -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md

    -- CONSTRAINT RELASI
    FOREIGN KEY (sku) REFERENCES stok_berjalan(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

-- INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_daftar_harga_sku ON daftar_harga(sku);
CREATE INDEX IF NOT EXISTS idx_daftar_harga_product_id ON daftar_harga(product_id);
CREATE INDEX IF NOT EXISTS idx_daftar_harga_category ON daftar_harga(category);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'daftar_harga_update_audit') THEN
        CREATE TRIGGER daftar_harga_update_audit
            BEFORE UPDATE ON daftar_harga
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
