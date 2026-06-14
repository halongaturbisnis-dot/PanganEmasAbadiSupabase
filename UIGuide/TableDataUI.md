# Table Data UI Guideline

Dokumen ini mendefinisikan standar styling untuk daftar data dalam tabel agar konsisten dengan `AkunPage.tsx` dan desain universal aplikasi.

## 1. Struktur Tabel
- **Table Container**: Gunakan `<Table noBorder={true}>`.
- **Header**:
  - Gunakan `<TableRow isHeader={true} noBorder={true}>`.
  - Header text biasanya otomatis terformat via komponen `TableHead`.
- **Body**:
  - Semua `<TableRow>` dan `<TableCell>` HARUS menggunakan properti `noBorder={true}`.
  - Tambahkan `hover:bg-ColorBgSecondary/OpacitySubtle` untuk interaktivitas baris.
  - Untuk baris yang bisa diklik (Navigate to Detail):
    ```tsx
    <TableRow 
      noBorder={true} 
      className="cursor-pointer select-none"
      onClick={() => navigate(`/path/detail/${row.id}`)}
    >
    ```

## 2. Styling Sel (Cell Content)
- **Primary Info (Avatar + Text)**:
  - Gunakan `flex items-center gap-SpacingSmall`.
  - Image: `w-8 h-8 rounded-RadiusFull object-cover`.
  - Text: `flex flex-col min-w-0`.
    - Title: `text-FontSizeXs font-semibold text-TextColorBase leading-tight truncate`.
    - Subtitle: `text-FontSizeNano text-TextColorMuted leading-tight mt-0.5 truncate`.

- **Data Tekstual (Telepon, Email, dll)**:
  - Gunakan `text-FontSizeXs text-TextColorBase`.
  - Untuk data kosong, tampilkan `-` dengan style miring (`italic`) atau standard.

- **Status & Badge**:
  - Gunakan `px-SpacingSmall py-SpacingNano rounded-RadiusFull font-normal !text-FontSizeNano`.
  - Contoh klasifikasi warna: `bg-ColorSecondary` (Info), `bg-FeedbackColorSuccess` (Success), dst.

## 3. Kolom Aksi (Action Column)
- Gunakan `w-24` atau lebar tetap yang kecil.
- Gunakan `<GhostButton>` dengan ukuran `sm`.
- Icon size: `1rem` (approx 16px).
- Pastikan `onClick` pada tombol aksi memanggil `e.stopPropagation()` agar tidak memicu navigasi baris.

## 4. Responsivitas (Mobile Table)
- Pada layar kecil, tabel harus tetap rapi dengan `overflow-x-auto`.
- Pertimbangkan menyembunyikan kolom yang tidak kritikal pada `isMobile` menggunakan logic ternary (Contoh: `!isMobile && <TableHead>...</TableHead>`).
