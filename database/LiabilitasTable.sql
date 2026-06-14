-- Table: liabilitas, liabilitas_pembayaran
-- Description: Skema database untuk modul Liabilitas (Hutang/Kewajiban).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

-- 1. Tabel Utama: liabilitas
CREATE TABLE IF NOT EXISTS liabilitas (
    -- Identitas Unik (UUID v4) conforme standards
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tanggal Muncul Liabilitas
    datetime TIMESTAMPTZ NOT NULL,
    
    -- Deskripsi / Nama Liabilitas
    name TEXT NOT NULL,
    
    -- Catatan Tambahan (Optional)
    description TEXT,
    
    -- Kategori (Misal: Pembelian, Pinjaman, Operasional)
    category TEXT NOT NULL CHECK(category IN ('Pembelian', 'Pinjaman', 'Operasional', 'Lainnya')),
    
    -- Relasi ke Pembelian
    purchase_id UUID,
    
    -- ID Pihak Terkait
    entity_name TEXT NOT NULL,
    
    -- Nilai Pokok Liabilitas
    principal_amount DOUBLE PRECISION NOT NULL CHECK(principal_amount >= 0),
    
    -- Nilai Terbayar
    paid_amount DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(paid_amount >= 0),
    
    -- Sisa Liabilitas
    outstanding_amount DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(outstanding_amount >= 0),
    
    -- Batas Waktu Pelunasan (SLA/Tempo)
    due_date TIMESTAMPTZ,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Settled', 'Cancelled')),
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta'
);

-- 2. Tabel Detil: liabilitas_pembayaran
CREATE TABLE IF NOT EXISTS liabilitas_pembayaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    liabilitas_id UUID NOT NULL,
    
    -- Tanggal Pembayaran
    payment_date TIMESTAMPTZ NOT NULL,
    
    -- Nominal Pembayaran
    amount DOUBLE PRECISION NOT NULL CHECK(amount > 0),
    
    -- Metode Pembayaran
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Tunai', 'Non Tunai')),
    
    -- Saluran Finansial (FK ke bank_and_cash)
    bank_and_cash_id UUID NOT NULL,
    
    -- Relasi ke Pengeluaran
    expense_id UUID,
    
    description TEXT,
    
    -- Bukti Pembayaran
    proof_urls TEXT,
    
    -- SLA Berikutnya
    next_sla TIMESTAMPTZ,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    FOREIGN KEY (liabilitas_id) REFERENCES liabilitas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (bank_and_cash_id) REFERENCES bank_and_cash(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (expense_id) REFERENCES pengeluaran(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- INDEX
CREATE INDEX IF NOT EXISTS idx_liabilitas_datetime ON liabilitas(datetime);
CREATE INDEX IF NOT EXISTS idx_liabilitas_due_date ON liabilitas(due_date);
CREATE INDEX IF NOT EXISTS idx_liabilitas_purchase_id ON liabilitas(purchase_id);
CREATE INDEX IF NOT EXISTS idx_liabilitas_status ON liabilitas(status);

CREATE INDEX IF NOT EXISTS idx_liabilitas_pay_liabilitas_id ON liabilitas_pembayaran(liabilitas_id);
CREATE INDEX IF NOT EXISTS idx_liabilitas_pay_payment_date ON liabilitas_pembayaran(payment_date);

-- Triggers for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'liabilitas_update_audit') THEN
        CREATE TRIGGER liabilitas_update_audit
            BEFORE UPDATE ON liabilitas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'liabilitas_pembayaran_update_audit') THEN
        CREATE TRIGGER liabilitas_pembayaran_update_audit
            BEFORE UPDATE ON liabilitas_pembayaran
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
