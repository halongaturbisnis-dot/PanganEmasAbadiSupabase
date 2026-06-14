-- Table: pemasukan
-- Description: Menyimpan data transaksi pemasukan (Revenue/Income).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS pemasukan (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data Transaksi
    transaction_date TIMESTAMPTZ NOT NULL, -- Waktu aktual kejadian (TimeRule.md)
    bank_and_cash_id UUID NOT NULL,      -- Sumber dana (FK ke bank_and_cash)
    type TEXT NOT NULL,                  -- Kategori/Tipe pemasukan
    description TEXT NOT NULL,           -- Deskripsi pemasukan
    amount DOUBLE PRECISION NOT NULL CHECK(amount >= 0), -- Nominal pemasukan (Mandatory)
    
    -- Bukti Pemasukan
    proof_urls TEXT NOT NULL,            -- Mandatory sesuai request (*)
    
    -- Tanggungan / Relasi (Opsional)
    sales_id UUID,                       -- Referensi ke tabel penjualan
 
    -- Status Transaksi
    status TEXT NOT NULL DEFAULT 'clear' CHECK(status IN ('clear', 'unclear')),
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- Relationship
    FOREIGN KEY (bank_and_cash_id) REFERENCES bank_and_cash(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (sales_id) REFERENCES penjualan(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Index untuk optimasi pencarian
CREATE INDEX IF NOT EXISTS idx_pemasukan_date ON pemasukan(transaction_date);
CREATE INDEX IF NOT EXISTS idx_pemasukan_source ON pemasukan(bank_and_cash_id);
CREATE INDEX IF NOT EXISTS idx_pemasukan_status ON pemasukan(status);
CREATE INDEX IF NOT EXISTS idx_pemasukan_sales ON pemasukan(sales_id);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pemasukan_update_audit') THEN
        CREATE TRIGGER pemasukan_update_audit
            BEFORE UPDATE ON pemasukan
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
