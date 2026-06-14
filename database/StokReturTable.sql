-- Table: stok_retur
-- Description: Mencatat setiap transaksi stok retur (pengembalian barang) dari customer atau ke suplier.
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS stok_retur (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- DATA ATRIBUT PRODUK (Mandatory)
    sku TEXT NOT NULL,                  -- SKU Produk (Relasi ke stok_berjalan.sku)
    category TEXT NOT NULL,             -- Kategori Produk
    sub_category TEXT,                  -- Sub-Kategori Produk
    name TEXT NOT NULL,                 -- Nama Produk
    unit TEXT NOT NULL,                 -- Satuan
    
    -- DATA KUANTITAS & HARGA (Mandatory)
    qty DOUBLE PRECISION NOT NULL CHECK(qty >= 0),
    price_per_unit_in DOUBLE PRECISION NOT NULL CHECK(price_per_unit_in >= 0),
    total_price_in DOUBLE PRECISION NOT NULL CHECK(total_price_in >= 0),
    
    -- DESKRIPSI DAN ALASAN RETUR (Optional)
    description TEXT,
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                -- UUID User pembuat
    created_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                                -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md

    -- Integritas Referensial
    FOREIGN KEY (sku) REFERENCES stok_berjalan(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

-- INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_stok_retur_sku ON stok_retur(sku);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'stok_retur_update_audit') THEN
        CREATE TRIGGER stok_retur_update_audit
            BEFORE UPDATE ON stok_retur
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
