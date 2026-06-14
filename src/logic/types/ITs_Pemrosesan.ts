/**
 * Interface Pemrosesan
 * Digunakan sebagai kontrak data untuk modul Pemrosesan.
 * Merepresentasikan satu event/kejadian pemrosesan produk.
 */
export interface ITs_Pemrosesan {
  /** UUID v4 Identitas Unik */
  id: string;

  /** Foreign Key ke tabel pembelian */
  pembelian_id: string;

  /** Foreign Key ke tabel pembelian_produk */
  pembelian_produk_id: string;

  /** Foreign Key ke tabel penerimaan */
  receiving_id: string;

  /** Valuasi awal (diambil dari accepted_valuation penerimaan) */
  initial_valuation: number;

  /** Valuasi terkini (setelah penyusutan) */
  current_valuation: number;

  /** Harga per satuan baru berdasarkan valuasi terkini */
  current_unit_price: number;

  /** Tanggal aktivitas pemrosesan (Waktu Aktual) */
  datetime: string;

  /** Jenis proses yang dilakukan (misal: pengeringan, seleksi, pembersihan) */
  jenis_pemrosesan?: string;

  /** Kuantitas barang sebelum diproses */
  qty_sebelum: number;

  /** Kuantitas barang setelah diproses */
  qty_sesudah: number;

  /** Selisih / Penyusutan kuantitas (qty_sebelum - qty_sesudah) */
  qty_penyusutan: number;

  /** Jumlah qty yang sudah dimasukkan ke stok */
  qty_masuk_stok: number;

  /** Total harga/valuasi barang yang sudah masuk stok */
  total_price_masuk_stok?: number;

  /** Kadar air yang terukur setelah proses selesai */
  kadar_air_post: number;

  /** Rasio efisiensi pemrosesan (kalkulasi perbandingan kadar air) */
  efisiensi?: number;

  /** Catatan tambahan terkait proses */
  keterangan?: string;

  /** 
   * JSON String Array URL bukti berkas di storage.
   * Format: '["url1", "url2"]' atau '[{"url": "...", "name": "..."}]'
   */
  proof_fileurl: string;

  /** Status siklus hidup data pemrosesan */
  status: 'draft' | 'processing' | 'completed' | 'cancelled';

  /** Audit Trail: Waktu data dibuat */
  created_at: string;
  /** Audit Trail: UUID User yang membuat data */
  created_by?: string;
  /** Audit Trail: Timezone IANA saat pembuatan */
  created_timezone: string;

  /** Audit Trail: Waktu data terakhir diperbarui */
  updated_at?: string;
  /** Audit Trail: UUID User terakhir yang memperbarui */
  updated_by?: string;
  /** Audit Trail: Timezone IANA saat pembaruan terakhir */
  updated_timezone?: string;

  /** Riwayat Log (Optional join) */
  logs?: ITs_PemrosesanLog[];
}

/**
 * Interface Pemrosesan Log
 */
export interface ITs_PemrosesanLog {
  id: string;
  pemrosesan_id: string;
  datetime: string;
  jenis_log?: string;
  qty_sebelum: number;
  qty_sesudah: number;
  qty_penyusutan: number;
  kadar_air_post?: number;
  keterangan?: string;
  proof_fileurl: string;
  created_at: string;
  created_by?: string;
  created_timezone: string;
}

/**
 * Payload untuk pembuatan data Pemrosesan baru.
 */
export interface IPemrosesanPayload {
  pembelian_id: string;
  pembelian_produk_id: string;
  receiving_id: string;
  initial_valuation: number;
  initial_qty: number;
  initial_moisture?: number;
  datetime: string;
  jenis_pemrosesan?: string;
  status?: ITs_Pemrosesan['status'];
}

/**
 * Payload untuk penambahan log Pemrosesan.
 */
export interface IPemrosesanLogPayload {
  pemrosesan_id: string;
  datetime: string;
  jenis_log?: string;
  qty_sebelum: number;
  qty_sesudah: number;
  kadar_air_post?: number;
  keterangan?: string;
  /** Files yang baru diunggah dari browser */
  files?: File[];
}

/**
 * Payload untuk pembaruan data Pemrosesan.
 */
export interface IPemrosesanUpdatePayload extends Partial<IPemrosesanPayload> {
  current_valuation?: number;
  current_unit_price?: number;
  qty_sebelum?: number;
  qty_sesudah?: number;
  qty_penyusutan?: number;
  kadar_air_post?: number;
}
