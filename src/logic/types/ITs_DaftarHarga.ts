import { EntityBase } from './app';

/**
 * Interface Kontrak Data Daftar Harga (ITs_DaftarHarga)
 * 
 * Mendefinisikan struktur data untuk modul Daftar Harga.
 * Mendukung fitur harga bertingkat (tiered pricing) untuk grosiran.
 * Relasi utama menggunakan SKU yang bersumber dari Stok Berjalan.
 */

/**
 * Interface untuk item harga bertingkat
 */
export interface ITieredPrice {
  /** Minimal kuantitas untuk mendapatkan harga ini */
  min_qty: number;
  /** Harga per unit untuk tier ini */
  price: number;
}

/**
 * Interface Utama Daftar Harga
 * Mewarisi EntityBase untuk standarisasi Audit Trail dan Primary Key.
 */
export interface IDaftarHarga extends EntityBase {
  /** UUID v4 (Primary Key) */
  id: string;

  /** Stock Keeping Unit (Relasi ke Stok Berjalan) */
  sku: string;

  /** ID Internal Produk */
  product_id: string;

  /** Kategori Produk (e.g. Sembako, Elektronik) */
  category: string;

  /** Sub-Kategori Produk */
  sub_category: string;

  /** Nama Lengkap Produk */
  name: string;

  /** Satuan Unit Produk (e.g. kg, pcs, box, ltr) */
  unit: string;

  /** 
   * Representasi Harga Bertingkat 
   * Dalam database disimpan sebagai JSON string.
   */
  tiered_pricing: ITieredPrice[];
}

/**
 * Interface untuk Payload saat pembuatan atau pembaruan daftar harga.
 */
export interface IDaftarHargaPayload extends Omit<IDaftarHarga, 
  'id' | 
  'created_at' | 
  'created_by' | 
  'created_timezone' | 
  'updated_at' | 
  'updated_by' | 
  'updated_timezone' |
  'deleted_at'
> {
  /** Note tambahan jika diperlukan */
  notes?: string;
}
