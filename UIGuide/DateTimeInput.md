# Panduan Penggunaan DateTimeInput, DateInput, dan TimeInput

Dokumen ini berisi panduan standar penggunaan komponen input tanggal dan waktu (`DateTimeInput`, `DateInput`, dan `TimeInput`) yang berada di `src/ui/components/elements/DateTimeInput.tsx` agar tidak terjadi kesalahan rendering (seperti teks "dd/mm/yyyy --:--") atau _bug_ saat mengontrol data.

## 1. Gunakan Helper Format Tanggal yang Tepat
Input HTML standar untuk `type="datetime-local"`, `type="date"`, dan `type="time"` memiliki format _value_ yang ketat. 
- ❌ **JANGAN** menggunakan `new Date().toISOString()` untuk `DateTimeInput` karena akan menghasilkan string yang mengandung format UTC (contoh: `2024-05-26T09:00:00.000Z`). Input browser tidak akan memunculkan nilai tersebut.
- ✅ **GUNAKAN** fungsi pembantu dari `src/logic/utils/date.ts`. Misalnya, gunakan `formatDateTimeLocal()` agar sesuai dengan format persis `YYYY-MM-DDThh:mm` tanpa detik dan timezone (_zero-padded_).

Contoh yang benar saat inisialisasi state:
```tsx
import { formatDateTimeLocal } from '../../../../logic/utils/date';

const [formData, setFormData] = useState({
  // BENAR
  tanggal: formatDateTimeLocal(), 
});
```

## 2. Event `onChange` Adalah Standar React
Komponen `DateTimeInput` merupakan implementasi standar dari `React.InputHTMLAttributes<HTMLInputElement>`. 
- ❌ **JANGAN** menggunakan sintaks callback nilai langsung seperti `onChange={(val) => setFormData(val)}`.
- ✅ **GUNAKAN** standar React Event, lalu ambil nilainya melalui `e.target.value`.

Contoh yang benar saat menangani perubahan input:
```tsx
<DateTimeInput 
  id="tgl-pembayaran" 
  value={formData.tanggal} 
  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))} 
/>
```

## 3. Label Terpisah (Modular UI)
Karena komponen ini dibuat sangat atomik/_base element_, komponen input tidak mendudukkan `label` di dalam _props_-nya (tidak ada `label="Teks"`).
- ✅ **GUNAKAN** komponen `<Label>` dari `src/ui/components/elements/Label.tsx` sebelum memanggil input dan bungkus di dalam layout `div` dengan spasi standar untuk hasil form yang seragam.

Contoh struktur form kolom tanggal:
```tsx
import { Label } from '../../../../ui/components/elements/Label';
import { DateTimeInput } from '../../../../ui/components/elements/DateTimeInput';

// Di dalam block grid:
<div className="space-y-SpacingSmall">
  <Label id="lbl-tgl-pembayaran" required>Tanggal Pembayaran</Label>
  <DateTimeInput 
    id="tgl-pembayaran" 
    value={formData.tanggal || ''} 
    onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))} 
    required
  />
</div>
```

## Kesimpulan
Mematuhi aturan ini memastikan bahwa UX saat pengguna menekan pemilih (picker) kalender dan waktu akan merespons sempurna, dan inisialisasi _default value_ pada layar Edit atau form baru akan terdeteksi di UI.
