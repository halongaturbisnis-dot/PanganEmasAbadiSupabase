-- Table: pembelian, pembelian_produk, pembelian_biaya
-- Description: Skema database untuk modul Pembelian (Procurement).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

-- ============================================================================
-- A. TABEL UTAMA: pembelian
-- ============================================================================

CREATE TABLE IF NOT EXISTS pembelian (
    -- Identitas Unik (UUID v4) conforme standards
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    datetime TIMESTAMPTZ NOT NULL,
    po_number TEXT NOT NULL UNIQUE,
    additional_description TEXT,
    supplier_id UUID NOT NULL,
    sum_product_price DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(sum_product_price >= 0),
    sum_added_cost DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(sum_added_cost >= 0),
    grand_total_price DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(grand_total_price >= 0),
    payment_type TEXT NOT NULL CHECK(payment_type IN ('lunas', 'tempo')),
    deposit DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(deposit >= 0),
    outstanding DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(outstanding >= 0),
    sla_date TIMESTAMPTZ,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Tunai', 'Non Tunai')),
    bank_and_cash_id UUID NOT NULL,
    shipping_type TEXT NOT NULL CHECK(shipping_type IN ('Internal', 'Customer')),
    customer_id UUID,
    proof_fileurl TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('draft', 'pending', 'completed', 'cancelled')),
    
    -- Relasi Dropship
    penjualan_id UUID, 

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta', 
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- Relationships
    FOREIGN KEY (supplier_id) REFERENCES suplier(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (bank_and_cash_id) REFERENCES bank_and_cash(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- B. TABEL DETIL: pembelian_produk
-- ============================================================================

CREATE TABLE IF NOT EXISTS pembelian_produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL,
    datetime TIMESTAMPTZ NOT NULL,
    po_number TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    qty DOUBLE PRECISION NOT NULL CHECK(qty > 0),
    price_per_unit DOUBLE PRECISION NOT NULL CHECK(price_per_unit >= 0),
    sum_price DOUBLE PRECISION NOT NULL CHECK(sum_price >= 0),
    kadar_air DOUBLE PRECISION,

    -- Relasi Dropship
    penjualan_produk_id UUID,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- Relationships
    FOREIGN KEY (purchase_id) REFERENCES pembelian(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- C. TABEL DETIL: pembelian_biaya
-- ============================================================================

CREATE TABLE IF NOT EXISTS pembelian_biaya (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL,
    datetime TIMESTAMPTZ NOT NULL,
    po_number TEXT NOT NULL,
    type TEXT NOT NULL,
    cost DOUBLE PRECISION NOT NULL CHECK(cost >= 0),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',
    FOREIGN KEY (purchase_id) REFERENCES pembelian(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- INDEXING
CREATE INDEX IF NOT EXISTS idx_pembelian_datetime ON pembelian(datetime);
CREATE INDEX IF NOT EXISTS idx_pembelian_po_number ON pembelian(po_number);
CREATE INDEX IF NOT EXISTS idx_pembelian_supplier_id ON pembelian(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pembelian_customer_id ON pembelian(customer_id);
CREATE INDEX IF NOT EXISTS idx_pembelian_bank_and_cash_id ON pembelian(bank_and_cash_id);

CREATE INDEX IF NOT EXISTS idx_pembelian_produk_purchase_id ON pembelian_produk(purchase_id);
CREATE INDEX IF NOT EXISTS idx_pembelian_produk_po_number ON pembelian_produk(po_number);

CREATE INDEX IF NOT EXISTS idx_pembelian_biaya_purchase_id ON pembelian_biaya(purchase_id);
CREATE INDEX IF NOT EXISTS idx_pembelian_biaya_po_number ON pembelian_biaya(po_number);

-- Triggers for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pembelian_update_audit') THEN
        CREATE TRIGGER pembelian_update_audit
            BEFORE UPDATE ON pembelian
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pembelian_produk_update_audit') THEN
        CREATE TRIGGER pembelian_produk_update_audit
            BEFORE UPDATE ON pembelian_produk
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pembelian_biaya_update_audit') THEN
        CREATE TRIGGER pembelian_biaya_update_audit
            BEFORE UPDATE ON pembelian_biaya
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
