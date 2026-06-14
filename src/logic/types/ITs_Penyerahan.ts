import { EntityBase } from './app';
import { ITs_Penjualan } from './ITs_Penjualan';

/**
 * Enum Tipe Penyerahan
 * - Loco: Barang diambil langsung oleh pembeli di lokasi penjual
 * - Franco: Barang dikirim ke lokasi pembeli
 */
export enum TPenyerahanType {
  LOCO = 'Loco',
  FRANCO = 'Franco',
}

/**
 * Enum Status Penyerahan
 */
export enum TPenyerahanStatus {
  PENDING = 'Pending', // Menunggu proses atau surat jalan belum final
  READY = 'Ready', // Siap diambil (Loco) atau siap dikirim (Franco)
  ON_DELIVERY = 'On Delivery', // Sedang dalam perjalanan (khusus Franco)
  COMPLETED = 'Completed', // Barang sudah diterima pembeli
  CANCELLED = 'Cancelled', // Transaksi penyerahan dibatalkan
}

/**
 * Interface Berkas Pendukung (File Storage)
 */
export interface IPenyerahanFile {
  url: string;
  name?: string;
  key?: string;
}

/**
 * Interface Utama Penyerahan
 */
export interface IPenyerahan extends EntityBase {
  /** UUID v4 */
  id: string;

  /** ID Penjualan (FK ke tabel penjualan) */
  penjualan_id: string;

  /** Jenis penyerahan: Loco atau Franco */
  penyerahan_type: TPenyerahanType;

  /** Nomor referensi Surat Jalan (Biasanya untuk Franco) */
  surat_jalan_number?: string | null;

  /** Tanggal inisiasi dokumen / pencatatan awal */
  datetime: string;

  /** Waktu aktual barang diserahkan ke tangan konsumen (Loco/Franco) */
  handover_datetime?: string | null;

  /** Nama pihak yang menerima barang */
  recipient_name?: string | null;

  /** Catatan atau deskripsi kendala / keterangan opsional */
  description?: string | null;

  // --- DATA KHUSUS FRANCO (PENGIRIMAN) ---
  /** Jenis pengiriman (Kurir Internal, Lalamove, JNE, dst.) */
  shipping_method?: string | null;

  /** Nomor Polisi Kendaraan Pengirim */
  vehicle_number?: string | null;

  /** Nama Pengemudi / Supir */
  driver_name?: string | null;

  /** Nomor Telepon Pengemudi */
  driver_phone?: string | null;

  /** ID User Pengemudi (Jika menggunakan akun internal) */
  driver_user_id?: string | null;

  /** Nomor Resi untuk Ekspedisi Eksternal */
  resi_number?: string | null;

  /** Status proses penyerahan */
  status: TPenyerahanStatus;

  /** Latitude aktual saat penyerahan / handover */
  handover_lat?: number | null;

  /** Longitude aktual saat penyerahan / handover */
  handover_lng?: number | null;

  /** Jarak dari koordinat customer (dalam Meter) */
  handover_distance?: number | null;

  /** Alamat hasil reverse geocoding saat handover */
  handover_address?: string | null;

  /** 
   * JSON String array dari IPenyerahanFile 
   * Menyimpan URL bukti serah terima foto/ttd Surat Jalan
   */
  proof_fileurls: string;
}

/**
 * Payload Data Penyerahan (Untuk Form / Transfer state di Frontend)
 */
export interface IPenyerahanPayload extends Omit<IPenyerahan, 'proof_fileurls'> {
  /** Data URL yang di parse dari string proof_fileurls */
  proof_fileurls: IPenyerahanFile[];
  
  /** Data Penjualan Terkait (Opsional, untuk kebutuhan PDF/Detail) */
  penjualan_data?: ITs_Penjualan | null;

  /** Raw File ketika proses input sebelum dikirim ke StorageService (Tigris) */
  files?: File[];
}
