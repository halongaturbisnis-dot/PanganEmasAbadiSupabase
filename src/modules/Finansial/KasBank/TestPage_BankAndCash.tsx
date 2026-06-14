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
import { bankAndCashService } from '../../../logic/services/bankAndCashService';
import { IBankAndCash, TBankAndCashType } from '../../../logic/types/ITs_BankAndCash';
import { toast } from 'react-hot-toast';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { cn } from '../../../logic/utils/cn';

/**
 * TEST PAGE BANK & CASH
 * Halaman sederhana untuk melakukan simulasi CRUD pada modul Kas & Bank.
 */
export const TestPage_BankAndCash: React.FC = () => {
  const [data, setData] = useState<IBankAndCash[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const result = await bankAndCashService.getAll();
    setData(result);
    setIsLoading(false);
  };

  const handleCreateDummy = async () => {
    const dummy: Omit<IBankAndCash, 'id' | 'created_at' | 'updated_at' | 'is_deletable'> = {
      nama_akun: `Bank BCA_${Math.floor(Math.random() * 1000)}`,
      tipe: TBankAndCashType.BANK,
      nama_bank: 'BCA',
      nomor_rekening: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      nama_pemilik: 'PT Dummy Sejahtera',
      is_default: 0
    };

    const result = await bankAndCashService.create(dummy);
    if (result) {
      toast.success('Berhasil membuat data bank dummy');
      fetchData();
    } else {
      toast.error('Gagal membuat data dummy. (Catatan: Tipe Kas tidak boleh ditambah)');
    }
  };

  const handleUpdate = async (id: string) => {
    const result = await bankAndCashService.update(id, {
      nama_akun: `Updated Bank ${Math.floor(Math.random() * 100)}`
    });
    if (result) {
      toast.success('Berhasil update nama akun');
      fetchData();
    } else {
      toast.error('Gagal update data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data ini?')) return;
    const success = await bankAndCashService.delete(id);
    if (success) {
      toast.success('Berhasil menghapus data');
      fetchData();
    } else {
      toast.error('Gagal menghapus. Data "Cash" atau data default terproteksi sistem.');
    }
  };

  return (
    <MainShell title="Test Page Kas & Bank" subtitle="Simulasi Backend Logic Modul Kas & Bank">
      <div className="flex flex-col gap-SpacingBase">
        
        {/* SECTION 1: CREATE DUMMY */}
        <Card>
          <CardHeader>
            <CardTitle>1. Create Function</CardTitle>
            <CardDescription>Menambahkan data dummy Bank ke database. (Tipe Kas diproteksi)</CardDescription>
          </CardHeader>
          <CardContent>
            <PrimaryButton onClick={handleCreateDummy} isLoading={isLoading}>
              Generate & Insert Dummy Bank
            </PrimaryButton>
          </CardContent>
        </Card>

        {/* SECTION 2: READ & LIST */}
        <Card>
          <CardHeader>
            <CardTitle>2. Read Function</CardTitle>
            <CardDescription>Menampilkan daftar Kas & Bank yang tersimpan.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <SecondaryButton onClick={fetchData} className="mb-SpacingBase">Refresh Data</SecondaryButton>
            
            <table className="w-full text-FontSizeSm text-left">
              <thead className="bg-ColorBgSecondary">
                <tr>
                  <th className="p-SpacingTiny">Nama Akun</th>
                  <th className="p-SpacingTiny">Tipe</th>
                  <th className="p-SpacingTiny">Bank / No. Rek</th>
                  <th className="p-SpacingTiny">Status</th>
                  <th className="p-SpacingTiny">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-ColorSidebarBorder/OpacitySubtle">
                    <td className="p-SpacingTiny font-medium">{item.nama_akun}</td>
                    <td className="p-SpacingTiny">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-FontSizeNano font-bold uppercase",
                        item.tipe === TBankAndCashType.KAS ? "bg-ColorSecondary/20 text-ColorSecondary" : "bg-ColorPrimary/20 text-ColorPrimary"
                      )}>
                        {item.tipe}
                      </span>
                    </td>
                    <td className="p-SpacingTiny text-FontSizeXs">
                      {item.tipe === TBankAndCashType.BANK ? (
                        <>
                          <div className="font-semibold">{item.nama_bank}</div>
                          <div className="opacity-60">{item.nomor_rekening} - {item.nama_pemilik}</div>
                        </>
                      ) : (
                        <span className="italic opacity-40">-</span>
                      )}
                    </td>
                    <td className="p-SpacingTiny">
                      {item.is_default === 1 && (
                        <span className="text-FontSizeNano bg-FeedbackColorSuccess/20 text-FeedbackColorSuccess px-2 py-0.5 rounded-full font-bold">DEFAULT</span>
                      )}
                      {item.is_deletable === 0 && (
                        <span className="ml-1 text-FontSizeNano bg-ColorBgSecondary text-TextColorMuted px-2 py-0.5 rounded-full font-bold border border-ColorSidebarBorder/OpacitySubtle uppercase">Protected</span>
                      )}
                    </td>
                    <td className="p-SpacingTiny flex gap-SpacingTiny">
                      <GhostButton size="sm" onClick={() => handleUpdate(item.id)}>Edit</GhostButton>
                      <DangerButton 
                        size="sm" 
                        onClick={() => handleDelete(item.id)}
                        disabled={item.is_deletable === 0}
                      >
                        Delete
                      </DangerButton>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-SpacingBase text-center text-TextColorMuted">Tidak ada data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </MainShell>
  );
};

export default TestPage_BankAndCash;
