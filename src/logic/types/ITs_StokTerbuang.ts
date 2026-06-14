import { EntityBase } from './app';

/**
 * Interface Kontrak Data Stok Terbuang (ITs_StokTerbuang)
 * 
 * Mendefinisikan struktur data untuk modul Stok Terbuang (Discarded/Wasted Stock).
 * Sesuai dengan spesifikasi variabel yang diberikan user (uuid, sku, proof_url, dsb).
 * Digunakan sebagai kontrak data antara database dan sistem aplikasi.
 */
export interface IStokTerbuang extends EntityBase {
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

  /** Kuantitas Stok Terbuang (Mandatory) - Diisi manual */
  qty: number;

  /** Harga per Unit Keluar (Mandatory) - Diambil otomatis dari StokBerjalan (base_price / running_price) */
  price_per_unit_out: number;

  /** Total Harga Terbuang (Mandatory) - Hasil dari qty * price_per_unit_out */
  total_price_out: number;

  /** Link / list URL bukti fisik (Menggunakan MultiUploadInput) */
  proof_url?: string;

  /** Deskripsi Tambahan atau Alasan Pembuangan (Optional) */
  description?: string;
}

/**
 * Interface Payload untuk operasi penambahan (Insert) Stok Terbuang
 */
export interface IStokTerbuangPayload extends Omit<IStokTerbuang, keyof EntityBase | 'id'> {
  /** Catatan internal tambahan saat verifikasi input */
  internal_notes?: string;
}
