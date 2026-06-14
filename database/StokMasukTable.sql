-- Table: stok_masuk
-- Description: Mencatat setiap transaksi stok yang masuk ke gudang (berasal dari pembelian atau pemrosesan).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS stok_masuk (
    -- Identitas Unik (UUID v4) conforme standards
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- KEBUTUHAN RELASI DATABASE (Optional for manual entry)
    purchase_id UUID,                 -- FK ke pembelian.id
    purchase_product_id UUID,         -- FK ke pembelian_produk.id
    receiving_id UUID,                -- FK ke penerimaan.id
    processing_id UUID,               -- FK ke pemrosesan.id
    
    -- DATA ATRIBUT PRODUK (Mandatory)
    sku TEXT NOT NULL,                  -- SKU Produk (Relasi ke stok_berjalan.sku)
    category TEXT NOT NULL,             -- Kategori
    sub_category TEXT,                  -- Sub Kategori (Optional)
    name TEXT NOT NULL,                 -- Nama Produk
    unit TEXT NOT NULL,                 -- Satuan (kg, pcs, dll)
    
    -- DATA KUANTITAS & HARGA (Mandatory)
    qty_in DOUBLE PRECISION NOT NULL CHECK(qty_in >= 0),
    price_per_unit_in DOUBLE PRECISION NOT NULL CHECK(price_per_unit_in >= 0),
    total_price_in DOUBLE PRECISION NOT NULL CHECK(total_price_in >= 0),
    
    -- MOVING AVERAGE PRICE (Valuasi Baru)
    new_running_stock_price_per_unit DOUBLE PRECISION NOT NULL CHECK(new_running_stock_price_per_unit >= 0),
    
    -- DESKRIPSI (Optional)
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
CREATE INDEX IF NOT EXISTS idx_stok_masuk_sku ON stok_masuk(sku);
CREATE INDEX IF NOT EXISTS idx_stok_masuk_purchase_id ON stok_masuk(purchase_id);
CREATE INDEX IF NOT EXISTS idx_stok_masuk_receiving_id ON stok_masuk(receiving_id);
CREATE INDEX IF NOT EXISTS idx_stok_masuk_processing_id ON stok_masuk(processing_id);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'stok_masuk_update_audit') THEN
        CREATE TRIGGER stok_masuk_update_audit
            BEFORE UPDATE ON stok_masuk
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
