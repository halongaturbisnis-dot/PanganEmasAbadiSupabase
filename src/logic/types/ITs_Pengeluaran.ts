import { EntityBase } from './app';

/**
 * Interface Kontrak Data Pengeluaran (ITs_Pengeluaran)
 * 
 * Mendefinisikan struktur data untuk modul Pengeluaran.
 * Sesuai dengan tabel 'pengeluaran' di database.
 */

/**
 * Enum Status Pengeluaran
 */
export enum TPengeluaranStatus {
  CLEAR = 'clear',
  UNCLEAR = 'unclear',
}

/**
 * Interface Utama Pengeluaran
 */
export interface IPengeluaran extends EntityBase {
  /** UUID v4 */
  id: string;

  /** Tanggal & Waktu Transaksi (ISO 8601 String) */
  transaction_date: string;

  /** ID Sumber Dana (FK ke BankAndCash) */
  bank_and_cash_id: string;

  /** Tipe/Kategori Pengeluaran (e.g. Biaya Sewa, Gaji, dll) */
  type: string;

  /** Deskripsi detil pengeluaran */
  description: string;

  /** Nominal uang yang dikeluarkan */
  amount: number;

  /** 
   * URL & Key Bukti Pengeluaran.
   * Di level database disimpan sebagai JSON String (Array of objects).
   * Format: '[{ "url": "...", "key": "..." }]'
   * Gunakan helper JSON.parse() saat fetching.
   */
  proof_urls: string;

  /** Status Verifikasi: clear atau unclear */
  status: TPengeluaranStatus;

  /** Link ke Pembelian (Optional) */
  purchase_id?: string;
}

/**
 * Metadata File untuk Storage
 */
export interface IPengeluaranFile {
  url: string;
  key: string;
}

/**
 * Payload data untuk Form (Parsed Version)
 */
export interface IPengeluaranPayload extends Omit<IPengeluaran, 'proof_urls'> {
  /** List URL & Key Bukti yang sudah di-parse menjadi Array */
  proof_urls: IPengeluaranFile[];
  
  /** Raw files from input for processing */
  files?: File[];
}
