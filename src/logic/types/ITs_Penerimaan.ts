/**
 * Interface: ITs_Penerimaan
 * Description: Kontrak data untuk modul Penerimaan (Receipt).
 * Standard: Mengikuti aturan DatabaseRule.md, TimeRule.md, dan StorageRule.md
 */

export enum IPenerimaanSortingType {
  NON_QC = 'Non QC',
  QC = 'QC',
}

export interface ITs_Penerimaan {
  /** Identitas Unik (UUID v4) */
  id: string;

  /** ID Pembelian (Relasi ke pembelian) */
  purchase_id: string;

  /** ID Produk Pembelian (Relasi ke pembelian_produk) */
  purchase_product_id: string;

  /** ID Pengiriman (Relasi ke pengiriman) */
  shipping_id: string;

  /** Tanggal & Waktu Penerimaan (ISO String) */
  datetime: string;

  /** Tipe Penyortiran (Non QC / QC) */
  sorting_type: IPenerimaanSortingType;

  /** Kuantiti Rejection (Mandatory, default 0) */
  qty_rejection: number;

  /** Total Valuasi yang di Reject (Mandatory) */
  rejected_valuation: number;

  /** Alasan di Reject (Longtext) */
  rejected_reason?: string;

  /** Bukti Reject (URL Multiple Files dalam format JSON string/array) */
  rejected_proof_url?: string;

  /** Kuantiti Diterima Aktual (Mandatory) */
  qty_received_actual: number;

  /** Selisih Kuantiti (Kuantiti pembelian - Kuantiti reject - Kuantiti diterima) */
  qty_diff: number;

  /** Total Valuasi Produk Diterima (total harga produk pembelian - total valuasi yg di reject) */
  accepted_valuation: number;

  /** Harga Penerimaan per Unit (accepted_valuation / qty_received_actual) */
  price_per_unit_accepted: number;

  /** Kadar Air Aktual (Wajib jika di produk dibeli juga dicantumkan kadar airnya selain 0) */
  actual_moisture?: number;

  /** Keterangan Tambahan */
  description?: string;

  /** Bukti Penerimaan (URL Multiple Files dalam format JSON string/array) - Mandatory */
  receipt_proof_url: string;

  /** Audit Trail: Waktu Pembuatan */
  created_at?: string;
  /** Audit Trail: User pembuat */
  created_by?: string;
  /** Audit Trail: Timezone user pembuat (IANA) */
  created_timezone?: string;

  /** Audit Trail: Waktu Perubahan Terakhir */
  updated_at?: string;
  /** Audit Trail: User pengubah terakhir */
  updated_by?: string;
  /** Audit Trail: Timezone user pengubah terakhir (IANA) */
  updated_timezone?: string;
}
