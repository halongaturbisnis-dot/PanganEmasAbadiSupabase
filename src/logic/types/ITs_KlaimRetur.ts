/**
 * Interface definition for Klaim Retur (Return Claim) Module.
 * This file serves as the data contract between Database and System.
 * Matches schemas defined in /database/KlaimReturTable.sql.
 */

export interface ITs_KlaimRetur {
  /** Unik ID (UUID) */
  id: string;
  /** Tanggal & Waktu Klaim Diajukan */
  datetime: string;
  /** Nomor Invoice dari Penjualan Terkait */
  invoice_number: string;
  /** Relasi ke ID Penjualan */
  penjualan_id: string;
  /** Relasi ke ID Customer */
  customer_id: string;
  
  /** Total Nominal Refund (Hasil akumulasi refund_nominal di items) */
  sum_total_refund_nominal: number;
  /** Deskripsi atau Keterangan Umum Klaim */
  description?: string;
  /** URL Bukti Foto/Dokumen Pendukung Utama */
  proof_url?: string;
  /** Status Klaim Retur */
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  
  // Audit Trail
  created_at: string;
  /** UUID User pembuat */
  created_by?: string;
  /** IANA Timezone (e.g., 'Asia/Jakarta') */
  created_timezone: string;
  updated_at?: string;
  updated_by?: string;
  updated_timezone?: string;

  /** Detail Produk yang Diklaim (Nested Data untuk UI/Transient) */
  items?: ITs_KlaimReturItem[];
}

export interface ITs_KlaimReturItem {
  /** Unik ID (UUID) */
  id: string;
  /** Relasi ke Header Klaim Retur */
  klaim_retur_id: string;
  /** Relasi ke Item Produk di Penjualan (Spesifikasi produk asal) */
  penjualan_produk_id: string;
  
  // Data Produk (Snapshot untuk integritas data)
  /** Nama Produk */
  name: string;
  /** Satuan Produk (pcs, kg, m, dsb) */
  unit: string;
  /** Jumlah/Kuantitas yang diklaim */
  qty: number;
  
  // Detail Masalah
  /** Alasan Klaim/Retur per item */
  reason?: string;
  /** URL Foto/Dokumen Bukti Spesifik untuk item ini */
  proof_url?: string;
  /** Kebijakan Penyelesaian: Replace (Ganti Barang) atau Refund (Sesuai Harga Tagihan) */
  policy: 'Replace' | 'Refund';
  /** Nilai Refund jika policy adalah 'Refund' */
  refund_nominal: number;
  
  // Audit Trail
  created_at: string;
  created_by?: string;
  created_timezone: string;
  updated_at?: string;
  updated_by?: string;
  updated_timezone?: string;
}
