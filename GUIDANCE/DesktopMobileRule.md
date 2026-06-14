# Guidance: Desktop/Mobile Priorities (DesktopMobileRule)

## 1. Filosofi Utama: Desktop-First, Mobile-Optimized
Aplikasi ini dirancang dengan pendekatan **Desktop-First Precision**, dengan prioritas utama pada produktivitas maksimal di layar lebar (Laptops/Desktops). Untuk versi Mobile, aplikasi harus memberikan pengalaman selayaknya **Native Mobile App** yang profesional, smooth secara UX, dan compact secara UI.

### Prinsip Utama:
- **No Zoom Policy**: Aplikasi dikunci pada skala 1:1. User tidak dapat melakukan zoom-in/out manual untuk menjaga integritas UI dan feel "Native".
- **Dynamic Adaptivity**: UI tidak hanya bersifat "Responsive" (mengikuti lebar kontainer), tapi juga "Adaptive" (berubah fungsi/perilaku) menggunakan **Viewport Engine**.
- **Compact UI on Mobile**: Pada mode `isCompact`, elemen UI harus lebih padat, spacing lebih kecil, dan navigasi beralih ke pola mobile-native.

---

## 2. Viewport Engine (The Brain)
Viewport Engine berada di `GlobalContext.tsx` dan menyediakan state `viewport` untuk seluruh aplikasi.

| Property | Threshold | Karakteristik UI |
| :--- | :--- | :--- |
| `isCompact` | `< 640px` | **Mobile Mode**. Sidebar disembunyikan, Spacing dikurangi, Tabel beralih ke Card View. |
| `isTablet` | `640px - 1023px` | **Tablet Mode**. Keseimbangan antara detail desktop dan kemudahan mobile. |
| `isDesktop` | `≥ 1024px` | **Desktop Mode Standard**. Sidebar muncul, layout multi-kolom aktif. |
| `isWide` | `> 1200px` | **Large Desktop Mode**. Lebar konten dibatasi (`max-w-7xl`) untuk kenyamanan baca. |

### Contoh Penggunaan:
```tsx
const { state: { viewport } } = useGlobalState();

return (
  <div className={cn(
    "grid gap-4",
    viewport.isCompact ? "grid-cols-1" : "grid-cols-3"
  )}>
    {/* Elemen */}
  </div>
);
```

---

## 3. Aturan Desain & Styling (MANDATORY)

### A. Penggunaan Spacing & Sizing (REM Only)
**DILARANG** menggunakan unit `px` untuk layout utama. Selalu gunakan Design Tokens dari `src/ui/styles/tokens.ts`.
- **Desktop**: Gunakan `SpacingMedium` (2rem) atau `SpacingLarge` (3rem) untuk padding utama.
- **Mobile (`isCompact`)**: Gunakan `SpacingBase` (1rem) atau `SpacingSmall` (0.75rem) untuk memaksimalkan area kerja.

### B. Typography Adaptivitas
- Judul `FontSizeH1` di Desktop dapat diturunkan menjadi `FontSizeH2` atau `FontSizeH3` di Mobile jika menyebabkan teks terpotong (Layout Break).
- Gunakan `truncate` atau `line-clamp` untuk teks panjang di perangkat mobile.

### C. Touch Strategy
Pada mode `isCompact`, pastikan area interaktif (button/link) memiliki ukuran minimum **44px** secara logis (misal dengan padding transparan) meskipun visualnya elegan dan kecil, untuk meminimalkan kesalahan sentuh.

---

## 4. Policy Anti-Zoom
Aplikasi menerapkan kebijakan **Strict Anti-Zoom** melalui:
1. **Meta Viewport**: Dikonfigurasi otomatis di `index.html` dan diperkuat oleh `GlobalContext.tsx`.
2. **Config Level**: Diatur melalui `appAssets.mobileZoom: false` di `src/ui/styles/assets.ts`.

Hal ini krusial untuk mencegah "jumping layout" saat keyboard mobile muncul atau saat user melakukan double-click secara tidak sengaja.

---

## 5. Rencana Penyesuaian Komponen (Future Roadmap)
Untuk mencapai "Native Professional Feel", pendekatan berikut harus diterapkan pada komponen:
- **Tabel**: Gunakan `DataTablePlus` yang secara otomatis berubah menjadi list card saat `isCompact`.
- **Navigasi Luar**: Sidebar desktop harus beralih menjadi Drawer atau Bottom Navigation di mobile.
- **Modal**: Gunakan `BottomSheet` (seperti native iOS/Android) khusus untuk mode `isCompact`.
- **Feedback**: Gunakan haptic feedback simulation atau animasi `motion` yang lebih ekspresif di Mobile.

---

## 6. Adaptive Column & Sub-Navigation Strategy

Untuk menjaga profesionalisme visual di berbagai resolusi, gunakan strategi adaptif berikut:

### A. Split vs Stacking (Complex Forms)
Pada halaman form yang memiliki banyak ringkasan (Summary Cards) dan input primer:
- **Wide Mode (`isWide`)**: Gunakan Layout Multi-Kolom (misal `grid-cols-12`) dengan pembagian area (misal `col-span-3` untuk input kiri dan `col-span-9` untuk ringkasan kanan).
- **Standard/Compact Mode**: Paksa layout menjadi satu kolom (**Stacking**) meskipun di layar Desktop Standar jika konten mulai berhimpit.

### B. Flexible Card Sizing
- **Mobile**: Gunakan `min-h-[6rem]` (atau sesuai konten) agar kartu tidak terlalu tinggi (menguras scroll).
- **Desktop**: Gunakan `h-full` dalam container grid agar kartu memiliki tinggi yang seragam secara estetik.

### C. Sub-Navigation (Tabs) Alignment
- **Mobile/Tablet**: Navigasi sub-tab harus `justify-start` dengan `overflow-x-auto` dan `min-w-max` agar user dapat melakukan swipe horizontal dengan nyaman.
- **Desktop (`!isMobile && !isTablet`)**: Navigasi sub-tab sebaiknya `justify-center` untuk menjaga keseimbangan visual di tengah layar lebar.

### D. Sidebar Interaction
Konten utama harus bersifat **Fluid**. Area konten WAJIB melakukan expand/shrink secara dinamis saat Sidebar di-collapse atau di-expand untuk memaksimalkan "Real Estate" layar yang tersedia bagi user.

