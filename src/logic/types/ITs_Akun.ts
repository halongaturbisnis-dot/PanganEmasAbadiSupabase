/**
 * Interface Akun (ITs_Akun)
 * 
 * Mendefinisikan struktur data untuk modul Akun.
 * Berdasarkan spesifikasi pada Database Akun Modul.
 */

/**
 * Peran user dalam sistem
 */
export enum TPeran {
  USER = 'User',
  ADMIN = 'Admin',
  GUEST = 'Guest',
}

/**
 * Daftar Modul yang tersedia (Digunakan untuk validasi akses_modul)
 */
export type TModul =
  | 'Pemrosesan'
  | 'Pengiriman'
  | 'Marketing'
  | 'Data Akun'
  | 'Pengadaan'
  | 'Gudang'
  | 'Stok Opname'
  | 'Penjualan'
  | 'Finansial'
  | 'Produk'
  | 'Customer';

/**
 * Aturan Opsi Akses Modul berdasarkan Peran:
 * 
 * - User: Pemrosesan, Pengiriman, Marketing
 * - Admin: Data Akun, Pengadaan, Gudang, Stok Opname, Penjualan, Finansial, Marketing
 * - Guest: Penjualan, Finansial, Produk, Marketing, Customer
 */

export interface IAkun {
  /** UUID v4 */
  id: string;
  
  /** Kode akses unik untuk login */
  kode_akses: string;
  
  /** Password (biasanya dihilangkan saat dikirim ke frontend untuk keamanan) */
  password?: string;
  
  /** Nama tampilan pengguna */
  username: string;
  
  /** URL foto profil yang tersimpan di storage */
  foto_profil?: string | null;
  
  /** Nomor telepon aktif */
  telepon?: string | null;
  
  /** Jabatan fungsional dalam organisasi */
  jabatan: string;
  
  /** Peran akses utama */
  peran: TPeran;
  
  /** Daftar modul yang dapat diakses (disimpan sebagai JSON Array di DB) */
  akses_modul: TModul[];

  /** Hak akses khusus approval invoice */
  has_invoice_approval: boolean;

  /** Status keaktifan akun */
  is_active: boolean;

  /** Audit Trail - Creation */
  created_at?: string;
  created_by?: string | null;
  created_timezone?: string;

  /** Audit Trail - Update */
  updated_at?: string | null;
  updated_by?: string | null;
  updated_timezone?: string;
}

/**
 * Tipe data minimal untuk session login / audit trail
 */
export interface IAkunSession {
    user_id: string;
    username: string;
    foto_profil?: string | null;
    peran: TPeran;
    akses_modul: TModul[];
    has_invoice_approval: boolean;
    is_active: boolean;
    last_active: string;
}
