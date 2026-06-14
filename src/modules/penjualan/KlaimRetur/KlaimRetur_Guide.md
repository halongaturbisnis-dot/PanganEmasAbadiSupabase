# Klaim Retur (Return Claim) Module Guide

## 📌 Deskripsi Modul
Modul **Klaim Retur** digunakan oleh tim penjualan untuk mencatat dan mengelola permintaan retur barang dari pelanggan berdasarkan invoice penjualan yang sudah disetujui. Modul ini mencakup pemilihan produk yang akan diklaim, penentuan alasan, lampiran bukti, serta keputusan kebijakan penyelesaian (Ganti Barang atau Pengembalian Dana).

## 🛠️ Fitur Utama
1. **Daftar Klaim Retur**: Menampilkan histori klaim retur dengan status (Pending, Approved, Rejected, Completed).
2. **Form Pengajuan Klaim**: 
   - Pilih Invoice Penjualan (Hanya yang statusnya 'Approved').
   - Pilih Produk dari invoice tersebut.
   - Entry Qty retur, Alasan, Lampiran Bukti, dan Kebijakan (Replace/Refund).
3. **Detail Klaim**: Tampilan detail informasi klaim beserta item produk yang diklaim secara read-only.
4. **Kebijakan Fleksibel**: Mendukung kebijakan *Replace* (Ganti barang sejenis) atau *Refund* (Pengembalian dana sesuai harga beli).

## 🗄️ Struktur Data & Relasi
- **Klaim Retur (Header)**: Menyimpan informasi invoice, customer, total nominal refund, dan status.
- **Klaim Retur Item (Detail)**: Menyimpan snapshot produk yang diklaim, qty, alasan, dan kebijakan per item.
- **Relasi**:
  - `klaim_retur.penjualan_id` -> `penjualan.id`
  - `klaim_retur_item.penjualan_produk_id` -> `penjualan_produk.id`

## 🚀 Integrasi Service
- Menggunakan `klaimReturService` untuk operasi CRUD.
- Terhubung dengan `turso.ts` untuk presistensi data.
- Terhubung dengan `storageClient.ts` untuk upload bukti klaim.

## 🎨 Standar UI/UX
- Menggunakan `MainShell` untuk halaman daftar.
- Menggunakan `FormShell` untuk pembuatan/edit klaim.
- Menggunakan `DetailShell` untuk tampilan rincian klaim.
- Konsistensi visual mengikuti tema **Clean, Professional, Business**.
