# Aturan Penyimpanan (StorageRule)

Dokumen ini menjelaskan mekanisme pengelolaan file (Image, PDF, Dokumen) menggunakan Tigris Storage dengan standar optimasi client-side.

## 1. Format File yang Diizinkan
Aplikasi hanya mengizinkan file dengan ekstensi berikut:
- **Image**: `.jpg`, `.jpeg`, `.png`, `.webp` (GIF dilarang).
- **PDF**: `.pdf`.
- **Dokumen**: `.txt`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`.

## 2. Optimasi Client-Side (Wajib)
Sebelum file dikirim ke server/storage, proses kompresi wajib dilakukan di sisi client untuk menghemat bandwidth:
- **Gambar**: Menggunakan library **Pica** untuk resample/downscale agar tetap tajam namun ukuran file minimal.
- **PDF**: Menggunakan library **pdf-lib** untuk optimasi struktur file/metadata.
- **Lainnya**: File teks dan dokumen kantor tidak melalui proses kompresi.

## 3. Pratinjau & Placeholder
- Setiap upload wajib menampilkan **Instant Thumbnail Preview**.
- Untuk file non-gambar (PDF/Doc), gunakan placeholder icon yang representatif sesuai dengan `getDocThumbnail()` di `src/logic/utils/file.ts`.

## 4. Manajemen lifecycle File (Anti-Yatim Piatu)
Untuk mencegah penumpukan file sampah (orphan files) di Tigris:
- **Permanent Delete**: Jika sebuah baris data di database dihapus, file terkait wajib dihapus secara permanen dari storage.
- **Update Cleanup**: Jika file pada suatu baris data diganti dengan file baru, file lama wajib dihapus secara permanen sebelum menyimpan referensi file baru.
- **Public Access**: Semua file yang diupload harus dapat diakses secara publik melalui URL yang dihasilkan.

## 5. Sinkronisasi Data
- File **HANYA** boleh diupload ketika pengguna menekan tombol "Simpan" pada form utama.
- Selama pemilihan file di UI, cukup gunakan `Blob URL` untuk pratinjau sementara.
- Setelah berhasil upload, URL file wajib disimpan kembali ke database sebagai referensi utama.

---

## 6. Penanganan Key Saat Penghapusan
Untuk menjamin file benar-benar terhapus dari Tigris, Key yang dikirim ke `DeleteObjectCommand` harus berupa **Relative Path**, bukan full path atau proxy path.
- **Masalah**: Database sering menyimpan proxy path `/api/images/folder/file.jpg`. Jika ini dikirim langsung, S3 akan gagal menemukan file (404).
- **Mandat**: Selalu bersihkan key menggunakan helper logika:
  ```typescript
  // Contoh Ekstraksi
  const actualKey = key.includes('/api/images/') ? key.split('/api/images/').pop() : key;
  ```

---
*Dibuat untuk menjaga integritas data dan efisiensi penyimpanan pada infrastruktur Tigris.*
