# Guidance: Location Detection (LocationRule)

## 1. Filosofi Utama: High-Integrity Location
Aplikasi ini mewajibkan akurasi lokasi yang tinggi untuk integritas data. Prinsip utama adalah menggunakan GPS Satelit sebagai sumber utama, dengan mekanisme fallback yang aman dan transparan jika GPS tidak tersedia.

### Prinsip Utama:
- **GPS-First**: Selalu mengaktifkan `enableHighAccuracy: true` untuk memaksa perangkat menggunakan modul GPS/GNSS.
- **Hybrid Detection**: Sistem secara otomatis membedakan antara lokasi GPS (presisi tinggi) dan lokasi Tower/Network (presisi rendah) berdasarkan nilai `accuracy`.
- **Anti-Manipulation**: Lokasi harus dideteksi secara real-time. Penggunaan data lokasi yang terlalu lama (stale data) harus dibatasi.
- **Permission Optionality**: Izin lokasi harus diminta secara eksplisit. Jika ditolak, aplikasi **tetap boleh diakses**, namun fitur yang membutuhkan lokasi akan dinonaktifkan atau memberikan peringatan.

---

## 2. Standar Teknis Deteksi (MANDATORY)

### A. Klasifikasi Sumber
Klasifikasi dilakukan di `src/logic/services/locationService.ts` berdasarkan akurasi (dalam meter):

| Akurasi (meter) | Klasifikasi Sumber | Keandalan |
| :--- | :--- | :--- |
| `< 100m` | **GPS / Satelit** | Tinggi (Sangat Sulit Dimanipulasi) |
| `100m - 500m` | **Tower / Network** | Sedang (Fallback) |
| `> 500m` | **IP / Estimated** | Rendah (Hanya untuk referensi kasar) |

### B. Konfigurasi Geolocation API
Setiap pemanggilan lokasi harus menggunakan konfigurasi berikut:
```tsx
{
  enableHighAccuracy: true, // WAJIB: Mencoba koneksi Satelit
  timeout: 10000,           // 10 Detik batas tunggu
  maximumAge: 300000        // 5 Menit batas cache data
}
```

---

## 3. Alur Permission & UX
Aplikasi harus mengikuti alur berikut untuk menjaga UX yang smooth:

1. **Informative Prompt**: Sebelum browser memunculkan popup izin standar, aplikasi sebaiknya memberikan penjelasan singkat mengapa lokasi dibutuhkan (jika konteksnya kritikal).
2. **Permission Check**: Gunakan `navigator.permissions.query` untuk mendeteksi status sebelum eksekusi.
3. **Graceful Degradation**:
   - Jika Status = `granted`: Ambil lokasi otomatis.
   - Jika Status = `denied`: Tampilkan pesan edukasi bahwa fitur tertentu terbatas, tapi jangan blokir akses ke menu lain.
   - Jika Status = `prompt`: Mintalah izin saat fitur lokasi pertama kali diakses.

---

## 4. Implementasi Kode Terpusat

- **Logic**: `src/logic/services/locationService.ts` (Mesin deteksi).
- **Hooks**: `useLocation` di `src/logic/hooks/useLocation.ts` (Manajemen state UI).
- **UI Element**: `MapPicker` atau `RouteMap` di `src/ui/components/elements/` (Visualisasi).

---

## 5. Keamanan & Invariant
- **DILARANG** mempercayai lokasi dari client-side untuk transaksi finansial/stok tanpa verifikasi server-side (jika ada).
- **DILARANG** melakukan hard-block aplikasi hanya karena user mematikan GPS, kecuali untuk halaman spesifik yang absolut membutuhkan lokasi (misal: Absensi Geofencing).
