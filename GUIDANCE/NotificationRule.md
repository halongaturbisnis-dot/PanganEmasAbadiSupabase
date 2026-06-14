# Aturan Notifikasi (NotificationRule)

Dokumen ini menjelaskan standar penggunaan notifikasi dalam aplikasi untuk memastikan komunikasi yang tepat dan tidak mengganggu alur kerja pengguna.

## 1. Notifikasi Operasional (CRUD)
Setiap operasi data standar (Create, Read, Update, Delete) yang berhasil atau gagal namun bersifat non-blokir wajib menggunakan **Toast**.
- **Library**: `react-hot-toast` (atau komponen toast internal yang setara).
- **Karakteristik**: Berdurasi singkat (3-5 detik), muncul di sudut layar, dan tidak memerlukan interaksi pengguna untuk hilang.
- **Kapan Digunakan**:
  - "Data berhasil disimpan."
  - "Profil diperbarui."
  - "Gagal memuat daftar, silakan coba lagi."

## 2. Notifikasi Penting & Konfirmasi (Alert/Crucial)
Informasi yang memerlukan perhatian penuh pengguna atau tindakan konfirmasi yang tidak bisa dibatalkan wajib menggunakan **SweetAlert2 (SWAL)**.
- **Library**: `sweetalert2`.
- **Karakteristik**: Modal di tengah layar, memblokir interaksi dengan latar belakang, dan memerlukan penekanan tombol untuk ditutup atau dilanjutkan.
- **Kapan Digunakan**:
  - **Warning**: "Apakah Anda yakin ingin menghapus file ini secara permanen?"
  - **Crucial Error**: "Sesi Anda telah berakhir. Harap login kembali."
  - **Success/Info Penting**: "Pembayaran Berhasil! Silakan cetak struk Anda."

## 3. Konsistensi Pesan
- Gunakan bahasa yang ramah dan solutif.
- Hindari kode error teknis yang membingungkan langsung ke pengguna UI.
- Pastikan ikon (Success, Error, Warning, Info) sesuai dengan konteks pesan.

---
*Dibuat untuk meningkatkan kepuasan pengguna melalui feedback yang intuitif.*
