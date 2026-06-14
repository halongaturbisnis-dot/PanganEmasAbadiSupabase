# Penjualan Guideline (Mixing vs Non-Mixing)

Dokumen ini menjelaskan logika bisnis dan alur teknis penanganan produk dalam modul Penjualan, khususnya perbedaan antara Produk Standar dan Produk Mixing (Custom).

## 1. Klasifikasi Produk

### A. Produk Standar (Non-Mixing)
- **Definisi**: Produk yang dijual langsung dari gudang (mempunyai SKU tunggal).
- **HPP (Base Price)**: Diambil langsung dari kolom `base_price` (HPP Running) pada master `stok_berjalan` saat transaksi dibuat.
- **Snapshot**: Nilai HPP disimpan secara permanen di baris transaksi untuk menjaga integritas laporan laba/rugi historis.

### B. Produk Mixing (Custom/Racikan)
- **Definisi**: Produk hasil gabungan beberapa komponen/produk lain yang dibuat secara ad-hoc saat penjualan (misal: Hampers, Paket Custom, atau Campuran Bahan).
- **Identitas**: Memiliki Satu Nama Produk, Satu Satuan (misal: Unit/Box/Pcs), dan Kuantitas di level invoice.
- **Komposisi**: Memiliki rincian bahan baku (SKU asal) di baliknya.
- **HPP (Base Price)**: Hasil penjumlahan dari (Qty Komposisi * HPP Komponen) per satu unit produk racikan.
- **Margin**: Dihitung dari selisih Harga Jual total dikurangi Total HPP dari seluruh komponen rakitan tersebut.

## 2. Perekaman Data (Snapshotting)

Sesuai aturan akuntansi, sistem melakukan "Snapshot" saat tombol **Simpan** ditekan:
1. **Snap HPP**: Mengunci harga modal saat itu agar jika kedepannya harga modal di gudang naik, margin penjualan masa lalu tidak berubah.
2. **Snap Komposisi**: Mengunci daftar bahan yang digunakan saat itu.
3. **Potong Stok**:
   - Jika Produk Standar: Memotong stok SKU yang bersangkutan.
   - Jika Produk Mixing: Memotong stok dari masing-masing SKU yang menjadi komponen dalam komposisi produk racikan tersebut.

## 3. Struktur Tabel Terkait (Relasi)

- **penjualan**: Header transaksi.
- **penjualan_produk**: Daftar item di invoice. Memiliki flag `is_mixing`.
- **penjualan_produk_mixing**: Rincian bahan baku (hanya ada jika item di atas bertipe mixing).
- **penjualan_biaya**: Biaya tambahan (logistik/packing) yang menambah Grand Total tapi tidak masuk ke HPP Produk.

## 4. Alur Kerja UI (Frontend)

1. User memilih Pelanggan & Metode Pembayaran.
2. User menambahkan Produk:
   - Pilih **Normal**: Cari SKU -> Ambil Harga -> Selesai.
   - Pilih **Mixing**: Masukkan Nama Custom -> Masukkan Komposisi (List SKU & Takaran) -> Kalkulasi HPP Otomatis -> User menentukan Harga Jual Final.
3. User menambahkan Biaya Tambahan (opsional).
4. Klik **Simpan** -> Service melakukan Batch Transaction (Atomicity).

---
*Dibuat untuk menjaga standar pengembangan modul Penjualan AI Studio Build.*
