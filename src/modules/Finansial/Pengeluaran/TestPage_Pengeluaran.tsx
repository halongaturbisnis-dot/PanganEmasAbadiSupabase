import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../../../ui/components/common/Card';
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  GhostButton 
} from '../../../ui/components/elements/Button';
import { pengeluaranService } from '../../../logic/services/pengeluaranService';
import { IPengeluaran, TPengeluaranStatus } from '../../../logic/types/ITs_Pengeluaran';
import { toast } from 'react-hot-toast';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { formatCurrency } from '../../../logic/utils/data';

/**
 * TEST PAGE PENGELUARAN
 * Halaman sederhana untuk melakukan simulasi CRUD pada modul Pengeluaran.
 */
export const TestPage_Pengeluaran: React.FC = () => {
  const [expenses, setExpenses] = useState<IPengeluaran[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Load data on mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    const result = await pengeluaranService.getPaginated(1, '', { limit: 10 });
    setExpenses(result.items);
    setTotal(result.total);
    setIsLoading(false);
  };

  const handleCreateDummy = async () => {
    // Generate dummy data
    const dummyPayload = {
      transaction_date: new Date().toISOString(),
      bank_and_cash_id: '1abc1f5c-b7a9-45f9-b157-dc6906b9e1cf', // ID valid dari database
      type: 'Biaya Operasional',
      description: `Pengeluaran Dummy #${Math.floor(Math.random() * 1000)}`,
      amount: Math.floor(Math.random() * 1000000),
      status: TPengeluaranStatus.CLEAR,
      proof_urls: [], // Array kosong untuk payload parse
      files: [] // No files for dummy create
    };

    const result = await pengeluaranService.create(dummyPayload as any);
    if (result) {
      toast.success('Berhasil membuat pengeluaran dummy');
      fetchExpenses();
    } else {
      toast.error('Gagal membuat pengeluaran dummy. Cek console.');
    }
  };

  const handleUpdateExpense = async (id: string) => {
    const result = await pengeluaranService.update(id, {
      description: `Updated Description @ ${new Date().toLocaleTimeString()}`,
      status: TPengeluaranStatus.UNCLEAR
    });
    if (result) {
      toast.success('Berhasil update data');
      fetchExpenses();
    } else {
      toast.error('Gagal update data');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Hapus data pengeluaran ini?')) return;
    const success = await pengeluaranService.delete(id);
    if (success) {
      toast.success('Berhasil menghapus data');
      fetchExpenses();
    } else {
      toast.error('Gagal menghapus data');
    }
  };

  return (
    <MainShell title="Test Page Pengeluaran" subtitle="Simulasi Backend Logic Modul Pengeluaran">
      <div className="flex flex-col gap-8">
        
        {/* SECTION 1: CREATE DUMMY */}
        <Card id="section-create">
          <CardHeader>
            <CardTitle>1. Create Function</CardTitle>
            <CardDescription>Menambahkan data pengeluaran dummy ke database.</CardDescription>
          </CardHeader>
          <CardContent>
            <PrimaryButton onClick={handleCreateDummy} isLoading={isLoading}>
              Generate & Insert Dummy Expense
            </PrimaryButton>
          </CardContent>
        </Card>

        {/* SECTION 2: READ & LIST */}
        <Card id="section-read">
          <CardHeader>
            <CardTitle>2. Read Function</CardTitle>
            <CardDescription>Menampilkan daftar pengeluaran ({total} total record).</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <SecondaryButton onClick={fetchExpenses} className="mb-4">Refresh Data</SecondaryButton>
            
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 border-b">Tanggal</th>
                  <th className="p-3 border-b">Tipe</th>
                  <th className="p-3 border-b">Deskripsi</th>
                  <th className="p-3 border-b">Nominal</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">{new Date(item.transaction_date).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{item.type}</td>
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(item.amount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        item.status === TPengeluaranStatus.CLEAR ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <GhostButton onClick={() => handleUpdateExpense(item.id)}>Edit</GhostButton>
                      <DangerButton onClick={() => handleDeleteExpense(item.id)}>Delete</DangerButton>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 italic">Belum ada data pengeluaran.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* SECTION 3: INFO */}
        <Card id="section-info">
          <CardHeader>
            <CardTitle>Info Koneksi</CardTitle>
            <CardDescription>Informasi tambahan terkait testing.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2 opacity-80">
            <p>• Data disimpan di tabel <strong>pengeluaran</strong> pada database Turso.</p>
            <p>• Relasi <strong>bank_and_cash_id</strong> menggunakan ID valid dari database untuk pengetesan.</p>
            <p>• Fungsi delete akan otomatis membersihkan file di Tigris Storage (Anti-Yatim Piatu).</p>
          </CardContent>
        </Card>

      </div>
    </MainShell>
  );
};

export default TestPage_Pengeluaran;
