-- Table: piutang, piutang_pembayaran
-- Description: Skema database untuk modul Piutang (Receivable).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

-- 1. Tabel Utama: piutang
CREATE TABLE IF NOT EXISTS piutang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    datetime TIMESTAMPTZ NOT NULL,
    
    name TEXT NOT NULL,
    
    description TEXT,
    
    category TEXT NOT NULL CHECK(category IN ('Penjualan', 'Pinjaman', 'Operasional', 'Lainnya')),
    
    sales_id UUID, 
    
    entity_name TEXT NOT NULL, 
    
    principal_amount DOUBLE PRECISION NOT NULL CHECK(principal_amount >= 0),
    
    paid_amount DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(paid_amount >= 0),
    
    outstanding_amount DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(outstanding_amount >= 0),
    
    due_date TIMESTAMPTZ,
    
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Settled', 'Cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta'
);

-- 2. Tabel Detil: piutang_pembayaran
CREATE TABLE IF NOT EXISTS piutang_pembayaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    piutang_id UUID NOT NULL,
    
    payment_date TIMESTAMPTZ NOT NULL,
    
    amount DOUBLE PRECISION NOT NULL CHECK(amount > 0),
    
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Tunai', 'Non Tunai')),
    
    bank_and_cash_id UUID NOT NULL,
    
    income_id UUID, 
    
    description TEXT,
    
    proof_urls TEXT,
    
    next_sla TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    FOREIGN KEY (piutang_id) REFERENCES piutang(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (bank_and_cash_id) REFERENCES bank_and_cash(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (income_id) REFERENCES pemasukan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- INDEX
CREATE INDEX IF NOT EXISTS idx_piutang_datetime ON piutang(datetime);
CREATE INDEX IF NOT EXISTS idx_piutang_due_date ON piutang(due_date);
CREATE INDEX IF NOT EXISTS idx_piutang_sales_id ON piutang(sales_id);
CREATE INDEX IF NOT EXISTS idx_piutang_status ON piutang(status);

CREATE INDEX IF NOT EXISTS idx_piutang_pay_piutang_id ON piutang_pembayaran(piutang_id);
CREATE INDEX IF NOT EXISTS idx_piutang_pay_payment_date ON piutang_pembayaran(payment_date);

-- Triggers for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'piutang_update_audit') THEN
        CREATE TRIGGER piutang_update_audit
            BEFORE UPDATE ON piutang
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'piutang_pembayaran_update_audit') THEN
        CREATE TRIGGER piutang_pembayaran_update_audit
            BEFORE UPDATE ON piutang_pembayaran
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
