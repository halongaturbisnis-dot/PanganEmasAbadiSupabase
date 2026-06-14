# Panduan Integrasi Tigris Storage (S3 Compatible) di Google AI Studio

Dokumen ini menjelaskan langkah-langkah untuk mengintegrasikan Tigris Storage sebagai solusi penyimpanan file (Object Storage) yang kompatibel dengan protokol S3.

## 1. Persiapan di Dashboard Tigris

1. **Buat Bucket**: Buat bucket baru (contoh nama: `fakhri`).
2. **Pengaturan Akses (Access and Sharing)**:
   - Atur **Public / Private Access** menjadi **Private** (Ketentuan terbaru Tigris seringkali mewajibkan Private Bucket).
   - Pastikan **Disable Directory Listing** aktif (ON) untuk keamanan folder.
3. **Dapatkan Access Keys**:
   - Di tab **Access Keys**, buat key baru.
   - Salin dan simpan nilai berikut:
     - `Access Key ID`
     - `Secret Access Key`
     - `Endpoint URL S3` (Biasanya `https://t3.storage.dev`)

## 2. Konfigurasi Environment Variables di Google AI Studio

Buka menu **Settings** di Google AI Studio dan masukkan variabel berikut:

| Nama Variabel | Contoh Nilai | Keterangan |
| :--- | :--- | :--- |
| `TIGRIS_STORAGE_ACCESS_KEY_ID` | `tid_...` | ID Kunci Akses dari Tigris |
| `TIGRIS_STORAGE_SECRET_ACCESS_KEY` | `tsec_...` | Kunci Rahasia dari Tigris |
| `TIGRIS_STORAGE_ENDPOINT` | `https://t3.storage.dev` | Endpoint S3 Tigris |
| `TIGRIS_STORAGE_BUCKET` | `fakhri` | Nama bucket yang Anda buat |

## 3. Implementasi Kode Backend (Express)

Gunakan `@aws-sdk/client-s3` untuk berinteraksi dengan Tigris.

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.TIGRIS_STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.TIGRIS_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // WAJIB untuk Tigris
});
```

### Logika Upload dan Mengatasi Private Bucket (Proxying via Backend)

Karena kebijakan bucket bersifat Private, URL akses publik (`.t3.tigrisfiles.io`) tidak dapat langsung digunakan, dan file tidak bisa ditampilkan di tag `<img>` pada website/domain tanpa otentikasi.
Oleh karena itu, solusinya adalah **menggunakan backend sebagai proxy**. URL file akan diarahkan ke endpoint API lokal, di mana backend mengambil object menggunakan identitas kredensial S3, lalu mem-pipe stream-nya langsung kepada client.

#### A. Endpoint GET File (Proxy Stream)
Buat route untuk membaca file dari Tigris:
```typescript
app.get("/api/images/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const bucketName = process.env.TIGRIS_STORAGE_BUCKET;

    const response = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    // Teruskan metadata
    if (response.ContentType) res.setHeader("Content-Type", response.ContentType);
    if (response.ContentLength) res.setHeader("Content-Length", response.ContentLength);
    
    // Tambahkan header caching (opsional namun sangat disarankan agar loading image cepat)
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (response.Body) {
      // Pipe stream langsung ke res
      (response.Body as Readable).pipe(res);
    } else {
      res.status(404).send("File tidak ditemukan");
    }
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      res.status(404).send("File tidak ditemukan");
    } else {
      console.error("Error fetching image:", error);
      res.status(500).send("Gagal mengambil gambar");
    }
  }
});
```

#### B. Logika Upload
Ubah hasil response *imageUrl* saat upload agar mengembalikan URL proxy backend (contoh: `/api/images/...`).
```typescript
await s3Client.send(new PutObjectCommand({
  Bucket: process.env.TIGRIS_STORAGE_BUCKET,
  Key: filename,
  Body: fileBuffer,
  ContentType: "image/jpeg"
}));

// Karena bucket Private, pakai URL proxy internal/backend yang kita buat di atas
const imageUrl = `/api/images/${filename}`; 
```

## 4. Troubleshooting
- **Bucket Harus Private**: Sesuai kebijakan terbaru Tigris, jika menggunakan bucket Private, Anda tidak bisa lagi langsung merujuk public URL `.t3.tigrisfiles.io`. Proxy file streaming seperti di atas adalah solusi yang tepat dan aman.
- **Image Lama Tidak Muncul**: Pastikan database menyimpan path lokal (seperti `/api/images/...`) dan bukan domain asli tigris. Evaluasi URL yang tersimpan.
- **Tipe Data Stream**: Jangan lupa casting `response.Body as Readable` di namespace server Node.js jika menggunakan TypeScript.