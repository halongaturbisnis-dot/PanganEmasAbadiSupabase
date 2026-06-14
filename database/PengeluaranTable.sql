-- Table: pengeluaran
-- Description: Menyimpan data transaksi pengeluaran (Expenses).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS pengeluaran (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data Transaksi
    transaction_date TIMESTAMPTZ NOT NULL, -- Waktu aktual kejadian (TimeRule.md)
    bank_and_cash_id UUID NOT NULL,      -- Sumber dana (FK ke bank_and_cash)
    type TEXT NOT NULL,                  -- Kategori/Tipe pengeluaran
    description TEXT NOT NULL,           -- Deskripsi pengeluaran
    amount DOUBLE PRECISION NOT NULL CHECK(amount >= 0), -- Nominal pengeluaran (Mandatory)
    
    -- Bukti Pengeluaran
    proof_urls TEXT NOT NULL,            -- Mandatory sesuai request (*)
    
    -- Status Transaksi
    status TEXT NOT NULL DEFAULT 'clear' CHECK(status IN ('clear', 'unclear')),
    
    -- Link ke Sumber Transaksi (Optional)
    purchase_id UUID, -- Relasi ke tabel pembelian
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- Relationship
    FOREIGN KEY (bank_and_cash_id) REFERENCES bank_and_cash(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index untuk optimasi pencarian
CREATE INDEX IF NOT EXISTS idx_pengeluaran_date ON pengeluaran(transaction_date);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_source ON pengeluaran(bank_and_cash_id);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_status ON pengeluaran(status);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pengeluaran_update_audit') THEN
        CREATE TRIGGER pengeluaran_update_audit
            BEFORE UPDATE ON pengeluaran
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
