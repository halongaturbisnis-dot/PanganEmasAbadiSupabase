/**
 * Interface Suplier (ITs_Suplier)
 * 
 * Mendefinisikan struktur data untuk modul Suplier (Pengadaan).
 * Sesuai dengan spesifikasi Database Suplier.
 */

export interface ISuplier {
  /** UUID v4 */
  id: string;
  
  /** Nama Suplier (Mandatory) */
  name: string;
  
  /** Nomor telepon suplier (Mandatory) */
  telepon: string;
  
  /** Email suplier (Optional) */
  email?: string | null;
  
  /** Koordinat lokasi (Mandatory). Format: "lat,long" */
  latlong: string;
  
  /** Alamat lengkap (Mandatory) */
  alamat: string;

  /** Informasi Bank (Optional) */
  bank_name?: string | null;
  no_rekening?: string | null;
  nama_pemilik_rekening?: string | null;

  /** Audit Trail - Creation */
  created_at?: string;
  created_by?: string | null;
  created_timezone?: string;

  /** Audit Trail - Update */
  updated_at?: string | null;
  updated_by?: string | null;
  updated_timezone?: string;
}
