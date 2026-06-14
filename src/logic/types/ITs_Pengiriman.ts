import { EntityBase } from './app';

/**
 * Interface Pengiriman (ITs_Pengiriman)
 * 
 * Mendefinisikan struktur data untuk modul Pengiriman (Logistik).
 * Sesuai dengan spesifikasi dan skema tabel database pengiriman.
 */

/**
 * Enum Status Pengiriman
 */
export enum TPengirimanStatus {
  PENDING = 'pending',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Interface Berkas Pendukung (File Storage)
 */
export interface IPengirimanFile {
  url: string;
  name?: string;
  key?: string;
}

/**
 * Interface Utama Pengiriman
 */
export interface IPengiriman extends EntityBase {
  /** UUID v4 */
  id: string;

  /** ID Pembelian (FK ke pembelian) */
  purchase_id: string;

  /** Tanggal & Waktu Pengiriman (ISO 8601 String) */
  datetime: string;

  /** Jenis Pengiriman (Contoh: 'Internal', 'Ekspedisi', dll) */
  shipping_type: string;

  /** Keterangan Pengiriman (Optional) */
  description?: string | null;

  /** Nomor Polisi Kendaraan (Optional) */
  vehicle_number?: string | null;

  /** Jenis Kendaraan (Optional) */
  vehicle_type?: string | null;

  /** Nama Pengemudi/Driver (Optional) */
  driver_name?: string | null;

  /** Nomor Telepon Pengemudi (Optional) */
  driver_phone?: string | null;

  /** Status Pengiriman */
  status: TPengirimanStatus;

  /** 
   * URL & Key Bukti Pengiriman.
   * Di level database disimpan sebagai JSON String (Array of objects).
   * Format: '[{ "url": "...", "key": "..." }]'
   * Gunakan helper JSON.parse() saat fetching.
   */
  proof_fileurl: string;
}

/**
 * Payload Data Pengiriman Terintegrasi (Parsed & Expanded Version untuk Form / Service payload)
 */
export interface IPengirimanPayload extends Omit<IPengiriman, 'proof_fileurl'> {
  /** List URL & Key Bukti yang sudah di-parse menjadi Array dari JSON String */
  proof_fileurl: IPengirimanFile[];

  /** File mentah dari upload input (Optional, untuk diproses di storage service sebelum persist) */
  files?: File[];
}
