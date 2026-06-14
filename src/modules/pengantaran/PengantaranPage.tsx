import React, { useState, useEffect } from 'react';
import { MainShell } from '../../ui/components/common/shells/MainShell';
import { Tabs } from '../../ui/components/common/Tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../ui/components/common/Table';
import { Pagination } from '../../ui/components/common/Pagination';
import { Badge } from '../../ui/components/elements/Badge';
import { SearchInput } from '../../ui/components/elements/Inputs';
import { Skeleton } from '../../ui/components/elements/Skeleton';
import { useGlobalState } from '../../logic/context/GlobalContext';
import { cn } from '../../logic/utils/cn';
import { penyerahanService } from '../../logic/services/penyerahanService';
import { akunService } from '../../logic/services/akunService';
import { getPageFetchLimit } from '../../logic/services/fetchingCenter';
import { formatDateTimeWithPipe as formatDateTime } from '../../logic/utils/date';
import { TPenyerahanStatus, TPenyerahanType, IPenyerahanPayload } from '../../logic/types/ITs_Penyerahan';
import { PackageCheck } from 'lucide-react';
import { PenyerahanHandoverModal } from '../penjualan/penyerahan/components/PenyerahanHandoverModal';

export const PengantaranPage: React.FC = () => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const [activeTab, setActiveTab] = useState<string>('pengantaran');
  const [searchValue, setSearchValue] = useState<string>('');
  
  // Data State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const limit = getPageFetchLimit('DaftarPenyerahan');

  // Modal State
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<IPenyerahanPayload | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const session = akunService.getCurrentSession();
      const currentUserId = session?.user_id;

      const res = await penyerahanService.getPaginated(page, searchValue, { 
        limit,
        status: activeTab === 'pengantaran' ? TPenyerahanStatus.ON_DELIVERY : TPenyerahanStatus.COMPLETED, 
        penyerahan_type: activeTab === 'pengantaran' ? TPenyerahanType.FRANCO : undefined,
        driver_user_id: currentUserId || undefined
      });
      setData(res.items);
      setTotalItems(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchValue, activeTab, page]);

  const handleHandoverClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Biar row click nggak ter-trigger kalau mau dibuat double
    const fullData = await penyerahanService.getById(id);
    if(fullData) {
        setSelectedData(fullData);
        setIsHandoverOpen(true);
    }
  };

  const TABS = [
    { id: 'pengantaran', label: 'Dalam Pengantaran' },
    { id: 'selesai', label: 'Selesai' },
  ];

  const renderData = () => {
    return (
      <div className="w-full space-y-4">
        <Table id={`table-pengantaran`} noBorder={true}>
          <TableHeader>
            <TableRow noBorder={true} isHeader={true}>
              {activeTab === 'pengantaran' ? (
                <>
                  <TableHead>Waktu Pengiriman</TableHead>
                  <TableHead>No Surat Jalan</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Waktu Penyerahan</TableHead>
                  <TableHead>No Surat Jalan</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: limit }).map((_, idx) => (
                <TableRow key={`skeleton-pengantaran-${idx}`} noBorder={true}>
                  <TableCell noBorder={true}><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell noBorder={true}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <TableRow 
                  key={row.id} 
                  noBorder={true}
                  className={cn("group hover:bg-Slate50 transition-colors", activeTab === 'pengantaran' && "cursor-pointer")}
                  onClick={activeTab === 'pengantaran' ? (e) => handleHandoverClick(row.id, e) : undefined}
                >
                  {activeTab === 'pengantaran' ? (
                    <>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-ColorPrimary">
                          {formatDateTime(row.datetime)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-Slate900">
                          {row.surat_jalan_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-Slate900">
                          {row.invoice_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-medium text-ColorPrimary">
                          {row.customer_name || '-'}
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-ColorPrimary">
                          {formatDateTime(row.handover_datetime || row.datetime)}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-Slate900">
                          {row.surat_jalan_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-bold text-Slate900">
                          {row.invoice_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell noBorder={true}>
                        <div className="text-FontSizeXs font-medium text-ColorPrimary">
                          {row.customer_name || '-'}
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow noBorder={true}>
                <TableCell colSpan={4} noBorder={true} className="h-48 text-TextColorMuted italic">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          id={`pagination-pengantaran`}
          currentPage={page}
          totalPages={Math.ceil(totalItems / limit)}
          totalItems={totalItems}
          perPage={limit}
          onPageChange={setPage}
          className="mt-4"
        />
      </div>
    );
  };

  return (
    <MainShell
      title="Daftar Pengantaran Saya"
      id="pengantaran-page"
      hideDownload
    >
      <div className="flex flex-col gap-4">
        <Tabs 
          tabs={TABS} 
          activeTab={activeTab} 
          onChange={(tab) => {
            setActiveTab(tab as string);
            setPage(1);
          }} 
          variant="underline" 
        />

        <div className={cn("flex items-center gap-2", isMobile && "flex-col items-stretch")}>
          <div className={cn(isMobile ? "w-full" : "w-1/3")}>
            <SearchInput 
              id="pengantaran-search-input"
              value={searchValue}
              onSearch={(val) => setSearchValue(val)}
              placeholder="Cari surat jalan, invoice, atau customer..."
              className="bg-ColorBg !rounded-RadiusMedium !border-ColorPrimary/25 hover:!border-ColorPrimary focus:!border-ColorPrimary focus-visible:!border-ColorPrimary focus:!ring-0 focus-visible:!ring-0 transition-all shadow-sm"
            />
          </div>
        </div>
        
        {renderData()}
      </div>

      {isHandoverOpen && selectedData && (
        <PenyerahanHandoverModal
          isOpen={isHandoverOpen}
          onClose={() => {
            setIsHandoverOpen(false);
            setSelectedData(null);
          }}
          data={selectedData}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </MainShell>
  );
};
