import { EntityBase } from './app';

/**
 * Interface Pembelian (ITs_Pembelian)
 * 
 * Mendefinisikan struktur data untuk modul Pembelian (Procurement).
 * Sesuai dengan spesifikasi dan skema tabel database pembelian.
 */

/**
 * Enum Tipe Pembayaran (Lunas atau Tempo)
 */
export enum TPembelianPaymentType {
  LUNAS = 'lunas',
  TEMPO = 'tempo',
}

/**
 * Enum Metode Pembayaran (Tunai atau Non Tunai)
 */
export enum TPembelianPaymentMethod {
  TUNAI = 'Tunai',
  NON_TUNAI = 'Non Tunai',
}

/**
 * Enum Jenis Pengiriman (Internal atau Customer)
 */
export enum TPembelianShippingType {
  INTERNAL = 'Internal',
  CUSTOMER = 'Customer',
}

/**
 * Enum Status Pembelian
 */
export enum TPembelianStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Interface Berkas Pendukung (File Storage)
 */
export interface IPembelianFile {
  url: string;
  name?: string;
  key?: string;
}

/**
 * Interface Utama Pembelian (Header Table)
 */
export interface IPembelian extends EntityBase {
  /** UUID v4 */
  id: string;

  /** Tanggal & Waktu Kejadian Transaksi (ISO 8601 String) */
  datetime: string;

  /** Nomor PO Pembelian (Unique) */
  po_number: string;

  /** Catatan/Deskripsi Tambahan (Optional) */
  additional_description?: string | null;

  /** ID Supplier (FK ke suplier) */
  supplier_id: string;

  /** Total Harga Produk (Penjumlahan sum_price dari tabel pembelian_produk) */
  sum_product_price: number;

  /** Total Biaya Tambahan (Penjumlahan cost dari tabel pembelian_biaya) */
  sum_added_cost: number;

  /** Grand Total Harga (sum_product_price + sum_added_cost) */
  grand_total_price: number;

  /** Tipe Pembayaran (Lunas atau Tempo) */
  payment_type: TPembelianPaymentType;

  /** Uang Muka / Deposit (Mandatory, default 0 jika lunas/tanpa DP) */
  deposit: number;

  /** Sisa Tagihan (Mandatory, default 0 jika lunas) */
  outstanding: number;

  /** Batas Waktu Pelunasan / Tanggal SLA (Optional, Mandatory jika tempo) */
  sla_date?: string | null;

  /** Metode Pembayaran (Tunai atau Non Tunai) */
  payment_method: TPembelianPaymentMethod;

  /** ID Sumber Bank & Kas (FK ke bank_and_cash) */
  bank_and_cash_id: string;

  /** Jenis Pengiriman (Internal atau Customer) */
  shipping_type: TPembelianShippingType;

  /** ID Customer (FK ke customer) */
  customer_id?: string | null;

  /** 
   * URL & Key Bukti Pembelian.
   * Di level database disimpan sebagai JSON String (Array of objects).
   * Format: '[{ "url": "...", "key": "..." }]'
   * Gunakan helper JSON.parse() saat fetching.
   */
  proof_fileurl: string;

  /** Status Transaksi Pembelian */
  status: TPembelianStatus;

  /** Relasi Dropship (ID Penjualan) */
  penjualan_id?: string | null;
}

/**
 * Interface Detil Produk Pembelian (Child Table)
 */
export interface IPembelianProduk extends EntityBase {
  /** UUID v4 */
  id: string;

  /** ID Induk Pembelian (FK ke pembelian) */
  purchase_id: string;

  /** Tanggal & Waktu Procurement (ISO 8601 String) */
  datetime: string;

  /** Nomor PO Pembelian Induk */
  po_number: string;

  /** Kategori Produk */
  category: string;

  /** Sub-Kategori Produk */
  sub_category: string;

  /** Nama Produk */
  name: string;

  /** Satuan / Unit Produk */
  unit: string;

  /** Kuantitas Produk */
  qty: number;

  /** Harga per Unit Produk */
  price_per_unit: number;

  /** Total Harga Item Produk (qty * price_per_unit) */
  sum_price: number;

  /** Kadar Air (Optional) */
  kadar_air?: number | null;

  /** Relasi Dropship (ID Penjualan Produk) */
  penjualan_produk_id?: string | null;
}

/**
 * Interface Detil Biaya Tambahan Pembelian (Child Table)
 */
export interface IPembelianBiaya extends EntityBase {
  /** UUID v4 */
  id: string;

  /** ID Induk Pembelian (FK ke pembelian) */
  purchase_id: string;

  /** Tanggal & Waktu Transaksi (ISO 8601 String) */
  datetime: string;

  /** Nomor PO Pembelian Induk */
  po_number: string;

  /** Tipe / Jenis Biaya Tambahan */
  type: string;

  /** Nominal Biaya Tambahan */
  cost: number;

  /** Deskripsi Biaya Tambahan */
  description: string;
}

/**
 * Payload Data Pembelian Terintegrasi (Parsed & Expanded Version untuk Form / Service payload)
 */
export interface IPembelianPayload extends Omit<IPembelian, 'proof_fileurl'> {
  /** List URL & Key Bukti yang sudah di-parse menjadi Array dari JSON String */
  proof_fileurl: IPembelianFile[];

  /** List item produk hasil parsing dari database children */
  products: IPembelianProduk[];

  /** List item biaya tambahan hasil parsing dari database children */
  additional_costs: IPembelianBiaya[];

  /** File mentah dari upload input (Optional, untuk diproses di storage service sebelum persist) */
  files?: File[];
  supplier_name?: string;
}
