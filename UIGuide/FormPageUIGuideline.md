# Form Page UI Guideline

Dokumen ini mendefinisikan standar tata letak dan gaya visual untuk semua halaman Form (Tambah/Edit) di dalam aplikasi agar konsisten dengan `AkunFormPage.tsx` sebagai acuan utama.

## 1. Tata Letak (Layout)
- **Shell**: Gunakan `FormShell` sebagai pembungkus utama.
- **Root Container**: Gunakan flexbox atau grid dengan gap `gap-SpacingLarge`.
  - Jika Split Layout:
    - Kiri (Input): `flex flex-col gap-SpacingLarge` (Jika single column) ATAU `grid gap-y-SpacingMedium gap-x-SpacingLarge` (Jika multi column).
    - Kanan (Visual/Map): `rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner`.

## 2. Spasi (Spacing)
- **Antar Input (Vertikal)**:
  - Gunakan `gap-y-SpacingMedium` (0.75rem - 1rem) untuk jarak antar baris input dalam grid.
  - Gunakan `space-y-SpacingSmall` (0.5rem) untuk jarak antara Label dan Input.
- **Antar Kolom**: Gunakan `gap-x-SpacingLarge`.
- **Outer Padding**: Diatur secara otomatis oleh `FormShell`.

## 3. Tipografi & Input
- **Label**:
  - Gunakan komponen `Label`.
  - Properti `required` akan menambahkan asterisk merah.
- **TextInput / Input Elements**:
  - Font weight pada value adalah Standar (Normal), kecuali ada kebutuhan branding yang mewajibkan `font-black` (Contoh: Kode Unik).
  - Background input disarankan menggunakan `bg-ColorBg/OpacitySubtle` atau default.

## 4. Responsivitas
- **DILARANG** menggunakan breakpoint Tailwind (`md:`, `lg:`, dst) untuk logika kondisional.
- Gunakan `useGlobalState()` dari `Viewport Engine` (`isMobile`, `isCompact`) untuk pengaturan responsif yang presisi.
- Namun, penggunaan utilitas grid/flex responsif Tailwind (`grid-cols-1 md:grid-cols-2`) diperbolehkan untuk struktur kolom murni.

## 5. Audit Trail
- Komponen `AuditTrail` biasanya diletakkan di halaman Detail, namun jika ada di Form (biasanya tidak ada), ikuti standar di `AkunDetailPage.tsx`.
