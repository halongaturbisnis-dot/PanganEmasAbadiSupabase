# Guideline: Integrasi Fitur AI Laporan (Groq Llama-3.3-70b-versatile)

Dokumen ini mendefinisikan standar arsitektur dan panduan penerapan fitur AI Analisis Finansial & Laporan di aplikasi untuk memastikan kinerja tinggi, keamanan data, dan kepatuhan terhadap batas execution time Vercel Serverless (maksimal 10 detik untuk plan hobi / 15-30 detik untuk pro).

---

## 1. Desain Arsitektur & Alur Data

Untuk menghindari limitasi 10 detik dari Vercel Serverless dan kendala CORS, fitur AI ini ditenagai oleh **Groq API ('llama-3.3-70b-versatile')** dengan metode **Server-Side API Proxy + SSE (Server-Sent Events) atau Streaming**.

```
[UI / Laporan LaporanFinansialPage]
        │
        │ (1) Request Analisis dengan Parameter tanggal & tipe filter
        ▼
[Express Server Endpoint: /api/ai/analyze-report]
        │
        │ (2) Query database Turso secara dinamis sesuai kebutuhan filter
        ▼
[Proses Data di Backend (Tanpa Kehilangan Konteks)]
        │
        │ (3) Kirim Prompt terstruktur + JSON Data Ringkas ke Groq API
        ▼
[Groq API (Model Llama-3.3-70b-versatile)]
        │
        │ (4) Streaming response token demi token kembali ke Express
        ▼
[UI / Laporan LaporanFinansialPage (Text Streaming Effect)]
```

---

## 2. Struktur Modul & Penempatan Berkas

Sesuai dengan standar **Modular Monolith** dan **AGENTS.md**, penempatan kode diatur sebagai berikut:

- **`/src/logic/types/ITs_AI.ts`**: Tipe data TypeScript untuk status, chat, payload request, dan response stream.
- **`/src/logic/services/aiService.ts`**: Layanan backend terisolasi untuk membangun prompt dinamis, membersihkan payload agar pas dengan token limit, dan menghubungi Groq API.
- **`/src/ui/components/common/AIInsightWidget.tsx`**: Komponen UI Reusable berbentuk widget / panel asisten yang elegan, menggunakan **Tokens** dari `src/ui/styles/tokens.ts` dan mendukung stream rendering.
- **`/server.ts`**: Registrasi route endpoint `/api/ai/analyze-report` yang aman (menggunakan API Key dari sisi server via `process.env.GROQ_API_KEY`).

---

## 3. Strategi Pengiriman Data (Bebas Duplikasi & Hemat Token)

Untuk memastikan data yang dianalisis oleh AI tetap kaya akan konten dan konteks tanpa menyebabkan timeout 10 detik, diterapkan teknik **Filter & Smart-Framing**:

1. **Filtering Selektif**: Backend mengambil data laporan finansial berdasarkan rentang waktu terpilih (misalnya 30 hari terakhir).
2. **Dynamic Contextualization**: Mengonversi tabel-tabel data mentah menjadi bentuk teks / markdown yang sangat padat namun utuh, sebelum dibungkus ke dalam *Prompt Template* sistem.
3. **No Raw Payload Bloat**: Tanggal yang tidak memiliki aktivitas transaksi (nol) akan diabaikan dari payload prompt untuk menghemat kuota token (Context Window) dan mempercepat pemrosesan.

---

## 4. Invarian Keamanan dan Variabel Lingkungan

- **GROQ_API_KEY**: Kunci API Groq wajib disimpan di `.env` (di-load via `.env.example`).
- **DILARANG KERAS** mengekspos kunci API atau memanggil Groq langsung dari browser (Frontend). Semua pemanggilan WAJIB diproxy oleh `/api/ai/...` di backend Express.
- Gunakan `config` instans di `src/logic/utils/config.ts` untuk memverifikasi ketersediaan kunci secara aman.

---

## 5. Antarmuka Pengguna & UX (Widget Interaktif)

- **UX Streaming**: Jawaban AI ditampilkan secara bertahap (streaming/text typewriter effect) menggunakan Server-Sent Events agar pengguna tidak merasa aplikasi "gantung".
- **Visual Design**: Menggunakan Card elegan dan token warna dari `tokens.ts`. Menghindari visual slop (seperti log telemetri sistem, koordinat port, dll), murni fokus memberikan saran bisnis profesional.
