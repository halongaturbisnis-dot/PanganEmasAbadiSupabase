-- Module: Klaim Retur
-- Description: Database schema for 'Klaim Retur' (Return Claim) module.
-- Contains tables for: klaim_retur and klaim_retur_item.
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, StorageRule.md

-- ==========================================
-- 1. Table: klaim_retur
-- ==========================================
CREATE TABLE IF NOT EXISTS klaim_retur (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- DATA TRANSAKSI
    datetime TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invoice_number TEXT NOT NULL,       
    penjualan_id UUID NOT NULL,         
    customer_id UUID NOT NULL,          
    
    -- RINGKASAN KLAIM
    sum_total_refund_nominal DOUBLE PRECISION NOT NULL DEFAULT 0, 
    description TEXT,                   
    proof_url TEXT,                     
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- CONSTRAINT RELASI
    FOREIGN KEY (penjualan_id) REFERENCES penjualan(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_klaim_retur_invoice_number ON klaim_retur(invoice_number);
CREATE INDEX IF NOT EXISTS idx_klaim_retur_penjualan_id ON klaim_retur(penjualan_id);
CREATE INDEX IF NOT EXISTS idx_klaim_retur_customer_id ON klaim_retur(customer_id);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'klaim_retur_update_audit') THEN
        CREATE TRIGGER klaim_retur_update_audit
            BEFORE UPDATE ON klaim_retur
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==========================================
-- 2. Table: klaim_retur_item
-- ==========================================
CREATE TABLE IF NOT EXISTS klaim_retur_item (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    klaim_retur_id UUID NOT NULL,       
    penjualan_produk_id UUID NOT NULL,  
    
    -- DATA PRODUK
    name TEXT NOT NULL,                 
    unit TEXT NOT NULL,                 
    qty DOUBLE PRECISION NOT NULL,                  
    
    -- DETAIL KLAIM
    reason TEXT,                        
    proof_url TEXT,                     
    policy TEXT NOT NULL CHECK(policy IN ('Replace', 'Refund')), 
    refund_nominal DOUBLE PRECISION DEFAULT 0,      
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- CONSTRAINT RELASI
    FOREIGN KEY (klaim_retur_id) REFERENCES klaim_retur(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (penjualan_produk_id) REFERENCES penjualan_produk(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_klaim_retur_item_header ON klaim_retur_item(klaim_retur_id);
CREATE INDEX IF NOT EXISTS idx_klaim_retur_item_produk ON klaim_retur_item(penjualan_produk_id);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'klaim_retur_item_update_audit') THEN
        CREATE TRIGGER klaim_retur_item_update_audit
            BEFORE UPDATE ON klaim_retur_item
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
