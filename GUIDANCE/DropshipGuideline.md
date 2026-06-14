# Dropship Feature Guideline

## Konsep Dasar
Modul Dropship ini bertujuan mengakomodasi transaksi penjualan di mana produk dikirimkan langsung dari supplier ke customer tanpa melewati gudang penyimpanan mandiri.

## Alur Transaksi
Berdasarkan hasil diskusi, **Penjualan dibuat lebih dahulu**. 
1. **Perekaman Penjualan**: Pada `PenjualanFormPage.tsx`, Admin Penjualan dapat menambahkan produk dengan tipe khusus, yaitu "Dropship".
2. **Metadata Produk**: Tidak seperti produk reguler yang diambil dari master stok barang (SKU), Admin dapat secara *on-the-fly* mengetikkan *Nama Produk, Kategori, Sub Kategori, Satuan, dan Harga Jual*.
3. **Harga Pokok Penjualan (Modal / HPP)**: Karena HPP sebenarnya akan tercatat secara terpisah saat Admin Pembelian melakukan *checkout* ke supplier di modul Pembelian, pada modul Penjualan ini nilai modal awal (Base Price) produk Dropship bisa diisikan estimasi secara manual, atau dibiarkan `0` (seolah margin penjualan dropship terpisah dari HPP, dan HPP akan tecover di pengeluaran Pembelian sepenuhnya).
4. **Stok Berjalan**: Produk yang ditandai sebagai `dropship` otomatis akan diabaikan oleh sinkronisasi `StokBerjalanService` sehingga stok gudang tidak berantakan.

## Perubahan Kode yang Direncanakan
1. **File `ITs_Penjualan.ts`**
   - Menambahkan field `is_dropship: boolean` (sebagai penanda bahwa produk tidak memotong stok).
   - Menambahkan `kategori?: string` dan `sub_kategori?: string`.
2. **File `PenjualanTable.sql`**
   - Menambahkan kolom `is_dropship INTEGER NOT NULL DEFAULT 0` pada tabel `penjualan_produk`.
   - Menambahkan kolom `kategori TEXT` dan `sub_kategori TEXT` pada `penjualan_produk`.
3. **File `PenjualanFormPage.tsx`**
   - Menambahkan Tab ke-3 di Modal Tambah Produk untuk "Dropship".
   - Menyesuaikan input manual untuk Nama, Kategori, Sub Kategori, Satuan, Qty, dan Harga Jual.
   - Mengupdate fungsi penampilan `TableCell` untuk menyertakan badge "Dropship".
4. **File `penjualanService.ts`**
   - Membuat function `getApprovedDropshipItems()` untuk mengambil item pesanan dropship dari Penjualan yang berstatus 'Approved' dan 'status = Confirmed/Completed'.
5. **File `PembelianFormPage.tsx`**
   - Menambahkan tombol "Tarik Dropship dari Penjualan" di tab "Products".
   - Menambahkan Modal Daftar Dropship untuk Admin Pembelian memilih pesanan mana yang akan diproses pembeliannya.
   - Mengisi otomatis data produk (Nama, Qty, Kategori, Harga Modal/Base Price) dari Penjualan, dan otomatis menyiapkan `shipping_type: CUSTOMER` dan info Customer terkait, serta field `additional_description` yang mereferensikan nomor Invoice Penjualannya.

*(Draft diimplementasikan via agent berdasarkan rencana ini)*
