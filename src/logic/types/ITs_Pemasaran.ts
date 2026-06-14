/**
 * Interface Pemasaran (ITs_Pemasaran)
 * 
 * Mendefinisikan struktur data dan tipe aktivitas untuk modul Pemasaran.
 * Sesuai dengan spesifikasi tabel database pemasaran.
 */

export type IPemasaranActivityType = 'client relation' | 'selling' | 'offering';

export interface IPemasaran {
  /** UUID v4 */
  id: string;
  
  /** Waktu aktual kejadian kunjungan (Mandatory). Format: ISO String ("YYYY-MM-DDTHH:mm:ss.sssZ" atau string DATETIME SQLite) */
  visit_date: string;
  
  /** Username sales yang melakukan kunjungan (Mandatory) */
  sales_username: string;
  
  /** Tipe Kegiatan Pemasaran (Mandatory) */
  activity_type: IPemasaranActivityType;
  
  /** Referensi ID Customer (Mandatory) - Menghubungkan ke tabel customer */
  customer_id: string;
  
  /** Deskripsi atau catatan hasil kunjungan (Optional) */
  description?: string | null;
  
  /** Koordinat lokasi GPS kunjungan (Mandatory) - Format: "latitude,longitude" */
  latlong_visiting: string;
  
  /** Alamat lengkap lokasi kunjungan (Mandatory) */
  alamat: string;
  
  /** URL bukti berkas/foto kunjungan (Mandatory) */
  proof_url: string;
  
  /** Audit Trail - Pembuatan (Mandatory) */
  created_at?: string;
  created_by?: string | null;
  created_timezone?: string;

  /** Audit Trail - Pembaruan (Optional) */
  updated_at?: string | null;
  updated_by?: string | null;
  updated_timezone?: string;
}
