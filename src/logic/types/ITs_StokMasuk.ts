import { EntityBase } from './app';

/**
 * Interface Kontrak Data Stok Masuk (ITs_StokMasuk)
 * 
 * Mendefinisikan struktur data untuk modul Stok Masuk.
 * Sesuai dengan spesifikasi variabel yang diberikan user (uuid, id pembelian, dsb).
 * Digunakan sebagai kontrak data antara database dan sistem aplikasi.
 */
export interface IStokMasuk extends EntityBase {
  /** UUID v4 (Primary Key) */
  id: string;

  /** ID Pembelian (Optional for Manual) - Relasi ke tabel pembelian */
  purchase_id?: string;

  /** ID Pembelian Produk (Optional for Manual) - Relasi ke tabel pembelian_produk */
  purchase_product_id?: string;

  /** ID Penerimaan (Optional for Manual) - Relasi ke tabel penerimaan */
  receiving_id?: string;

  /** ID Pemrosesan (Optional) - Relasi ke tabel pemrosesan jika stok berasal dari hasil produksi/proses */
  processing_id?: string;

  /** SKU Produk (Mandatory) - Referensi Master Produk / Stok Berjalan */
  sku: string;

  /** Kategori Produk (Mandatory) */
  category: string;

  /** Sub Kategori Produk (Mandatory) */
  sub_category: string;

  /** Nama Produk (Mandatory) */
  name: string;

  /** Satuan Unit (Mandatory) contoh: kg, pcs, box */
  unit: string;

  /** Kuantitas Stok Masuk (Mandatory) */
  qty_in: number;

  /** Harga Beli per Unit (Mandatory) */
  price_per_unit_in: number;

  /** Total Harga Masuk (Mandatory) - Hasil dari qty_in * price_per_unit_in */
  total_price_in: number;

  /** 
   * Harga Berjalan Baru per Unit (Moving Average)
   * Rumus Relasi: 
   * ((Sisa Qty Berjalan * Harga Satuan Berjalan) + total_price_in) / (qty_in + Sisa Qty Berjalan)
   */
  new_running_stock_price_per_unit: number;

  /** Deskripsi Tambahan atau Catatan */
  description?: string;
}

/**
 * Interface Payload untuk operasi penambahan (Insert) Stok Masuk
 */
export interface IStokMasukPayload extends Omit<IStokMasuk, keyof EntityBase | 'id'> {
  /** Catatan internal tambahan saat verifikasi input */
  internal_notes?: string;
}
