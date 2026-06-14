-- Module: Penjualan
-- Description: Database schema for Sales (Penjualan) module.
-- Contains tables for: penjualan, penjualan_produk, penjualan_produk_mixing, and penjualan_biaya.
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, StorageRule.md

-- ==========================================
-- 1. Table: penjualan
-- ==========================================
CREATE TABLE IF NOT EXISTS penjualan (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- DATA TRANSAKSI
    datetime TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sales_id UUID,                      -- Relasi ke marketing
    sales_name TEXT,                    -- Nama sales saat transaksi
    invoice_number TEXT NOT NULL UNIQUE, -- Nomor Invoice
    customer_id UUID NOT NULL,          -- Relasi ke table customer
    
    -- RINGKASAN FINANSIAL
    sum_product_price DOUBLE PRECISION NOT NULL DEFAULT 0, -- Total harga produk (subtotal)
    sum_added_cost DOUBLE PRECISION NOT NULL DEFAULT 0,    -- Total biaya tambahan
    discount_type TEXT DEFAULT 'price',        -- 'price' atau 'percent'
    discount_value DOUBLE PRECISION DEFAULT 0,             -- Nilai diskon
    discount_amount DOUBLE PRECISION DEFAULT 0,            -- Hasil nominal diskon dalam rupiah
    grand_total DOUBLE PRECISION NOT NULL DEFAULT 0,       -- (Total Produk + Biaya Tambahan) - Diskon
    
    -- STATUS PEMBAYARAN
    payment_type TEXT NOT NULL CHECK(payment_type IN ('Lunas', 'Tempo')),
    deposit DOUBLE PRECISION DEFAULT 0,             -- Uang muka jika tempo
    outstanding DOUBLE PRECISION DEFAULT 0,         -- Sisa tagihan jika tempo
    sla_date TIMESTAMPTZ,                  -- Tanggal jatuh tempo (jika tempo)
    
    -- METODE PEMBAYARAN & SUMBER DANA
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Tunai', 'Non Tunai')),
    bank_cash_source_id UUID NOT NULL,  -- Relasi ke bank_and_cash
    
    -- LAMPIRAN & KETERANGAN
    payment_proof_fileurls TEXT DEFAULT '[]', -- JSON string array URL bukti bayar
    keterangan TEXT,
    status TEXT DEFAULT 'Draft',        -- Draft, Confirmed, Cancelled, Completed
    invoice_pdf_url TEXT,               -- URL file PDF invoice yang di-generate
    
    -- APPROVAL WORKFLOW
    approver_id UUID,                   -- Relasi ke akun(id)
    approver_name TEXT,                 -- Nama approver saat dipilih
    approval_status TEXT CHECK(approval_status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    approval_signature_url TEXT,       -- URL tanda tangan approver
    approval_at TIMESTAMPTZ,               -- Tanggal approval
    approval_note TEXT,                 -- Catatan dari approver
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- CONSTRAINT RELASI
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (bank_cash_source_id) REFERENCES bank_and_cash(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_penjualan_invoice_number ON penjualan(invoice_number);
CREATE INDEX IF NOT EXISTS idx_penjualan_customer_id ON penjualan(customer_id);
CREATE INDEX IF NOT EXISTS idx_penjualan_datetime ON penjualan(datetime);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'penjualan_update_audit') THEN
        CREATE TRIGGER penjualan_update_audit
            BEFORE UPDATE ON penjualan
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==========================================
-- 2. Table: penjualan_produk
-- ==========================================
CREATE TABLE IF NOT EXISTS penjualan_produk (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    penjualan_id UUID NOT NULL,         -- Relasi ke penjualan(id)
    
    -- DATA PRODUK
    is_mixing INTEGER NOT NULL DEFAULT 0, -- 1 jika produk racikan/custom, 0 jika produk normal
    is_dropship INTEGER NOT NULL DEFAULT 0, -- 1 jika dropship
    sku TEXT,                           -- SKU (NULL jika custom mixing baru tanpa SKU master)
    name TEXT NOT NULL,                 -- Nama produk (diambil dari master atau inputan untuk custom)
    kategori TEXT,                      -- Kategori Produk (khusus dropship)
    sub_kategori TEXT,                  -- Sub Kategori Produk (khusus dropship)
    unit TEXT NOT NULL,                 -- Satuan
    qty DOUBLE PRECISION NOT NULL DEFAULT 0,
    
    -- HARGA & PROFIT SNAPSHOT (Contractual)
    unit_selling_price DOUBLE PRECISION NOT NULL,    -- Harga jual per unit saat transaksi
    unit_base_price DOUBLE PRECISION NOT NULL,       -- Harga HPP/Dasar saat transaksi
    total_selling_price DOUBLE PRECISION NOT NULL,   -- qty * unit_selling_price
    total_base_price DOUBLE PRECISION NOT NULL,      -- qty * unit_base_price
    margin_amount DOUBLE PRECISION NOT NULL,         -- profit nominal
    margin_percentage DOUBLE PRECISION NOT NULL,     -- profit persentase
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- CONSTRAINT RELASI
    FOREIGN KEY (penjualan_id) REFERENCES penjualan(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_penjualan_produk_penjualan_id ON penjualan_produk(penjualan_id);
CREATE INDEX IF NOT EXISTS idx_penjualan_produk_sku ON penjualan_produk(sku);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'penjualan_produk_update_audit') THEN
        CREATE TRIGGER penjualan_produk_update_audit
            BEFORE UPDATE ON penjualan_produk
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==========================================
-- 3. Table: penjualan_produk_mixing
-- ==========================================
CREATE TABLE IF NOT EXISTS penjualan_produk_mixing (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    penjualan_id UUID NOT NULL,
    penjualan_produk_id UUID NOT NULL,
    
    -- DATA KOMPOSISI
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    qty_composition DOUBLE PRECISION NOT NULL,
    total_qty DOUBLE PRECISION NOT NULL,
    
    -- SNAPSHOT HARGA BAHAN BAKU
    base_price_snapshot DOUBLE PRECISION NOT NULL,
    total_base_price DOUBLE PRECISION NOT NULL,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- CONSTRAINT RELASI
    FOREIGN KEY (penjualan_id) REFERENCES penjualan(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (penjualan_produk_id) REFERENCES penjualan_produk(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_penjualan_mixing_produk_id ON penjualan_produk_mixing(penjualan_produk_id);
CREATE INDEX IF NOT EXISTS idx_penjualan_mixing_sku ON penjualan_produk_mixing(sku);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'penjualan_produk_mixing_update_audit') THEN
        CREATE TRIGGER penjualan_produk_mixing_update_audit
            BEFORE UPDATE ON penjualan_produk_mixing
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS penjualan_biaya (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    penjualan_id UUID NOT NULL,
    
    -- DATA BIAYA
    nama_biaya TEXT NOT NULL,
    nominal DOUBLE PRECISION NOT NULL DEFAULT 0,
    keterangan TEXT,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- CONSTRAINT RELASI
    FOREIGN KEY (penjualan_id) REFERENCES penjualan(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_penjualan_biaya_penjualan_id ON penjualan_biaya(penjualan_id);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'penjualan_biaya_update_audit') THEN
        CREATE TRIGGER penjualan_biaya_update_audit
            BEFORE UPDATE ON penjualan_biaya
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
