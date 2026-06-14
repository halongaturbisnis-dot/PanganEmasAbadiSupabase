import React from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { DataTablePlus } from '../../../ui/components/common/DataTablePlus';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { Badge } from '../../../ui/components/elements/Badge';
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCheckbox, TableCaption } from '../../../ui/components/common/Table';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { formatCurrency } from '../../../logic/utils/data';

interface SampleData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  lastLogin: string;
}

export const DataTablePlusSample: React.FC = () => {
  const { t } = useGlobalState();

  const data: SampleData[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', role: 'Administrator', lastLogin: '2024-03-20' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', role: 'Editor', lastLogin: '2024-03-18' },
    { id: '3', name: 'Robert Brown', email: 'robert@example.com', status: 'active', role: 'User', lastLogin: '2024-03-15' },
    { id: '4', name: 'Emily Davis', email: 'emily@example.com', status: 'active', role: 'User', lastLogin: '2024-03-10' },
    { id: '5', name: 'Michael Wilson', email: 'michael@example.com', status: 'inactive', role: 'Guest', lastLogin: '2024-03-05' },
  ];

  const columns = [
    { key: 'name', label: t('sample.name') },
    { key: 'email', label: t('sample.email') },
    { 
      key: 'status', 
      label: t('sample.status'),
      render: (row: SampleData) => (
        <Badge variant={row.status === 'active' ? 'success' : 'error'}>
          {t(`status.${row.status}`).toUpperCase()}
        </Badge>
      )
    },
    { key: 'role', label: t('sample.role') },
    { key: 'lastLogin', label: t('sample.lastLogin') },
  ];

  const [selected, setSelected] = React.useState<SampleData[]>([]);
  const [rawTableRows, setRawTableRows] = React.useState<Set<number>>(new Set());

  const handleExport = (filteredData: SampleData[]) => {
    console.log('Exporting data:', filteredData);
    alert(`${t('dataTable.export')} ${filteredData.length} records. Check console.`);
  };

  const toggleRawTableRow = (idx: number) => {
    const newSet = new Set(rawTableRows);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setRawTableRows(newSet);
  };

  const rawData = [
    { invoice: 'INV-001', status: 'active', method: 'Credit Card', amount: 250000 },
    { invoice: 'INV-002', status: 'inactive', method: 'Bank Transfer', amount: 450000 },
    { invoice: 'INV-003', status: 'pending', method: 'PayPal', amount: 150000 },
  ];

  const totalAmount = rawData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <MainShell title={t('tableSample.title')}>
      <div className="space-y-12">
        {/* Section 1: Data Table Plus (Feature Rich) */}
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[var(--font-size-h3)] font-bold text-[var(--color-text-base)]">
              {t('sample.dataTable')}
            </h2>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              {t('tableSample.description')}
            </p>
          </div>

          {selected.length > 0 && (
            <div className="p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4">
              <p className="text-[var(--font-size-sm)] font-bold text-[var(--color-primary)]">
                {t('sample.rowsSelected', { count: selected.length })}
              </p>
              <div className="flex gap-2">
                <Badge variant="success" className="cursor-pointer" onClick={() => alert(t('sample.action1'))}>{t('sample.action1')}</Badge>
                <Badge variant="error" className="cursor-pointer" onClick={() => alert(t('sample.action2'))}>{t('sample.action2')}</Badge>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              <DataTablePlus 
                data={data}
                columns={columns}
                onSelectionChange={setSelected}
                hideBorder={true}
                hideSearch={true}
              />
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Raw Table Primitive (Showcasing all primitives) */}
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[var(--font-size-h3)] font-bold text-[var(--color-text-base)]">
              {t('tableSample.rawTitle')}
            </h2>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              {t('sample.directImplementation')}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>{t('tableSample.summary')}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>{t('tableSample.invoice')}</TableHead>
                    <TableHead>{t('tableSample.status')}</TableHead>
                    <TableHead>{t('tableSample.method')}</TableHead>
                    <TableHead className="text-right">{t('tableSample.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawData.map((row, idx) => (
                    <TableRow key={idx} data-state={rawTableRows.has(idx) ? 'selected' : undefined}>
                      <TableCell>
                        <TableCheckbox 
                          checked={rawTableRows.has(idx)}
                          onChange={() => toggleRawTableRow(idx)}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-bold text-[var(--color-primary)]">
                        {row.invoice}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'active' ? 'success' : row.status === 'inactive' ? 'error' : 'warning'}>
                          {t(`status.${row.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.method}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-left font-bold uppercase tracking-wider text-[var(--font-size-xs)]">
                      {t('tableSample.total')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[var(--color-primary)] font-mono text-base">
                      {formatCurrency(totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Feature List */}
        <div className="p-6 bg-[var(--color-tertiary)]/5 border border-[var(--color-tertiary)]/10 rounded-2xl">
          <h4 className="text-[var(--font-size-xs)] font-bold uppercase text-[var(--color-text-muted)] mb-4 tracking-widest">
            {t('sample.verificationTitle')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <span className="text-[var(--font-size-sm)] font-bold">{t('sample.verification.structural')}</span>
              <ul className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] space-y-1">
                <li>• {t('sample.verification.p1')}</li>
                <li>• {t('sample.verification.p2')}</li>
                <li>• {t('sample.verification.p3')}</li>
                <li>• {t('sample.verification.p4')}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="text-[var(--font-size-sm)] font-bold">{t('sample.verification.interactive')}</span>
              <ul className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] space-y-1">
                <li>• {t('sample.verification.i1')}</li>
                <li>• {t('sample.verification.i2')}</li>
                <li>• {t('sample.verification.i3')}</li>
                <li>• {t('sample.verification.i4')}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="text-[var(--font-size-sm)] font-bold">{t('sample.verification.data')}</span>
              <ul className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] space-y-1">
                <li>• {t('sample.verification.d1')}</li>
                <li>• {t('sample.verification.d2')}</li>
                <li>• {t('sample.verification.d3')}</li>
                <li>• {t('sample.verification.d4')}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="text-[var(--font-size-sm)] font-bold">{t('sample.verification.responsive')}</span>
              <ul className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] space-y-1">
                <li>• {t('sample.verification.r1')}</li>
                <li>• {t('sample.verification.r2')}</li>
                <li>• {t('sample.verification.r3')}</li>
                <li>• {t('sample.verification.r4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainShell>
  );
};
