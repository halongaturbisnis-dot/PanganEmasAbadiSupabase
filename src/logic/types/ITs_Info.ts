/**
 * Interface Info (ITs_Info)
 * 
 * Mendefinisikan struktur data untuk tabel Informasi Perusahaan.
 */

export interface IInfo {
  id: string;
  alamat: string;
  no_telepon: string;
  
  /** Audit Trail - Creation */
  created_at?: string;
  created_by?: string | null;
  created_timezone?: string;

  /** Audit Trail - Update */
  updated_at?: string | null;
  updated_by?: string | null;
  updated_timezone?: string;
}
