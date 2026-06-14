-- Table: pemasaran
-- Description: Menyimpan data kunjungan aktivitas pemasaran (client relation, selling, offering).
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS pemasaran (
    -- Identitas Unik (UUID v4)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data Kunjungan Pemasaran
    visit_date TIMESTAMPTZ NOT NULL,                     -- Waktu aktual kejadian kunjungan (TimeRule.md)
    sales_username TEXT NOT NULL,                     -- Username sales yang melakukan kunjungan (Mandatory)
    activity_type TEXT NOT NULL CHECK(activity_type IN ('client relation', 'selling', 'offering')), -- Tipe Kegiatan (Mandatory)
    customer_id UUID NOT NULL,                        -- Referensi ID Customer (Mandatory)
    description TEXT,                                 -- Deskripsi/Catatan kunjungan (Optional)
    latlong_visiting TEXT NOT NULL,                   -- Koordinat GPS lokasi kunjungan, format: "lat,long" (Mandatory)
    alamat TEXT NOT NULL,                             -- Alamat lengkap lokasi kunjungan (Mandatory)
    proof_url TEXT NOT NULL,                          -- URL bukti foto/file dokumen kunjungan (Mandatory, StorageRule.md)
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                  -- UUID User pembuat
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                                  -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',

    -- Referential Integrity
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index untuk optimasi pencarian
CREATE INDEX IF NOT EXISTS idx_pemasaran_date ON pemasaran(visit_date);
CREATE INDEX IF NOT EXISTS idx_pemasaran_sales ON pemasaran(sales_username);
CREATE INDEX IF NOT EXISTS idx_pemasaran_customer ON pemasaran(customer_id);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pemasaran_update_audit') THEN
        CREATE TRIGGER pemasaran_update_audit
            BEFORE UPDATE ON pemasaran
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
