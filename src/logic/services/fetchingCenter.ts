/**
 * SERVICES/FETCHINGCENTER.TS
 * Centralized configuration for data fetching limits (Lazy Loading).
 */

export interface FetchingLimitConfig {
  [pageKey: string]: number;
}

export const LAZY_LOADING_LIMITS: FetchingLimitConfig = {
  // DEFAULT fallback value
  'DEFAULT': 10,

  // Sample page configuration
  'dummypage': 12,

  // Feature specific pages
  'DaftarAkun': 20,
  'RiwayatTransaksi': 15,
  'DaftarSuplier': 10,
  'DaftarCustomer': 15,
  'DaftarPemasaran': 15,
  'DaftarBankAndCash': 20,
  'DaftarPengeluaran': 15,
  'PermintaanPengeluaran': 15,
  'DaftarPemasukan': 15,
  'DaftarPembelian': 15,
  'DaftarPengiriman': 15,
  'DaftarPenerimaan': 15,
  'DaftarPemrosesan': 15,
  'DaftarStokMasuk': 15,
  'StokBerjalanPage': 15,
  'StokReturPage': 15,
  'StokTerbuangPage': 15,
  'DaftarHargaPage': 15,
  'DaftarPenjualan': 15,
  'DaftarPenyerahan': 15,
  'DaftarKlaimRetur': 15,
  'JurnalTransaksi': 50,
};

/**
 * Utility to get the limit for a specific page.
 * Falls back to DEFAULT if pageKey is not found.
 */
export const getPageFetchLimit = (pageKey: string): number => {
  return LAZY_LOADING_LIMITS[pageKey] || LAZY_LOADING_LIMITS['DEFAULT'];
};
