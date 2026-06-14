import { config } from '../utils/config.js';
import { finansialReportService } from './finansialReportService.js';

export interface AIAnalysisRequest {
  startDate: string;
  endDate: string;
  mode?: 'standard' | 'deep';
  question?: string;
}

export const aiService = {
  /**
   * Mengambil data laporan keuangan dan merumuskannya dalam format prompt teks yang ringkas namun utuh.
   */
  async generateFinancialReportPrompt(startDate: string, endDate: string): Promise<string> {
    const report = await finansialReportService.getFinansialReport(startDate, endDate);
    if (!report) {
      throw new Error('Data laporan finansial tidak ditemukan atau gagal diambil.');
    }

    const { kpiSummary, labaRugi, ekuitas, expenseBreakdown, incomeBreakdown, agingData, availableBanks } = report;

    // Sederhanakan transaksi mutasi agar menghemat token namun tetap informatif
    const sampleMutations = (report.mutasiData || [])
      .slice(0, 15) // ambil 15 mutasi teratas/terakhir untuk konteks operasional harian
      .map(m => `- Tanggal: ${m.transaction_date}, Jenis: ${m.jenis}, Bank: ${m.bank_name}, Nominal: Rp ${m.nominal.toLocaleString('id-ID')}, Kategori: ${m.type}, Deskripsi: ${m.description || 'Tidak ada'}`)
      .join('\n');

    // Buat representasi data teks yang padat dan terstruktur
    const promptData = `
INFORMASI UTAMA LAPORAN KEUANGAN
Periode Laporan: ${startDate} s/d ${endDate}

1. RINGKASAN REKENING & KAS (KPI)
- Total Saldo Akhir Kas & Bank: Rp ${kpiSummary.totalSaldoAkhir.toLocaleString('id-ID')}
- Aliran Kas Bersih (Net Cash Flow): Rp ${kpiSummary.netCashFlow.toLocaleString('id-ID')}
- Total Piutang Belum Lunas (AR): Rp ${kpiSummary.totalPiutang.toLocaleString('id-ID')}
- Total Hutang Belum Dibayar (AP): Rp ${kpiSummary.totalHutang.toLocaleString('id-ID')}
- Daftar Akun Bank/Metode Pembayaran yang Aktif: ${availableBanks.join(', ') || 'Belum ada'}

2. DETAIL LABA RUGI (PROFITABILITY)
- Pendapatan Penjualan: Rp ${labaRugi.pendapatanPenjualan.toLocaleString('id-ID')}
- Pendapatan dari Piutang: Rp ${labaRugi.pendapatanPiutang.toLocaleString('id-ID')}
- Total Pendapatan Lain-Lain: Rp ${labaRugi.totalPendapatanLainLain.toLocaleString('id-ID')}
- Total Pendapatan Operasional: Rp ${labaRugi.totalPendapatanOperasional.toLocaleString('id-ID')}
- Pengeluaran Pembelian: Rp ${labaRugi.pengeluaranPembelian.toLocaleString('id-ID')}
- Pengeluaran Pelunasan Hutang: Rp ${labaRugi.pengeluaranHutang.toLocaleString('id-ID')}
- Total Pengeluaran Lain-Lain: Rp ${labaRugi.totalPengeluaranLainLain.toLocaleString('id-ID')}
- Total Pengeluaran Operasional: Rp ${labaRugi.totalPengeluaranOperasional.toLocaleString('id-ID')}
- Margin Profit Operasional: Rp ${labaRugi.marginProfitOperasional.toLocaleString('id-ID')}

3. STRUKTUR ASET & EKUITAS
- Valuasi Stok (Aset): Rp ${ekuitas.asetValuasiStok.toLocaleString('id-ID')}
- Aset Piutang: Rp ${ekuitas.asetPiutang.toLocaleString('id-ID')}
- Total Aset: Rp ${ekuitas.totalAset.toLocaleString('id-ID')}
- Total Kewajiban (Hutang aktif): Rp ${ekuitas.totalKewajiban.toLocaleString('id-ID')}
- Total Ekuitas Bersih: Rp ${ekuitas.totalEkuitas.toLocaleString('id-ID')}

4. DISTRIBUSI KATEGORI TRANSAKSI
Pemasukan (Top Kategori):
${incomeBreakdown.map(i => `- ${i.label}: Rp ${i.nominal.toLocaleString('id-ID')}`).join('\n') || '- Tidak ada transaksi pemasukan'}

Pengeluaran (Top Kategori):
${expenseBreakdown.map(e => `- ${e.label}: Rp ${e.nominal.toLocaleString('id-ID')}`).join('\n') || '- Tidak ada transaksi pengeluaran'}

5. ANALISIS AGING PIUTANG DAN HUTANG
${agingData.map(a => `- Rentang ${a.label} -> Piutang: Rp ${a.piutang.toLocaleString('id-ID')}, Hutang: Rp ${a.hutang.toLocaleString('id-ID')}`).join('\n')}

6. LOG MUTASI TRANSAKSI TERBARU (15 Sampel Teratas):
${sampleMutations || '- Tidak ada histori transaksi mutasi pada rentang waktu ini'}
    `;

    return promptData;
  },

  /**
   * Mengirim payload prompt terstruktur beserta instruksi analisis asisten bisnis ke Groq API.
   * Menghasilkan ReadableStream yang memancarkan token teks yang diterima dari Groq.
   */
  async streamAnalysis(promptData: string, mode: 'standard' | 'deep' = 'standard', question?: string, history?: { role: 'user' | 'assistant', content: string }[]): Promise<ReadableStream<Uint8Array>> {
    const groqKey = config.groqApiKey;
    if (!groqKey) {
      throw new Error('Kunci API Groq (GROQ_API_KEY) tidak dikonfigurasi pada server ini.');
    }

    let systemInstruction = `Anda adalah seorang konsultan finansial dan penasihat keuangan bisnis profesional (Chartered Financial Analyst / CFO Virtual) dengan spesialisasi pengembangan bisnis mikro, kecil, dan menengah (UMKM) di Indonesia.

Tugas Anda adalah menganalisis data keuangan yang diberikan oleh sistem dan memberikan ringkasan analisis, insight bernilai tinggi, serta rekomendasi strategis yang aplikatif dalam bahasa Indonesia yang ringkas, objektif, dan profesional.`;

    if (mode === 'deep') {
      systemInstruction += `\n\nLakukan analisis "DEEP DIVE" (Analisis Mendalam & Komprehensif):
1. **Analisis Rasio Likuiditas & Kesehatan Arus Kas**: Evaluasi rasio kas, kecukupan perputaran modal kerja, dan stabilitas finansial.
2. **Korelasi & Pola Pengeluaran**: Hubungkan pengeluaran terbesar dengan pendapatan, cari inefisiensi atau kebocoran anggaran tersembunyi.
3. **Analisis Risiko Finansial / Manajemen Piutang**: Analisis potensi piutang macet berdasarkan aging data atau risiko kegagalan bayar utang.
4. **Program Aksi Strategis / Rencana Operasional Jangka Panjang**: Berikan 3 program prioritas tinggi lengkap dengan estimasi dampak dan langkah-langkah implementasi taktisnya secara mendetail.`;
    } else {
      systemInstruction += `\n\nStruktur analisis standar Anda WAJIB mengikuti format berikut:
1. **Ringkasan Kesehatan Keuangan** (Maksimal 3-4 kalimat objektif mengenai kondisi arus kas dan profitabilitas saat ini).
2. **Sorotan Positif (Apresiasi)** (Poin-poin mengenai apa yang berjalan dengan baik).
3. **Peringatan Krisis/Warning** (Poin-poin kritis seperti rasio utang tinggi, tren pengeluaran membengkak, penurunan margin profit, atau aging piutang yang berisiko tak tertagih).
4. **Rekomendasi Strategis (Action Plan)** (Rencana aksi nyata yang logis, dapat langsung diterapkan oleh pemilik usaha, dan menyangkut langkah taktis optimalisasi modal atau pemotongan biaya).`;
    }

    systemInstruction += `\n\nAturan Gaya Penulisan:
- Gunakan bahasa Indonesia yang santun, lugas, profesional, dan bebas jargon yang terlalu rumit.
- Fokus 100% pada nilai tambah operasional bisnis nyata, bukan teori akademis.
- JANGAN tampilkan data telemetri sistem, id, status online, port, atau atribut developer lainnya.
- Gunakan Markdown yang rapi untuk pemformatan (gunakan bold, italic, list bullet).`;

    const messages = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Data Laporan Keuangan:\n${promptData}` },
        ...(history ? history.map(h => ({ role: h.role, content: h.content })) : []),
        ...(question ? [{ role: 'user', content: question }] : [])
    ];

    const callGroq = async (modelName: string) => {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName,
                messages,
                temperature: question ? 0.4 : (mode === 'deep' ? 0.2 : 0.3),
                max_tokens: 2500,
                stream: true,
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw { status: response.status, message: errText };
        }
        return response;
    };

    try {
        const response = await callGroq('llama-3.3-70b-versatile');
        if (!response.body) throw new Error('Response body dari Groq API kosong.');
        return response.body as ReadableStream<Uint8Array>;
    } catch (err: any) {
        if (err.status === 429) {
            try {
                const response = await callGroq('llama-3.1-8b-instant');
                if (!response.body) throw new Error('Response body dari Groq API kosong.');
                return response.body as ReadableStream<Uint8Array>;
            } catch (err2: any) {
                // If the second model also hits rate limit, throw specialized error
                if (err2.status === 429) {
                    throw new Error('LIMIT_EXCEEDED');
                }
                throw err2;
            }
        }
        throw err;
    }
  }
};
