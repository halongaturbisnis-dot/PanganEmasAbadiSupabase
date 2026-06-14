import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../../ui/components/common/Card';
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  GhostButton 
} from '../../ui/components/elements/Button';
import { customerService } from '../../logic/services/customerService';
import { ICustomer } from '../../logic/types/ITs_Customer';
import { toast } from 'react-hot-toast';
import { MainShell } from '../../ui/components/common/shells/MainShell';

/**
 * TEST PAGE CUSTOMER
 * Halaman sederhana untuk melakukan simulasi CRUD pada modul Customer.
 */
export const TestPage_Customer: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    const data = await customerService.getAll();
    setCustomers(data);
    setIsLoading(false);
  };

  const handleCreateDummy = async () => {
    const dummy: Omit<ICustomer, 'id' | 'created_at' | 'updated_at'> = {
      name: `Customer ${Math.floor(Math.random() * 1000)}`,
      company: `PT Dummy Indonesia ${Math.floor(Math.random() * 100)}`,
      telepon: `0812${Math.floor(Math.random() * 100000000)}`,
      email: `dummy_${Math.floor(Math.random() * 1000)}@example.com`,
      latlong: `-6.2088,106.8456`, // Jakarta
      alamat: 'Jl. Testing No. 123, Jakarta Selatan',
      bidang_usaha: 'Teknologi Informasi'
    };

    const result = await customerService.create(dummy);
    if (result) {
      toast.success('Berhasil membuat customer dummy');
      fetchCustomers();
    } else {
      toast.error('Gagal membuat customer dummy');
    }
  };

  const handleUpdateCustomer = async (id: string) => {
    const result = await customerService.update(id, {
      name: `Updated Name ${Math.floor(Math.random() * 100)}`,
      bidang_usaha: 'Retail & Logistik'
    });
    if (result) {
      toast.success('Berhasil update customer');
      fetchCustomers();
    } else {
      toast.error('Gagal update data');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Hapus data customer ini?')) return;
    const success = await customerService.delete(id);
    if (success) {
      toast.success('Berhasil menghapus customer');
      fetchCustomers();
    } else {
      toast.error('Gagal menghapus customer');
    }
  };

  return (
    <MainShell title="Test Page Customer" subtitle="Simulasi Backend Logic Modul Customer">
      <div className="flex flex-col gap-SpacingBase">
        
        {/* SECTION 1: CREATE DUMMY */}
        <Card>
          <CardHeader>
            <CardTitle>1. Create Function</CardTitle>
            <CardDescription>Menambahkan data customer dummy ke database Turso.</CardDescription>
          </CardHeader>
          <CardContent>
            <PrimaryButton onClick={handleCreateDummy} isLoading={isLoading}>
              Generate & Insert Dummy Customer
            </PrimaryButton>
          </CardContent>
        </Card>

        {/* SECTION 2: READ & LIST */}
        <Card>
          <CardHeader>
            <CardTitle>2. Read Function</CardTitle>
            <CardDescription>Menampilkan daftar customer yang tersimpan (Global Read).</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <SecondaryButton onClick={fetchCustomers} className="mb-SpacingBase">Refresh Data</SecondaryButton>
            
            <table className="w-full text-FontSizeSm text-left border-collapse">
              <thead className="bg-ColorBgSecondary">
                <tr className="border-b border-ColorSidebarBorder">
                  <th className="p-SpacingTiny">Nama</th>
                  <th className="p-SpacingTiny">Perusahaan</th>
                  <th className="p-SpacingTiny">Telepon</th>
                  <th className="p-SpacingTiny">Lokasi</th>
                  <th className="p-SpacingTiny">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr key={cust.id} className="border-b border-ColorSidebarBorder/OpacitySubtle">
                    <td className="p-SpacingTiny font-medium">{cust.name}</td>
                    <td className="p-SpacingTiny">{cust.company || '-'}</td>
                    <td className="p-SpacingTiny">{cust.telepon}</td>
                    <td className="p-SpacingTiny text-FontSizeXs truncate max-w-[150px]">{cust.alamat}</td>
                    <td className="p-SpacingTiny flex gap-SpacingTiny">
                      <GhostButton size="sm" onClick={() => handleUpdateCustomer(cust.id)}>Edit</GhostButton>
                      <DangerButton size="sm" onClick={() => handleDeleteCustomer(cust.id)}>Delete</DangerButton>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-SpacingBase text-center text-TextColorMuted">Tidak ada data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* SECTION 3: DETAIL TEST */}
        <Card>
          <CardHeader>
            <CardTitle>3. Detail Check</CardTitle>
            <CardDescription>Memastikan data yang ditarik per ID konsisten.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-FontSizeSm text-TextColorMuted">
              Fungsi ini dipanggil otomatis saat tombol Edit ditekan untuk mengambil data terbaru sebelum update.
              Total data saat ini: <span className="font-bold text-ColorPrimary">{customers.length}</span>
            </p>
          </CardContent>
        </Card>

      </div>
    </MainShell>
  );
};

export default TestPage_Customer;
