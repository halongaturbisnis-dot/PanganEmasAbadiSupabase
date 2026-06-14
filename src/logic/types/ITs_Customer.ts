/**
 * Interface Customer (ITs_Customer)
 * 
 * Mendefinisikan struktur data untuk modul Customer.
 * Sesuai dengan spesifikasi Database Customer.
 */

export interface ICustomer {
  /** UUID v4 */
  id: string;
  
  /** Nama Customer (Mandatory) */
  name: string;
  
  /** Nama Perusahaan (Optional) */
  company?: string | null;
  
  /** Nomor telepon customer (Mandatory) */
  telepon: string;
  
  /** Email customer (Optional) */
  email?: string | null;
  
  /** Koordinat lokasi (Mandatory). Format: "lat,long" */
  latlong: string;
  
  /** Alamat lengkap (Mandatory) */
  alamat: string;

  /** Bidang Usaha (Optional) */
  bidang_usaha?: string | null;

  /** Audit Trail - Creation */
  created_at?: string;
  created_by?: string | null;
  created_timezone?: string;

  /** Audit Trail - Update */
  updated_at?: string | null;
  updated_by?: string | null;
  updated_timezone?: string;
}
