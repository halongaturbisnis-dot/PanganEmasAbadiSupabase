import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Database, Cloud, CheckCircle, AlertCircle, RefreshCw, Upload, Trash2, FileText, Globe } from 'lucide-react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../ui/components/common/Card';
import { Button, PrimaryButton, DangerButton } from '../../../ui/components/elements/Button';
import { tursoRequest } from '../../../logic/api/turso';
import { storageService } from '../../../logic/services/storage';
import { toast } from '../../../logic/utils/swalConfig';
import { Badge } from '../../../ui/components/elements/Badge';
import { Divider } from '../../../ui/components/elements/Divider';

/**
 * MODULE: Connection Test Page
 * Purpose: Verifies connectivity to Turso (DB) and Tigris (Storage)
 */
export const ConnectionTestPage: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [storageStatus, setStorageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dbData, setDbData] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; key: string } | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // 1. Test Turso DB Fetch
  const testDbFetch = async () => {
    setDbStatus('loading');
    setDbError(null);
    try {
      // Attempt to select from test table
      const result = await tursoRequest("SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 5");
      setDbData(result.rows || []);
      setDbStatus('success');
      toast.fire({ icon: 'success', title: 'Turso DB Connected!' });
    } catch (err: any) {
      console.error(err);
      setDbStatus('error');
      setDbError(err.message || 'Unknown error occurred while connecting to Turso');
      toast.fire({ icon: 'error', title: 'Turso DB Connection Failed' });
    }
  };

  // 2. Test Turso DB Write
  const testDbWrite = async () => {
    try {
      const timestamp = new Date().toISOString();
      await tursoRequest("INSERT INTO test_connection (test_name, test_value) VALUES (?, ?)", 
        ['Manual Log', `Test performed at ${timestamp}`]
      );
      toast.fire({ icon: 'success', title: 'Data inserted successfully' });
      testDbFetch(); // Refresh list
    } catch (err: any) {
      toast.fire({ icon: 'error', title: 'Write Failed', text: err.message });
    }
  };

  // 3. Test Tigris Storage Upload
  const testStorageUpload = async () => {
    setStorageStatus('loading');
    setStorageError(null);
    try {
      // Create a dummy text file
      const content = `Test upload from Vibe Boilerplate at ${new Date().toISOString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], `test-connection-${Date.now()}.txt`, { type: 'text/plain' });

      // Upload via storageService
      const result = await storageService.upload(file, 'tests');
      setUploadedFile(result);
      setStorageStatus('success');
      toast.fire({ icon: 'success', title: 'Tigris Storage Uploaded!' });
    } catch (err: any) {
      console.error(err);
      setStorageStatus('error');
      setStorageError(err.message || 'Unknown error occurred while uploading to Tigris');
      toast.fire({ icon: 'error', title: 'Tigris Upload Failed' });
    }
  };

  // 4. Test Tigris Storage Delete
  const testStorageDelete = async () => {
    if (!uploadedFile) return;
    try {
      await storageService.delete(uploadedFile.key);
      setUploadedFile(null);
      toast.fire({ icon: 'success', title: 'File deleted from storage' });
    } catch (err: any) {
      toast.fire({ icon: 'error', title: 'Delete Failed', text: err.message });
    }
  };

  useEffect(() => {
    // Initial fetch to check connectivity quickly
    testDbFetch();
  }, []);

  return (
    <MainShell id="connection-test-shell">
      <div className="max-w-[1200px] mx-auto space-y-8 p-4 md:p-8">
        <header>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Globe className="text-sky-500" />
            Integrasi Koneksi Database & Storage
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Halaman ini digunakan untuk memverifikasi kesiapan infrastruktur backend (Turso & Tigris).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DATABASE CARD */}
          <Card id="turso-card" className="border-t-4 border-t-sky-500 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database size="1.25rem" /> 
                    Turso SQLite (LibSQL)
                  </CardTitle>
                  <CardDescription>Pengecekan Query & Manipulasi Baris</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   {dbStatus === 'loading' && <Badge variant="info" className="animate-pulse">Checking...</Badge>}
                   {dbStatus === 'success' && <Badge variant="success">Connected</Badge>}
                   {dbStatus === 'error' && <Badge variant="error" className="cursor-pointer" onClick={() => toast.fire({ title: 'Error Detail', text: dbError || '' })}>Failed</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={testDbFetch} disabled={dbStatus === 'loading'}>
                  <RefreshCw size="0.875rem" className={`mr-2 ${dbStatus === 'loading' ? 'animate-spin' : ''}`} />
                  Refresh List
                </Button>
                <PrimaryButton size="sm" onClick={testDbWrite} disabled={dbStatus === 'loading'}>
                  Tambah Log Manual
                </PrimaryButton>
              </div>

              <Divider />

              <div className="bg-[var(--color-bg-secondary)] rounded-lg p-1 border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-tertiary)]/5 text-[var(--color-text-muted)] font-bold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Nama</th>
                      <th className="px-4 py-2 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {dbData.length > 0 ? (
                      dbData.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                          <td className="px-4 py-3 font-medium">{row.test_name}</td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)] truncate max-w-[200px]">{row.test_value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-[var(--color-text-muted)] italic">
                          {dbStatus === 'loading' ? 'Fetching data...' : 'No record found. Ensure database/testconnection.sql is executed.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {dbError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-medium flex items-start gap-2">
                  <AlertCircle size="1rem" className="shrink-0" />
                  <p>{dbError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STORAGE CARD */}
          <Card id="tigris-card" className="border-t-4 border-t-orange-500 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud size="1.25rem" /> 
                    Tigris Object Storage (S3)
                  </CardTitle>
                  <CardDescription>Pengecekan Upload & Public URL</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   {storageStatus === 'loading' && <Badge variant="info" className="animate-pulse">Uploading...</Badge>}
                   {storageStatus === 'success' && <Badge variant="success">Active</Badge>}
                   {storageStatus === 'error' && <Badge variant="error">Failed</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <PrimaryButton size="sm" onClick={testStorageUpload} disabled={storageStatus === 'loading'}>
                  <Upload size="0.875rem" className="mr-2" />
                  Simulasi Upload File (.txt)
                </PrimaryButton>
              </div>

              <Divider />

              {uploadedFile ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                      <FileText size="1.25rem" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-emerald-900 truncate">Test Upload Success!</p>
                      <p className="text-xs text-emerald-700 font-mono truncate">{uploadedFile.key}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(uploadedFile.url, '_blank')}
                      className="bg-white"
                    >
                      Buka URL Publik
                    </Button>
                    <DangerButton 
                      size="sm" 
                      onClick={testStorageDelete}
                    >
                      <Trash2 size="0.875rem" className="mr-2" />
                      Hapus File
                    </DangerButton>
                  </div>
                </div>
              ) : (
                <div className="p-10 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50">
                  <Cloud size="3rem" strokeWidth={1} className="mb-2" />
                  <p className="text-sm">Belum ada file yang diunggah untuk pengujian.</p>
                </div>
              )}

              {storageError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-medium flex items-start gap-2">
                  <AlertCircle size="1rem" className="shrink-0" />
                  <p>{storageError}</p>
                </div>
              )}

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h5 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-1">
                  <AlertCircle size="0.875rem" /> Note:
                </h5>
                <ul className="text-xs text-amber-700 space-y-1 ml-5 list-disc">
                  <li>Tigris memerlukan <b>VITE_TIGRIS_STORAGE_ENDPOINT</b> yang benar.</li>
                  <li>Pastikan bucket policy diset ke <b>Public Read</b> jika ingin akses link langsung.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Divider />

        <footer className="text-center pb-8">
           <p className="text-[var(--color-text-muted)] text-sm mb-4">
             Sistem menggunakan <b>Lazy Initialization</b>. SDK hanya dipanggil saat tombol di atas ditekan.
           </p>
           <Button variant="outline" onClick={() => window.history.back()}>Kembali ke Menu Utama</Button>
        </footer>
      </div>
    </MainShell>
  );
};

export default ConnectionTestPage;
