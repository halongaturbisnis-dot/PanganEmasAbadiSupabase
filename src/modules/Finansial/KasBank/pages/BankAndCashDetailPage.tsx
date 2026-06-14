import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailShell } from '../../../../ui/components/common/shells/DetailShell';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { IBankAndCash, TBankAndCashType } from '../../../../logic/types/ITs_BankAndCash';
import { toast } from 'react-hot-toast';
import { Badge } from '../../../../ui/components/elements/Badge';
import { Label } from '../../../../ui/components/elements/Label';
import { AuditTrail } from '../../../../ui/components/elements/AuditTrail';
import { cn } from '../../../../logic/utils/cn';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { Banknote, Building2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../ui/components/common/Table';
import { formatCurrency } from '../../../../logic/utils/data';
import { formatDateTimeWithPipe } from '../../../../logic/utils/date';
import { Card } from '../../../../ui/components/common/Card';
import { Pagination } from '../../../../ui/components/common/Pagination';
import { SearchInput } from '../../../../ui/components/elements/Inputs';
import { getPageFetchLimit } from '../../../../logic/services/fetchingCenter';

interface IJournalItem {
  id: string;
  transaction_date: string;
  transaction_source: 'Pemasukan' | 'Pengeluaran';
  type: string;
  description: string;
  amount: number;
  debit: number;
  kredit: number;
  balance: number;
  created_at: string;
}

const formatTypeLabel = (typeStr: any) => {
  if (!typeStr) return '-';
  if (typeof typeStr === 'string' && typeStr.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(typeStr);
      return parsed.name || parsed.nama_akun || typeStr;
    } catch {
      return typeStr;
    }
  }
  if (typeof typeStr === 'object') {
    return typeStr.name || typeStr.nama_akun || JSON.stringify(typeStr);
  }
  return typeStr;
};

/**
 * BANK AND CASH DETAIL PAGE
 * Halaman detail untuk melihat informasi Kas & Bank secara lengkap.
 */
export const BankAndCashDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<IBankAndCash | null>(null);
  const [journal, setJournal] = useState<IJournalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = getPageFetchLimit('JurnalTransaksi');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    const [detail, journalData] = await Promise.all([
      bankAndCashService.getById(id),
      bankAndCashService.getJournalByBankCashId(id)
    ]);

    if (detail) {
      setData(detail);
      setJournal(journalData);
    } else {
      toast.error('Data tidak ditemukan');
      navigate('/finansial/kas-bank');
    }
    setIsLoading(false);
  };

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredJournal = journal.filter(row => {
    const typeLabel = formatTypeLabel(row.type);
    return typeLabel.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredJournal.length / itemsPerPage);
  const paginatedJournal = filteredJournal.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async () => {
    if (!id) return;

    swalConfig.fire({
      title: 'Hapus Akun Kas/Bank?',
      text: 'Data yang dihapus tidak dapat dikembalikan! Semua data berkaitan dengan data yg dihapus tersebut berpotensi akan ikut terhapus.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await bankAndCashService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
          navigate('/finansial/kas-bank');
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus data' });
        }
      }
    });
  };

  if (isLoading) return <div className="p-SpacingHuge text-center">Memuat data...</div>;
  if (!data) return null;

  const ValueBox: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(
      "w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-ColorSidebarBorder/OpacityMuted bg-ColorBgSecondary/OpacityMuted min-h-[2.5rem] flex items-center text-FontSizeSm font-medium text-TextColorBase",
      className
    )}>
      {children}
    </div>
  );

  return (
    <DetailShell
      id={data.id}
      title={data.nama_akun}
      onBack={() => navigate('/finansial/kas-bank')}
      onEdit={data.tipe === TBankAndCashType.KAS ? undefined : () => navigate(`/finansial/kas-bank/edit/${data.id}`)}
      onDelete={data.tipe === TBankAndCashType.KAS || data.is_deletable === 0 ? undefined : handleDelete}
    >
      <div className="flex flex-col gap-SpacingLarge w-full max-w-6xl mx-auto py-SpacingLarge">
        {/* MIMIC CARD DESIGN FROM LIST PAGE BUT WITHOUT ACTIONS */}
        <div className="w-full bg-White rounded-RadiusLarge shadow-ElevationHigh overflow-hidden border-none flex flex-col min-h-[16rem]">
          {/* Decorative Gradient Header */}
          <div className={cn(
            "h-24 w-full relative overflow-hidden",
            data.tipe === TBankAndCashType.KAS 
              ? "bg-linear-to-r from-orange-400 to-amber-300" 
              : "bg-linear-to-r from-teal-500 to-cyan-400"
          )}>
            {/* Subtle Wave SVG */}
            <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="#ffffff" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,144C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>

            {/* BALANCE DISPLAY IN CORNER */}
            <div className="absolute top-SpacingMedium right-SpacingLarge text-right">
              <div className="text-White/70 text-FontSizeNano uppercase font-black tracking-widest mb-1">
                Saldo Terakhir
              </div>
              <div className="text-White text-FontSizeH2 font-black tracking-tight">
                {formatCurrency(journal[0]?.balance || 0)}
              </div>
            </div>
          </div>

          <div className="px-SpacingLarge pb-SpacingMedium flex-1 flex flex-col relative pt-0">
            {/* Floating Icon Container */}
            <div className="absolute -top-10 left-SpacingLarge">
              <div className="w-20 h-20 bg-White rounded-2xl shadow-ElevationNormal flex items-center justify-center border border-ColorBgSecondary/10">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  data.tipe === TBankAndCashType.KAS ? "bg-orange-50 text-orange-500" : "bg-teal-50 text-teal-600"
                )}>
                  {data.tipe === TBankAndCashType.KAS ? <Banknote size={32} strokeWidth={1.5} /> : <Building2 size={32} strokeWidth={1.5} />}
                </div>
              </div>
            </div>

            {/* Main Content Areas */}
            <div className="mt-12 flex flex-col flex-1 space-y-SpacingMedium">
              <div>
                <h3 className="font-extrabold text-FontSizeH3 text-TextColorBase leading-tight tracking-tight uppercase">
                  {data.nama_akun}
                </h3>
                <div className={cn(
                  "text-FontSizeSm font-black uppercase tracking-[0.25em] mt-1 opacity-60",
                  data.tipe === TBankAndCashType.KAS ? "text-orange-600" : "text-teal-700"
                )}>
                  {data.tipe}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-SpacingMedium pt-SpacingSmall border-t border-ColorSidebarBorder/10">
                {data.tipe === TBankAndCashType.BANK ? (
                  <>
                    <div className="space-y-SpacingTiny">
                      <Label id="detail-bank-name-label">Bank</Label>
                      <div className="text-FontSizeBase font-bold text-TextColorBase">{data.nama_bank}</div>
                    </div>
                    <div className="space-y-SpacingTiny">
                      <Label id="detail-acc-num-label">Nomor Rekening</Label>
                      <div className="text-FontSizeBase font-mono font-medium text-TextColorBase tracking-wider">{data.nomor_rekening}</div>
                    </div>
                    <div className="space-y-SpacingTiny">
                      <Label id="detail-owner-label">Pemilik Rekening</Label>
                      <div className="text-FontSizeBase font-bold text-TextColorBase">{data.nama_pemilik}</div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-full py-SpacingTiny">
                    <div className="flex items-center gap-SpacingSmall">
                      <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                      <span className="text-FontSizeSm font-bold text-orange-600 uppercase tracking-widest italic font-sans">
                        Internal Kas Tunai
                      </span>
                    </div>
                    <p className="mt-SpacingTiny text-FontSizeSm text-TextColorMuted leading-relaxed">
                      Akun kas ini digunakan untuk pencatatan transaksi operasional harian yang menggunakan mata uang tunai di lokasi fisik.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Trail repositioned but kept inside content flow */}
            <div className="mt-auto pt-SpacingBase">
              <AuditTrail 
                createdAt={data.created_at}
                createdBy={data.created_by}
                createdTimezone={data.created_timezone}
                updatedAt={data.updated_at}
                updatedBy={data.updated_by}
                updatedTimezone={data.updated_timezone}
              />
            </div>
          </div>
        </div>

        {/* JOURNAL TABLE */}
        <Card className="p-SpacingBase">
          <div className="mb-SpacingMedium flex flex-col md:flex-row md:items-end justify-between gap-SpacingMedium">
            <div className="flex flex-col">
              <h4 className="text-FontSizeBase font-black uppercase tracking-widest text-TextColorBase">
                Jurnal Transaksi
              </h4>
              <p className="text-FontSizeNano text-TextColorMuted">
                Daftar seluruh riwayat pemasukan dan pengeluaran pada akun ini.
              </p>
            </div>
            <div className="w-full md:w-80">
              <SearchInput 
                id="journal-search"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onSearch={setSearchTerm}
                className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table id="journal-table">
              <TableHeader>
                <TableRow isHeader>
                  <TableHead className="text-center">Waktu</TableHead>
                  <TableHead className="text-center">Debit (-)</TableHead>
                  <TableHead className="text-center">Kredit (+)</TableHead>
                  <TableHead className="text-center">Saldo</TableHead>
                  <TableHead className="text-center">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJournal.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-TextColorBase text-FontSizeXs">
                          {formatDateTimeWithPipe(row.transaction_date).split(',')[0]}
                        </span>
                        <span className="text-FontSizeNano text-TextColorMuted uppercase tracking-tighter">
                          {formatDateTimeWithPipe(row.transaction_date).split(',')[1]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-mono font-bold text-FontSizeXs", row.debit > 0 ? "text-FeedbackColorError" : "text-TextColorMuted/40")}>
                        {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-mono font-bold text-FontSizeXs", row.kredit > 0 ? "text-FeedbackColorSuccess" : "text-TextColorMuted/40")}>
                        {row.kredit > 0 ? formatCurrency(row.kredit) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono font-black text-TextColorBase text-FontSizeXs">
                        {formatCurrency(row.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-SpacingTiny">
                        <div className="flex justify-center w-full">
                          <Badge id={`badge-${row.id}`} variant={row.transaction_source === 'Pemasukan' ? 'success' : 'error'} className="text-FontSizeXs px-SpacingSmall py-0 scale-90">
                            {formatTypeLabel(row.type)}
                          </Badge>
                        </div>
                        <span className="text-FontSizeXs text-TextColorMuted leading-tight italic max-w-[200px] truncate">
                          {row.description || '-'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedJournal.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-SpacingHuge text-TextColorMuted italic text-FontSizeXs">
                      {searchTerm ? 'Tidak ada hasil untuk pencarian ini' : 'Belum ada data transaksi'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-SpacingMedium pt-SpacingSmall border-t border-ColorSidebarBorder/10">
            <Pagination 
              id="journal-pagination"
              currentPage={currentPage}
              totalPages={Math.max(1, totalPages)}
              totalItems={filteredJournal.length}
              perPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </Card>
      </div>
    </DetailShell>

  );
};

export default BankAndCashDetailPage;
