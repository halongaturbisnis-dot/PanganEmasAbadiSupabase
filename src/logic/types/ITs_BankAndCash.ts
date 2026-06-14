/**
 * Interface Kas & Bank (ITs_BankAndCash)
 * 
 * Mendefinisikan struktur data untuk modul Kas & Bank.
 * Berdasarkan spesifikasi pada Database "Kas & Bank".
 */

/**
 * Tipe Akun Keuangan
 */
export enum TBankAndCashType {
  KAS = 'Kas',
  BANK = 'Bank',
}

export interface IBankAndCash {
  /** UUID v4 */
  id: string;
  
  /** Nama akun (e.g. Kas Utama, Bank BCA, dll) */
  nama_akun: string;
  
  /** Tipe akun: Kas atau Bank */
  tipe: TBankAndCashType;
  
  /** Nama Bank (Hanya jika tipe = Bank) */
  nama_bank?: string | null;
  
  /** Nomor Rekening (Hanya jika tipe = Bank) */
  nomor_rekening?: string | null;
  
  /** Nama Pemilik Rekening (Hanya jika tipe = Bank) */
  nama_pemilik?: string | null;
  
  /** Status sebagai akun utama (Default), 1 = True, 0 = False */
  is_default: number;
  
  /** Status apakah data boleh dihapus (Misal: Kas Utama tidak boleh dihapus), 1 = True, 0 = False */
  is_deletable: number;
  
  /** Audit Trail - Creation */
  created_at?: string;
  created_by?: string | null;
  created_timezone?: string;

  /** Audit Trail - Update */
  updated_at?: string | null;
  updated_by?: string | null;
  updated_timezone?: string;
}
