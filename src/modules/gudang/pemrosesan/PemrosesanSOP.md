# Standar Operasional Prosedur (SOP) Pemrosesan Produk

## 1. Pendahuluan
Modul Pemrosesan dirancang untuk mencatat riwayat perlakuan produk (seperti pengeringan, pembersihan, atau seleksi) guna mencapai standar kualitas target (kadar air, kebersihan, dll). Sistem ini mendukung pemrosesan parsial dan berulang (recursive processing).

## 2. Alur Masuk Barang
- Produk yang muncul di modul ini adalah produk yang telah melalui tahap **Penerimaan** dan membutuhkan tindakan lanjut berdasarkan hasil **Quality Control (QC)**.
- Stok yang tersedia untuk diproses adalah total Qty Aktual dari penerimaan dikurangi total penyusutan dari proses-proses sebelumnya.

## 3. Mekanisme Pemrosesan & Pencampuran
Sistem menggunakan logika **Buffer Gudang Virtual**, di mana produk yang sudah diproses maupun yang belum diproses berada dalam satu kesatuan stok yang dapat diambil kembali untuk proses selanjutnya.

### Prosedur Pencatatan:
1.  **Ambil Barang**: Tentukan jumlah fisik yang akan diproses (`qty_sebelum`). Barang ini bisa berasal dari stok mentah (belum proses) atau stok yang sudah pernah diproses sebelumnya.
2.  **Lakukan Proses**: Jalankan aktivitas pemrosesan (misal: masuk mesin pengering).
3.  **Timbang Akhir**: Masukkan jumlah fisik setelah proses selesai (`qty_sesudah`).
4.  **Ukur Kualitas**: Lakukan pengukuran kadar air akhir (`kadar_air_post`).

## 4. Logika Perhitungan (Simulasi)
Untuk memastikan akurasi data stok, perhitungan dilakukan sebagai berikut:

**Kasus: Penerimaan Awal 1.000 kg**

| Tahapan | Aksi | Qty Sebelum | Qty Sesudah | Penyusutan | Sisa Stok Gudang |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Awal** | Penerimaan | - | - | - | **1.000 kg** |
| **Proses 1**| Ambil 500 kg | 500 kg | 480 kg | 20 kg | 480 + 500 = **980 kg** |
| **Proses 2**| Ambil 300 kg* | 300 kg | 290 kg | 10 kg | 290 + 680 = **970 kg** |

*\*Catatan: 300 kg pada Proses 2 bisa berupa campuran dari 480 kg (hasil Proses 1) dan 500 kg (belum proses).*

## 5. Parameter Keberhasilan
- **Qty Penyusutan**: Selisih otomatis antara `qty_sebelum` dan `qty_sesudah`.
- **Efisiensi**: Perbandingan kadar air post-process terhadap kadar air aktual saat penerimaan untuk mengukur efektivitas alat/mesin.
- **Status Selesai**: Data dianggap sah jika status sudah berubah menjadi `completed` dan bukti foto (`proof_fileurl`) telah diunggah.

## 6. Audit Trail
Setiap perubahan data akan dicatat oleh sistem termasuk:
- Siapa yang melakukan input (`created_by`).
- Kapan proses dilakukan (`timestamp`).
- Lokasi atau zona waktu pengerjaan (`timezone`).
