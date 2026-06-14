import { EntityBase } from './app';

/**
 * Interface Kontrak Data Stok Berjalan (ITs_StokBerjalan)
 * 
 * Mendefinisikan struktur data untuk modul Stok Berjalan.
 * File ini berfungsi sebagai kontrak data antara database dan sistem aplikasi.
 * Sesuai dengan spesifikasi 'Stok Berjalan' yang dinamis.
 */

/**
 * Interface Utama Stok Berjalan
 * Mewarisi EntityBase untuk standarisasi Audit Trail dan Primary Key.
 */
export interface IStokBerjalan extends EntityBase {
  /** UUID v4 (Primary Key) */
  id: string;

  /** Stock Keeping Unit (Unique Identifier Produk) */
  sku: string;

  /** Kategori Produk (e.g. Sembako, Elektronik) */
  category: string;

  /** Sub-Kategori Produk */
  sub_category: string;

  /** Nama Lengkap Produk */
  name: string;

  /** Satuan Unit Produk (e.g. kg, pcs, box, ltr) */
  unit: string;

  /** Harga dasar produk untuk kalkulasi valuasi statis */
  base_price: number;

  /** Status kelengkapan data 1 (aktif) atau 0 (dihapus sementara) */
  is_active: number;

  /** 
   * DATA SNAPSHOT STOK OPNAME (SO) 
   * Digunakan sebagai baseline perhitungan stok berjalan.
   */
  
  /** Waktu pelaksanaan Stock Opname terakhir (ISO 8601) */
  last_so_datetime?: string;

  /** Jumlah stok fisik hasil Stock Opname terakhir */
  qty_so: number;

  /** 
   * --- KOLOM VIRTUAL / DINAMIS (Calculated Fields) ---
   * Field di bawah ini bersifat sangat dinamis dan biasanya dihitung 
   * berdasarkan agregasi transaksi sejak 'last_so_datetime'.
   */

  /** Akumulasi jumlah stok masuk setelah SO terakhir (Pembelian/Penerimaan) */
  qty_in_after_so: number;

  /** Akumulasi jumlah stok retur setelah SO terakhir */
  qty_retur_after_so: number;

  /** Akumulasi jumlah stok keluar setelah SO terakhir (Penjualan/Pengiriman) */
  qty_out_after_so: number;

  /** Akumulasi jumlah stok rusak/waste setelah SO terakhir */
  qty_waste_after_so: number;

  /** Stok khusus penjualan (untuk tampilan visual) */
  qty_terjual: number;

  /** Stok khusus terbuang (hanya dari modul stok terbuang, untuk visual) */
  qty_terbuang_only: number;

  /** Harga rata-rata/berjalan per unit saat ini (Moving Average) */
  price_per_unit_running: number;

  /** Total nilai valuasi stok saat ini (Total Valuation) */
  total_valuation_running: number;

  /**
   * STOK AKTUAL SAAT INI (Current Qty)
   * Rumus: qty_so + qty_in + qty_retur - qty_out - qty_waste
   */
  qty_current: number;
}

/**
 * Interface untuk Payload saat pembuatan atau pembaruan master produk stok.
 * Menghapus field virtual agar tidak dikirim mentah ke database.
 */
export interface IStokBerjalanPayload extends Omit<IStokBerjalan, 
  'qty_in_after_so' | 
  'qty_retur_after_so' | 
  'qty_out_after_so' | 
  'qty_waste_after_so' | 
  'qty_terjual' |
  'qty_terbuang_only' |
  'price_per_unit_running' | 
  'total_valuation_running' |
  'qty_current' |
  'is_active'
> {
  /** Tambahan field jika diperlukan saat proses input */
  notes?: string;
  is_active?: number;
}
