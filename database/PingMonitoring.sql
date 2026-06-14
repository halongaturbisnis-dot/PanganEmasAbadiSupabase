-- SQL Schema for PingMonitoring
-- Standardized following /GUIDANCE/DatabaseRule.md dan /GUIDANCE/ActiveDatabaseRule.md
-- Tabel ini didesain sebagai Singleton (Hanya menyimpan 1 baris record)

CREATE TABLE IF NOT EXISTS PingMonitoring (
    id TEXT PRIMARY KEY DEFAULT 'singleton-ping-monitor',
    ping_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL, -- 'SUCCESS', 'FAILED'
    message TEXT,
    triggered_by TEXT DEFAULT 'CRON', -- 'CRON', 'SYSTEM', 'MANUAL'
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'SYSTEM',
    created_timezone TEXT DEFAULT 'Asia/Jakarta',
    updated_at TIMESTAMPTZ,
    updated_by TEXT,
    updated_timezone TEXT
);

-- Trigger for update audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pingmonitoring_update_audit') THEN
        CREATE TRIGGER pingmonitoring_update_audit
            BEFORE UPDATE ON PingMonitoring
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Index for performance on date lookups
CREATE INDEX IF NOT EXISTS idx_ping_at ON PingMonitoring(ping_at);
