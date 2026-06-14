/**
 * Actual Time Utility
 * Synchronizes with global time servers to prevent device-time manipulation.
 */

let timeDrift = 0; // deviceTime - actualTime
let isSynced = false;
let lastSyncSource = '';

const TIME_SERVERS = [
  {
    url: 'https://worldtimeapi.org/api/ip',
    name: 'WorldTimeAPI',
    parse: (data: any) => data.datetime ? new Date(data.datetime).getTime() : null,
    metadata: (data: any) => ({ timezone: data.timezone, offset: data.raw_offset / 3600 })
  },
  {
    url: 'https://worldclockapi.com/api/json/utc/now',
    name: 'WorldClockAPI',
    parse: (data: any) => data.currentDateTime ? new Date(data.currentDateTime).getTime() : null
  }
];

let lastSyncMetadata: { timezone?: string; offset?: number } = {};

export async function syncActualTime(): Promise<number> {
  // 1. Prioritaskan Origin Server (Self) - Paling aman dari CORS dan rendah latency
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
      const dateStr = response.headers.get('Date');
      if (dateStr) {
        const actualTime = new Date(dateStr).getTime();
        timeDrift = Date.now() - actualTime;
        isSynced = true;
        lastSyncSource = 'Origin Server';
        return actualTime;
      }
    } catch (e) { /* ignore */ }
  }

  // 2. Waterfall ke External APIs
  for (const server of TIME_SERVERS) {
    try {
      const start = Date.now();
      const response = await fetch(server.url, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(4000)
      });
      if (!response.ok) continue;
      
      const data = await response.json();
      const actualTimeInServer = server.parse(data);
      
      if (actualTimeInServer) {
        const latency = (Date.now() - start) / 2;
        const actualTime = actualTimeInServer + latency;
        timeDrift = Date.now() - actualTime;
        isSynced = true;
        lastSyncSource = server.name;
        if ((server as any).metadata) {
          lastSyncMetadata = (server as any).metadata(data);
        }
        return actualTime;
      }
    } catch (err) { /* silent fail */ }
  }
  
  lastSyncSource = 'Device Clock';
  return Date.now();
}

export function getActualTime(): number {
  return Date.now() - timeDrift;
}

export function formatActualTime(timestamp: number, timezone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone || 'UTC',
    }).format(new Date(timestamp));
  } catch (e) {
    return new Date(timestamp).toISOString();
  }
}

/**
 * Robust Timezone Estimator from Coordinates
 * Maps GPS to Timezone without external API dependencies.
 */
export function getExpectedTimezone(lat: number, lng: number): { zone: string; offset: number } {
  // Indonesia Area (WIB, WITA, WIT)
  // Batas geografis WIB/WITA sekitar 114.5 BT (Selat Bali)
  if (lat >= -11 && lat <= 7 && lng >= 94 && lng <= 142) {
    if (lng < 114.5) return { zone: 'Asia/Jakarta', offset: 7 };
    if (lng < 125) return { zone: 'Asia/Makassar', offset: 8 };
    return { zone: 'Asia/Jayapura', offset: 9 };
  }
  
  // Malaysia
  if (lat >= 1 && lat <= 7 && lng >= 100 && lng <= 119) {
    return { zone: 'Asia/Kuala_Lumpur', offset: 8 };
  }

  // Singapore
  if (lat >= 1.2 && lat <= 1.5 && lng >= 103.6 && lng <= 104) {
    return { zone: 'Asia/Singapore', offset: 8 };
  }

  // Default to UTC mapping for other regions
  const offset = Math.round(lng / 15);
  return { 
    zone: `Etc/GMT${offset >= 0 ? (offset === 0 ? '' : '-') : '+'}${Math.abs(offset)}`, 
    offset 
  };
}

export function getTimezoneInfo() {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset(); // minutes
  const zoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Convert minutes to IANA offset string (+07:00)
  const offsetAbs = Math.abs(offsetMinutes);
  const hours = Math.floor(offsetAbs / 60);
  const minutes = offsetAbs % 60;
  const sign = offsetMinutes <= 0 ? '+' : '-'; // brain check: offset -420 means GMT+7
  const offsetString = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  
  const offsetHours = -offsetMinutes / 60;
  const gmtString = `GMT${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  
  return { 
    offset: offsetMinutes, 
    offsetString,
    zoneName, 
    gmtString,
    full: `${zoneName} (${gmtString})`
  };
}

/**
 * Returns user timezone in IANA format (e.g. 'Asia/Jakarta')
 */
export function getTimezoneIdentifier(): string {
  return getTimezoneInfo().zoneName;
}

/**
 * Returns user timezone offset in format '+07:00'
 */
export function getTimezoneOffsetString(): string {
  return getTimezoneInfo().offsetString;
}

export function getTimeSource(): string {
  return lastSyncSource;
}

export function getSyncMetadata() {
  return lastSyncMetadata;
}

export function getTimeDrift(): number {
  return timeDrift;
}

export function isTimeSynced(): boolean {
  return isSynced;
}
