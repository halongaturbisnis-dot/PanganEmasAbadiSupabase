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
import { akunService } from '../../../logic/services/akunService';
import { IAkun, TPeran } from '../../../logic/types/ITs_Akun';
import { toast } from 'react-hot-toast';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { cn } from '../../../logic/utils/cn';

/**
 * TEST PAGE AKUN
 * Halaman sederhana untuk melakukan simulasi CRUD pada modul Akun.
 */
export const TestPage_Akun: React.FC = () => {
  const [accounts, setAccounts] = useState<IAkun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ kode: '', pass: '' });

  // Load data on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    const data = await akunService.getAll();
    setAccounts(data);
    setIsLoading(false);
  };

  const handleCreateDummy = async () => {
    const dummy: Omit<IAkun, 'id' | 'created_at' | 'updated_at'> = {
      kode_akses: `user_${Math.floor(Math.random() * 1000)}`,
      password: 'password123',
      username: `Dummy User ${Math.floor(Math.random() * 1000)}`,
      jabatan: 'Staff Tester',
      peran: TPeran.USER,
      akses_modul: ['Pemrosesan', 'Marketing'],
      has_invoice_approval: false,
      is_active: true,
      created_by: 'system_test',
      created_timezone: 'Asia/Jakarta'
    };

    const result = await akunService.create(dummy);
    if (result) {
      toast.success('Berhasil membuat akun dummy');
      fetchAccounts();
    } else {
      toast.error('Gagal membuat akun dummy');
    }
  };

  const handleUpdateAccount = async (id: string) => {
    const result = await akunService.update(id, {
      username: `Updated User ${Math.floor(Math.random() * 100)}`
    });
    if (result) {
      toast.success('Berhasil update username');
      fetchAccounts();
    } else {
      toast.error('Gagal update data');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Hapus akun ini?')) return;
    const success = await akunService.delete(id);
    if (success) {
      toast.success('Berhasil menghapus akun');
      fetchAccounts();
    } else {
      toast.error('Gagal menghapus akun');
    }
  };

  const handleTestLogin = async () => {
    if (!loginData.kode || !loginData.pass) {
        toast.error('Isi kode akses dan password');
        return;
    }
    const result = await akunService.authenticate(loginData.kode, loginData.pass);
    if (result.success && result.session) {
      toast.success(`Login Berhasil! Halo ${result.session.username}`);
    } else {
      toast.error(result.error || 'Login Gagal. Cek console untuk detail error.');
    }
  };

  return (
    <MainShell title="Test Page Akun" subtitle="Simulasi Backend Logic Modul Akun">
      <div className="flex flex-col gap-SpacingBase">
        
        {/* SECTION 1: CREATE DUMMY */}
        <Card>
          <CardHeader>
            <CardTitle>1. Create Function</CardTitle>
            <CardDescription>Menambahkan data dummy ke database Turso.</CardDescription>
          </CardHeader>
          <CardContent>
            <PrimaryButton onClick={handleCreateDummy} isLoading={isLoading}>
              Generate & Insert Dummy Account
            </PrimaryButton>
          </CardContent>
        </Card>

        {/* SECTION 2: READ & LIST */}
        <Card>
          <CardHeader>
            <CardTitle>2. Read Function</CardTitle>
            <CardDescription>Menampilkan daftar akun yang tersimpan.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <SecondaryButton onClick={fetchAccounts} className="mb-SpacingBase">Refresh Data</SecondaryButton>
            
            <table className="w-full text-FontSizeSm text-left">
              <thead className="bg-ColorBgSecondary">
                <tr>
                  <th className="p-SpacingTiny">Username</th>
                  <th className="p-SpacingTiny">Kode Akses</th>
                  <th className="p-SpacingTiny">Peran</th>
                  <th className="p-SpacingTiny">Status</th>
                  <th className="p-SpacingTiny">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-ColorSidebarBorder/OpacitySubtle">
                    <td className="p-SpacingTiny font-medium">{acc.username}</td>
                    <td className="p-SpacingTiny">{acc.kode_akses}</td>
                    <td className="p-SpacingTiny">{acc.peran}</td>
                    <td className="p-SpacingTiny">
                      <span className={cn(acc.is_active ? "text-FeedbackColorSuccess" : "text-FeedbackColorError")}>
                        {acc.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="p-SpacingTiny flex gap-SpacingTiny">
                      <GhostButton size="sm" onClick={() => handleUpdateAccount(acc.id)}>Edit</GhostButton>
                      <DangerButton size="sm" onClick={() => handleDeleteAccount(acc.id)}>Delete</DangerButton>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-SpacingBase text-center text-TextColorMuted">Tidak ada data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* SECTION 3: AUTH TEST */}
        <Card>
          <CardHeader>
            <CardTitle>3. Authentication Test</CardTitle>
            <CardDescription>Simulasi login menggunakan kredensial yang ada.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-SpacingBase max-w-md">
            <div className="space-y-SpacingTiny">
                <label className="text-FontSizeXs font-semibold uppercase opacity-60">Kode Akses</label>
                <input 
                    type="text" 
                    className="w-full h-spacing-SpacingHuge px-SpacingBase rounded-RadiusSmall border border-ColorSidebarBorder bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-ColorPrimary transition-all"
                    placeholder="Masukkan kode akses..."
                    value={loginData.kode}
                    onChange={(e) => setLoginData({...loginData, kode: e.target.value})}
                />
            </div>
            <div className="space-y-SpacingTiny">
                <label className="text-FontSizeXs font-semibold uppercase opacity-60">Password</label>
                <input 
                    type="password" 
                    className="w-full h-spacing-SpacingHuge px-SpacingBase rounded-RadiusSmall border border-ColorSidebarBorder bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-ColorPrimary transition-all"
                    placeholder="Masukkan password..."
                    value={loginData.pass}
                    onChange={(e) => setLoginData({...loginData, pass: e.target.value})}
                />
            </div>
            <PrimaryButton onClick={handleTestLogin}>Simulasi Login</PrimaryButton>
          </CardContent>
        </Card>

      </div>
    </MainShell>
  );
};

export default TestPage_Akun;
