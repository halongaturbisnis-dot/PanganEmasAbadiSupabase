import { EntityBase } from './app';

/**
 * Interface Kontrak Data Stok Retur (ITs_StokRetur)
 * 
 * Mendefinisikan struktur data untuk modul Stok Retur.
 * Sesuai dengan spesifikasi variabel yang diberikan user (uuid, sku, dsb).
 * Digunakan sebagai kontrak data antara database dan sistem aplikasi.
 */
export interface IStokRetur extends EntityBase {
  /** UUID v4 (Primary Key) */
  id: string;

  /** SKU Produk (Mandatory) - Referensi Master Produk / Stok Berjalan */
  sku: string;

  /** Kategori Produk (Mandatory) - Diambil otomatis dari StokBerjalan */
  category: string;

  /** Sub Kategori Produk (Optional) - Diambil otomatis dari StokBerjalan */
  sub_category?: string;

  /** Nama Produk (Mandatory) - Diambil otomatis dari StokBerjalan */
  name: string;

  /** Satuan Unit (Mandatory) contoh: kg, pcs, box - Diambil otomatis dari StokBerjalan */
  unit: string;

  /** Kuantitas Stok Retur (Mandatory) - Diisi manual sesuai jumlah barang retur */
  qty: number;

  /** Harga per Unit Masuk (Mandatory) - Diambil otomatis dari StokBerjalan (base_price / running_price) */
  price_per_unit_in: number;

  /** Total Harga Retur (Mandatory) - Hasil dari qty * price_per_unit_in */
  total_price_in: number;

  /** Deskripsi Tambahan atau Alasan Retur (Optional) */
  description?: string;
}

/**
 * Interface Payload untuk operasi penambahan (Insert) Stok Retur
 */
export interface IStokReturPayload extends Omit<IStokRetur, keyof EntityBase | 'id'> {
  /** Catatan internal tambahan saat verifikasi input */
  internal_notes?: string;
}
