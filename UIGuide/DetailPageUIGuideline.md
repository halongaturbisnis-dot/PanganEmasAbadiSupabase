# Detail Page UI Guideline

Dokumen ini mendefinisikan standar tata letak dan gaya visual untuk semua halaman Detail (Read-only) di dalam aplikasi agar konsisten dengan `AkunDetailPage.tsx` sebagai acuan utama.

## 1. Tata Letak (Layout)
- **Shell**: Gunakan `DetailShell` sebagai pembungkus utama.
- **Root Container**: Gunakan flexbox responsif `flex flex-col md:flex-row gap-SpacingLarge items-start`.
- **Side Panel (Optional)**: Jika ada foto atau profil utama, letakkan di kolom kiri (`w-full md:w-1/3`).
- **Main Information Card**: Gunakan grid untuk informasi detail di kolom kanan (`w-full md:w-2/3`).
  - Grid: `grid grid-cols-1 md:grid-cols-2 gap-x-SpacingLarge gap-y-SpacingMedium`.

## 2. Komponen Informasi (Value Box)
Semua rincian data ditampilkan menggunakan kontainer non-editable (bukan `<input disabled />`).
- **Komponen**: Buat internal component `ValueBox` dalam file Page terkait.
- **Style**:
  ```tsx
  const ValueBox: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(
      "w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-ColorSidebarBorder/OpacityMuted bg-ColorBgSecondary/OpacityMuted min-h-[2.5rem] flex items-center text-FontSizeSm font-medium text-TextColorBase",
      className
    )}>
      {children}
    </div>
  );
  ```
- **Label & Value**: Gunakan `space-y-SpacingSmall` (0.5rem) antara Label dan ValueBox.

## 3. Tipografi
- **FontSize**: Gunakan `text-FontSizeSm` untuk konten di dalam `ValueBox`.
- **FontWeight**: Gunakan `font-medium` (Standard) untuk isi data, jangan gunakan `font-black` untuk teks biasa.

## 4. Audit Trail
- **Posisi**: Letakkan di bagian paling bawah setelah konten utama selesai.
- **Pemisah**: Dilarang menggunakan border
- **Komponen**: Gunakan `<AuditTrail />` dengan passing data lengkap:
  ```tsx
  <AuditTrail 
    createdAt={data.created_at}
    createdBy={data.created_by}
    createdTimezone={data.created_timezone}
    updatedAt={data.updated_at}
    updatedBy={data.updated_by}
    updatedTimezone={data.updated_timezone}
  />
  ```

## 5. Responsivitas
- Gunakan `useGlobalState()` untuk mendapatkan `isMobile` via Viewport Engine.
- Struktur grid harus adaptif (`grid-cols-1 md:grid-cols-2`).
