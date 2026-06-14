import React, { useState, useEffect } from 'react';
import { cn } from '../../../logic/utils/cn';
import { akunService } from '../../../logic/services/akunService';

/**
 * AUDIT TRAIL COMPONENT
 * Menampilkan informasi siapa dan kapan data dibuat/diperbarui.
 */
interface AuditTrailProps {
  createdAt?: string | null;
  createdBy?: string | null;
  createdTimezone?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  updatedTimezone?: string | null;
  className?: string;
  id?: string;
}

// Global cache to avoid redundant database calls across multiple component instances
const usernameCache: Record<string, string> = {
  'Sistem': 'Sistem',
  'system': 'Sistem',
  '00000000-0000-0000-0000-000000000000': 'SuperAdmin'
};

export const AuditTrail: React.FC<AuditTrailProps> = ({
  createdAt,
  createdBy,
  createdTimezone,
  updatedAt,
  updatedBy,
  updatedTimezone,
  className,
  id = 'audit-trail'
}) => {
  const [resolvedCreatedBy, setResolvedCreatedBy] = useState<string>(createdBy || 'Sistem');
  const [resolvedUpdatedBy, setResolvedUpdatedBy] = useState<string>(updatedBy || 'Sistem');

  useEffect(() => {
    const resolveName = async (id: string | null | undefined, setter: (val: string) => void) => {
      if (!id || id.toLowerCase() === 'sistem' || id.toLowerCase() === 'system') {
        setter('Sistem');
        return;
      }

      // Check cache first
      if (usernameCache[id]) {
        setter(usernameCache[id]);
        return;
      }

      // Check if it's likely a UUID (basic check: has dashes and long enough)
      const isUUID = id.includes('-') && id.length > 20;
      if (isUUID) {
        try {
          const user = await akunService.getById(id);
          if (user && user.username) {
            usernameCache[id] = user.username;
            setter(user.username);
          } else {
            // Fallback to ID if user not found, but don't cache to allow retry
            setter(id);
          }
        } catch (error) {
          setter(id);
        }
      } else {
        setter(id);
      }
    };

    resolveName(createdBy, setResolvedCreatedBy);
    resolveName(updatedBy, setResolvedUpdatedBy);
  }, [createdBy, updatedBy]);

  const formatAuditDate = (dateStr?: string | null, timezone?: string) => {
    if (!dateStr) return '-';
    try {
      // Pastikan string tanggal diperlakukan sebagai UTC jika belum ada identifier Z/T
      const safeDateStr = dateStr.includes('Z') || dateStr.includes('T') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
      const date = new Date(safeDateStr);
      
      const formatted = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone || 'UTC'
      }).format(date);
      
      // Ganti format separator jam Indonesia (titik ke titik dua) dan hilangkan koma
      return formatted.replace(/\./g, ':').replace(',', '');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div 
      id={id}
      className={cn(
        "pt-SpacingExtraLarge flex flex-col items-end gap-SpacingNano text-TextColorBase", 
        className
      )}
    >
      <p id={`${id}-created`} className="text-FontSizeNano leading-none">
        Dibuat oleh <span className="font-bold">{resolvedCreatedBy}</span> {formatAuditDate(createdAt, createdTimezone || 'UTC')} {createdTimezone}
      </p>
      {updatedAt && (
        <p id={`${id}-updated`} className="text-FontSizeNano leading-none">
          Diperbarui oleh <span className="font-bold">{resolvedUpdatedBy}</span> {formatAuditDate(updatedAt, updatedTimezone || 'UTC')} {updatedTimezone}
        </p>
      )}
    </div>
  );
};

export default AuditTrail;
