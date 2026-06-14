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
import { suplierService } from '../../../logic/services/suplierService';
import { ISuplier } from '../../../logic/types/ITs_Suplier';
import { toast } from 'react-hot-toast';
import { MainShell } from '../../../ui/components/common/shells/MainShell';

/**
 * TEST PAGE SUPLIER
 * Halaman sederhana untuk melakukan simulasi CRUD pada modul Suplier.
 */
export const TestPage_Suplier: React.FC = () => {
  const [suppliers, setSuppliers] = useState<ISuplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    const data = await suplierService.getAll();
    setSuppliers(data);
    setIsLoading(false);
  };

  const handleCreateDummy = async () => {
    setIsLoading(true);
    const dummy: Omit<ISuplier, 'id' | 'created_at' | 'updated_at'> = {
      name: `Suplier Dummy ${Math.floor(Math.random() * 1000)}`,
      telepon: `08123456${Math.floor(Math.random() * 1000)}`,
      email: `contact${Math.floor(Math.random() * 1000)}@dummy.com`,
      latlong: `-6.200000,106.816666`, // Jakarta coordinates
      alamat: `Jl. Dummy No. ${Math.floor(Math.random() * 100)}, Kota Dummy`
    };

    const result = await suplierService.create(dummy);
    if (result) {
      toast.success('Berhasil membuat suplier dummy');
      fetchSuppliers();
    } else {
      toast.error('Gagal membuat suplier dummy');
    }
    setIsLoading(false);
  };

  const handleUpdateSupplier = async (id: string) => {
    setIsLoading(true);
    const result = await suplierService.update(id, {
      name: `Updated Suplier ${Math.floor(Math.random() * 100)}`,
      telepon: `08998877${Math.floor(Math.random() * 100)}`
    });
    if (result) {
      toast.success('Berhasil update data suplier');
      fetchSuppliers();
    } else {
      toast.error('Gagal update data');
    }
    setIsLoading(false);
  };

  const handleDeleteSupplier = async (id: string) => {
    setIsLoading(true);
    const success = await suplierService.delete(id);
    if (success) {
      toast.success('Berhasil menghapus suplier');
      fetchSuppliers();
    } else {
      toast.error('Gagal menghapus suplier');
    }
    setIsLoading(false);
  };

  return (
    <MainShell title="Test Page Suplier" subtitle="Simulasi Backend Logic Modul Suplier">
      <div className="flex flex-col gap-SpacingBase">
        
        {/* SECTION 1: CREATE DUMMY */}
        <Card>
          <CardHeader>
            <CardTitle>1. Create Function</CardTitle>
            <CardDescription>Menambahkan data suplier dummy ke database.</CardDescription>
          </CardHeader>
          <CardContent>
            <PrimaryButton onClick={handleCreateDummy} isLoading={isLoading}>
              Generate & Insert Dummy Suplier
            </PrimaryButton>
          </CardContent>
        </Card>

        {/* SECTION 2: READ & LIST */}
        <Card>
          <CardHeader>
            <CardTitle>2. Read Function</CardTitle>
            <CardDescription>Menampilkan daftar suplier yang tersimpan.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <SecondaryButton onClick={fetchSuppliers} className="mb-SpacingBase" isLoading={isLoading}>
              Refresh Data
            </SecondaryButton>
            
            <table className="w-full text-FontSizeSm text-left">
              <thead className="bg-ColorBgSecondary">
                <tr>
                  <th className="p-SpacingTiny">Nama Suplier</th>
                  <th className="p-SpacingTiny">Telepon</th>
                  <th className="p-SpacingTiny">Email</th>
                  <th className="p-SpacingTiny">Alamat</th>
                  <th className="p-SpacingTiny">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-ColorSidebarBorder/OpacitySubtle">
                    <td className="p-SpacingTiny font-medium">{s.name}</td>
                    <td className="p-SpacingTiny">{s.telepon}</td>
                    <td className="p-SpacingTiny">{s.email || '-'}</td>
                    <td className="p-SpacingTiny">{s.alamat}</td>
                    <td className="p-SpacingTiny flex gap-SpacingTiny">
                      <GhostButton size="sm" onClick={() => handleUpdateSupplier(s.id)}>Edit</GhostButton>
                      <DangerButton size="sm" onClick={() => handleDeleteSupplier(s.id)}>Delete</DangerButton>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
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

export default TestPage_Suplier;
