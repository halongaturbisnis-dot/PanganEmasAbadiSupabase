import React, { useState } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { DataTablePlus } from '../../../ui/components/common/DataTablePlus';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { Badge } from '../../../ui/components/elements/Badge';
import { ThemeLanguageSwitcher } from '../../../ui/components/elements/ThemeLanguageSwitcher';

interface SampleData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  lastLogin: string;
}

export const DataTablePlusSimulation: React.FC = () => {
  const [selected, setSelected] = useState<SampleData[]>([]);

  const data: SampleData[] = [
    { id: 'usr_01', name: 'Budi Santoso', email: 'budi@example.com', status: 'active', role: 'Administrator', lastLogin: '2023-11-20' },
    { id: 'usr_02', name: 'Siti Aminah', email: 'siti@example.com', status: 'inactive', role: 'Editor', lastLogin: '2023-11-18' },
    { id: 'usr_03', name: 'Rudi Hermawan', email: 'rudi@example.com', status: 'active', role: 'User', lastLogin: '2023-11-15' },
    { id: 'usr_04', name: 'Agus Pratama', email: 'agus@example.com', status: 'active', role: 'User', lastLogin: '2023-11-10' },
    { id: 'usr_05', name: 'Dewi Lestari', email: 'dewi@example.com', status: 'inactive', role: 'Guest', lastLogin: '2023-11-05' },
    { id: 'usr_06', name: 'Tono Wibowo', email: 'tono@example.com', status: 'active', role: 'User', lastLogin: '2023-11-21' },
    { id: 'usr_07', name: 'Lina Marlina', email: 'lina@example.com', status: 'inactive', role: 'Guest', lastLogin: '2023-11-01' },
  ];

  const columns = [
    { key: 'name', label: 'Nama Lengkap' },
    { key: 'email', label: 'Surat Elektronik' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row: SampleData) => (
        <Badge variant={row.status === 'active' ? 'success' : 'error'}>
          {row.status === 'active' ? 'AKTIF' : 'NONAKTIF'}
        </Badge>
      )
    },
    { key: 'role', label: 'Peran' },
    { key: 'lastLogin', label: 'Masuk Terakhir' },
  ];

  const handleExport = (filteredData: SampleData[]) => {
    alert(`Mengekspor ${filteredData.length} baris data ke format CSV...`);
  };

  return (
    <MainShell 
      title="Showcase Data Table Plus"
      headerExtra={<ThemeLanguageSwitcher />}
    >
      <div className="max-w-6xl mx-auto space-y-SpacingLarge pb-SpacingHuge">
        <div className="text-center space-y-SpacingSmall">
          <h1 className="text-FontSizeH1 font-display font-bold text-TextColorBase">
            Showcase Data Table Plus
          </h1>
          <p className="text-TextColorMuted text-FontSizeBase max-w-2xl mx-auto">
            Mendemonstrasikan komponen Tabel Data kompleks yang dilengkapi dengan fitur pencarian, penyaringan, paginasi, pemilihan baris mandiri, dan integrasi elemen antarmuka tingkat lanjut.
          </p>
        </div>

        {selected.length > 0 && (
          <div className="p-SpacingBase bg-ColorPrimary/OpacitySubtle border border-ColorPrimary/OpacityMuted rounded-RadiusMedium flex flex-col sm:flex-row sm:items-center justify-between gap-SpacingSmall animate-in slide-in-from-top-4">
            <p className="text-FontSizeSm font-bold text-ColorPrimary">
              {selected.length} baris data dipilih
            </p>
            <div className="flex flex-wrap gap-SpacingSmall">
              <Badge variant="success" className="cursor-pointer" onClick={() => alert('Aksi Massal: Approve dijalankan')}>Aksi Massal: Approve</Badge>
              <Badge variant="error" className="cursor-pointer" onClick={() => alert('Aksi Massal: Delete dijalankan')}>Aksi Massal: Delete</Badge>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna Aktif</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTablePlus 
              data={data}
              columns={columns}
              onSelectionChange={setSelected}
              hideBorder={true}
              hideSearch={true}
            />
          </CardContent>
        </Card>
      </div>
    </MainShell>
  );
};
