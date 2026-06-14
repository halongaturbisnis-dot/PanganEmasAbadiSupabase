-- Table: pemrosesan
-- Description: Skema database untuk modul Pemrosesan.
-- Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md

CREATE TABLE IF NOT EXISTS pemrosesan (
    -- Identitas Unik (UUID v4) conforme standards
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relasi ke Transaksi Induk (Mandatory)
    pembelian_id UUID NOT NULL,
    pembelian_produk_id UUID NOT NULL,
    receiving_id UUID NOT NULL,         -- FK ke penerimaan.id

    -- Valuasi Dinamis
    initial_valuation DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_valuation DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
    
    -- Waktu Kejadian Pemrosesan
    datetime TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Deskripsi Pemrosesan
    jenis_pemrosesan TEXT,
    
    -- Data Meteran (Kuantitas)
    qty_sebelum DOUBLE PRECISION NOT NULL CHECK(qty_sebelum >= 0),
    qty_sesudah DOUBLE PRECISION NOT NULL CHECK(qty_sesudah >= 0),
    qty_penyusutan DOUBLE PRECISION NOT NULL CHECK(qty_penyusutan >= 0),
    qty_masuk_stok DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(qty_masuk_stok >= 0),
    
    -- Spesifikasi Kualitas Pasca Proses
    kadar_air_post DOUBLE PRECISION NOT NULL,
    efisiensi DOUBLE PRECISION,
    
    -- Kelengkapan Data
    keterangan TEXT,
    proof_fileurl TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('draft', 'processing', 'completed', 'cancelled')),
    
    -- Audit Trail (Mandatory sesuai DatabaseRule.md)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                -- UUID User pembuat
    created_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    updated_at TIMESTAMPTZ,
    updated_by UUID,                                -- UUID User pengubah terakhir
    updated_timezone TEXT DEFAULT 'Asia/Jakarta',    -- Standar IANA sesuai TimeRule.md
    
    -- Relationships
    FOREIGN KEY (pembelian_id) REFERENCES pembelian(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (pembelian_produk_id) REFERENCES pembelian_produk(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiving_id) REFERENCES penerimaan(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table: pemrosesan_log
CREATE TABLE IF NOT EXISTS pemrosesan_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pemrosesan_id UUID NOT NULL,
    datetime TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    jenis_log TEXT,
    qty_sebelum DOUBLE PRECISION NOT NULL,
    qty_sesudah DOUBLE PRECISION NOT NULL,
    qty_penyusutan DOUBLE PRECISION NOT NULL,
    kadar_air_post DOUBLE PRECISION,
    keterangan TEXT,
    proof_fileurl TEXT NOT NULL DEFAULT '[]',
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    
    FOREIGN KEY (pemrosesan_id) REFERENCES pemrosesan(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_pemrosesan_receiving_id ON pemrosesan(receiving_id);
CREATE INDEX IF NOT EXISTS idx_pemrosesan_log_pemrosesan_id ON pemrosesan_log(pemrosesan_id);
CREATE INDEX IF NOT EXISTS idx_pemrosesan_pembelian_id ON pemrosesan(pembelian_id);
CREATE INDEX IF NOT EXISTS idx_pemrosesan_pembelian_produk_id ON pemrosesan(pembelian_produk_id);
CREATE INDEX IF NOT EXISTS idx_pemrosesan_datetime ON pemrosesan(datetime);

-- Triggers for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pemrosesan_update_audit') THEN
        CREATE TRIGGER pemrosesan_update_audit
            BEFORE UPDATE ON pemrosesan
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
