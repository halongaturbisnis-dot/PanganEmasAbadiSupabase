# Aturan Mode Tema (ThemeModeRule)

Dokumen ini menjelaskan kebijakan penggunaan tema visual tunggal dalam aplikasi untuk menjaga konsistensi brand dan kesederhanaan antarmuka.

## 1. Kebijakan Utama: Light Mode Only
Aplikasi ini dirancang dan dikunci secara eksklusif menggunakan **Mode Terang (Light Mode)**.
- **Konsistensi**: Tidak ada opsi bagi pengguna untuk berpindah ke mode gelap (Dark Mode).
- **Aset & Warna**: Semua aset visual, ikon, dan kombinasi warna harus dioptimalkan untuk latar belakang terang sesuai dengan desain token di `src/ui/styles/tokens.ts`.

## 2. Implementasi Arsitektur
Untuk mendukung kebijakan ini, beberapa penyesuaian dilakukan pada level sistem:
- **Global Context**: State `theme` di `GlobalContext` dipaksa (hardcoded) ke nilai `light`. Fungsi `toggleTheme` dinonaktifkan atau dihapus.
- **Persistence**: Tidak diperlukan penyimpanan preferensi tema di `localStorage`.
- **UI Components**: Komponen pemilih tema (Theme Switcher) harus dihapus dari antarmuka pengguna untuk menghindari kebingungan.

## 3. Standar Visual
- **Latar Belakang**: Dominan putih atau abu-abu sangat muda (contoh: `bg-slate-50`).
- **Kontras Teks**: Pastikan teks tetap memiliki kontras tinggi terhadap latar belakang terang untuk aksesibilitas yang baik.
- **Elevasi**: Gunakan bayangan (shadow) yang halus untuk memberikan efek kedalaman pada elemen seperti kartu atau modul.

---
*Dibuat untuk memastikan fokus pada estetika "Clean, Professional, & Business" dalam mode Light.*
