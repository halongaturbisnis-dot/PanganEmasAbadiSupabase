import { EntityBase } from './app';

/**
 * Interface Kontrak Data Pemasukan (ITs_Pemasukan)
 * 
 * Mendefinisikan struktur data untuk modul Pemasukan.
 * Sesuai dengan tabel 'pemasukan' di database.
 */

/**
 * Enum Status Pemasukan
 */
export enum TPemasukanStatus {
  CLEAR = 'clear',
  UNCLEAR = 'unclear',
}

/**
 * Interface Utama Pemasukan
 */
export interface IPemasukan extends EntityBase {
  /** UUID v4 */
  id: string;

  /** Tanggal & Waktu Transaksi (ISO 8601 String) */
  transaction_date: string;

  /** ID Sumber Dana (FK ke BankAndCash) */
  bank_and_cash_id: string;

  /** Tipe/Kategori Pemasukan (e.g. Penjualan, Investasi, dll) */
  type: string;

  /** Deskripsi detil pemasukan */
  description: string;

  /** Nominal uang yang masuk */
  amount: number;

  /** 
   * URL & Key Bukti Pemasukan.
   * Di level database disimpan sebagai JSON String (Array of objects).
   * Format: '[{ "url": "...", "key": "..." }]'
   * Gunakan helper JSON.parse() saat fetching.
   */
  proof_urls: string;

  /** Status Verifikasi: clear atau unclear */
  status: TPemasukanStatus;

  /** Referensi ke tabel penjualan jika ini berasal dari penerimaan piutang atau penjualan lunas */
  sales_id?: string;
}

/**
 * Metadata File untuk Storage
 */
export interface IPemasukanFile {
  url: string;
  key: string;
}

/**
 * Payload data untuk Form (Parsed Version)
 */
export interface IPemasukanPayload extends Omit<IPemasukan, 'proof_urls'> {
  /** List URL & Key Bukti yang sudah di-parse menjadi Array */
  proof_urls: IPemasukanFile[];
  
  /** Raw files from input for processing */
  files?: File[];
}
