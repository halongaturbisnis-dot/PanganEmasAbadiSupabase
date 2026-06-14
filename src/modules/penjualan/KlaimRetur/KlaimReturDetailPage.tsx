import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DetailShell } from '../../../ui/components/common/shells/DetailShell';
import { klaimReturService } from '../../../logic/services/klaimReturService';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { ITs_KlaimRetur } from '../../../logic/types/ITs_KlaimRetur';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../ui/components/common/Table';
import { Badge } from '../../../ui/components/elements/Badge';
import { formatDate } from '../../../logic/utils/date';
import { formatCurrency } from '../../../logic/utils/data';
import { Card } from '../../../ui/components/common/Card';
import { Image as ImageIcon } from 'lucide-react';
import { Divider } from '../../../ui/components/elements/Divider';
import { Modal } from '../../../ui/components/common/Modal';
import { AttachmentDisplay } from '../../../ui/components/elements/AttachmentDisplay';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';
import { Label } from '../../../ui/components/elements/Label';
import { ITs_KlaimReturItem } from '../../../logic/types/ITs_KlaimRetur';

export const KlaimReturDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setState } = useGlobalState();
  const referrer = searchParams.get('referrer');

  const [data, setData] = useState<ITs_KlaimRetur | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ITs_KlaimReturItem | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    const res = await klaimReturService.getById(id as string);
    setData(res);
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(referrer || '/penjualan/klaim-retur');
  };

  const handleDelete = () => {
    setState(prev => ({
      ...prev,
      confirmDialog: {
        title: 'Hapus Klaim Retur',
        message: 'Apakah Anda yakin ingin menghapus data klaim retur ini? Tindakan ini tidak dapat dibatalkan.',
        variant: 'danger',
        confirmLabel: 'Hapus',
        onConfirm: async () => {
          if (id) {
            const success = await klaimReturService.delete(id);
            if (success) {
              handleBack();
            }
          }
        }
      }
    }));
  };

  const badgeOverride = "!bg-ColorPrimary !text-White !border-none";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className={badgeOverride}>Menunggu Konfirmasi</Badge>;
      case 'Approved': return <Badge className={badgeOverride}>Disetujui</Badge>;
      case 'Rejected': return <Badge className={badgeOverride}>Ditolak</Badge>;
      case 'Completed': return <Badge className={badgeOverride}>Selesai</Badge>;
      default: return <Badge className={badgeOverride}>{status}</Badge>;
    }
  };

  return (
    <DetailShell
      title="Rincian Klaim Retur"
      isLoading={isLoading}
      onBack={handleBack}
      onEdit={() => navigate(`/penjualan/klaim-retur/edit/${id}${referrer ? `?referrer=${referrer}` : ''}`)}
      onDelete={handleDelete}
      id="klaim-retur-detail"
    >
      {data && (
        <div className="space-y-SpacingMedium">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-SpacingBase">
            <Card className="p-SpacingBase flex items-center !shadow-none !border-none bg-Slate50">
              <div>
                <p className="text-[0.75rem] font-bold text-Slate500 uppercase tracking-wider">Nomor Invoice</p>
                <p className="text-[1rem] font-black text-Slate800 font-mono">{data.invoice_number}</p>
              </div>
            </Card>

            <Card className="p-SpacingBase flex items-center !shadow-none !border-none bg-Slate50">
              <div>
                <p className="text-[0.75rem] font-bold text-Slate500 uppercase tracking-wider">Tanggal Pengajuan</p>
                <p className="text-[1rem] font-bold text-Slate800">{formatDate(data.datetime)}</p>
              </div>
            </Card>

            <Card className="p-SpacingBase flex items-center !shadow-none !border-none bg-Slate50">
              <div>
                <p className="text-[0.75rem] font-bold text-Slate500 uppercase tracking-wider">Status</p>
                <div className="mt-1">{getStatusBadge(data.status)}</div>
              </div>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden !shadow-none !border-none border-t border-Slate100 rounded-none">
            <div className="p-SpacingMedium flex justify-between items-center border-b border-Slate100">
               <div>
                 <h3 className="font-bold text-Slate800">Produk yang Diklaim</h3>
               </div>
               <div className="text-right">
                  <span className="text-FontSizeNano text-Slate500 font-bold uppercase tracking-widest block">Total Estimasi Refund</span>
                  <span className="text-FontSizeH4 font-black text-ColorPrimary">{formatCurrency(data.sum_total_refund_nominal)}</span>
               </div>
            </div>
            
            <Table id="item-list-table">
              <TableHeader>
                <TableRow isHeader>
                  <TableHead>Produk</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Kebijakan</TableHead>
                  <TableHead>Refund</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items?.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="cursor-pointer hover:bg-Slate50 transition-colors"
                    onClick={() => setSelectedItem(item)}
                  >
                    <TableCell>
                      <p className="font-bold text-Slate900">{item.name}</p>
                    </TableCell>
                    <TableCell>
                       <span className="font-bold text-Slate800">{item.qty}</span> <span className="text-FontSizeXs text-Slate500">{item.unit}</span>
                    </TableCell>
                    <TableCell className="max-w-[15rem]"><span className="text-FontSizeSm text-Slate700">{item.reason}</span></TableCell>
                    <TableCell>
                       <Badge className={badgeOverride}>{item.policy}</Badge>
                    </TableCell>
                    <TableCell>
                       <span className={item.policy === 'Refund' ? 'font-bold' : 'text-Slate400'}>
                         {item.refund_nominal > 0 ? formatCurrency(item.refund_nominal) : '-'}
                       </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-SpacingMedium !shadow-none !border-none border-t border-Slate100 rounded-none bg-Slate50/30">
             <div className="flex items-center gap-SpacingNano mb-SpacingTiny">
                <h4 className="font-bold text-Slate500 uppercase tracking-wider text-FontSizeNano">Keterangan</h4>
             </div>
             <p className="text-Slate700 p-SpacingBase rounded-RadiusBase border border-Slate100 bg-White italic min-h-[4rem]">
               {data.description || "Tidak ada deskripsi tambahan."}
             </p>
          </Card>

          <Divider className="opacity-OpacityMuted" />
          
          <div className="flex justify-end p-SpacingBase">
            <AuditTrail 
              createdAt={data.created_at}
              createdBy={data.created_by}
              createdTimezone={data.created_timezone}
              updatedAt={data.updated_at}
              updatedBy={data.updated_by}
              updatedTimezone={data.updated_timezone}
              id="main-audit-trail"
            />
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detail Klaim Produk"
        id="item-detail-modal"
      >
        {selectedItem && (
          <div className="space-y-SpacingMedium p-SpacingTiny">
            <div className="bg-Slate50 p-SpacingBase rounded-RadiusBase">
              <div className="flex items-center gap-SpacingTiny mb-SpacingNano">
                <p className="text-FontSizeNano font-bold text-Slate500 uppercase tracking-wider">Informasi Produk</p>
              </div>
              <p className="text-FontSizeH4 font-black text-Slate900">{selectedItem.name}</p>
              <div className="flex items-center gap-SpacingNano mt-SpacingNano">
                <Badge className={badgeOverride}>{selectedItem.unit}</Badge>
                <span className="text-FontSizeSm text-Slate500">Diretur sebanyak <span className="font-bold text-Slate900">{selectedItem.qty} {selectedItem.unit}</span></span>
              </div>
            </div>

            <div className="space-y-SpacingNano">
              <Label className="flex items-center gap-SpacingNano">
                Alasan Retur
              </Label>
              <div className="p-SpacingBase bg-Slate50 rounded-RadiusBase text-FontSizeSm text-Slate700 leading-relaxed italic">
                "{selectedItem.reason || 'Tidak ada alasan spesifik yang diberikan.'}"
              </div>
            </div>

            <div className="grid grid-cols-2 gap-SpacingBase">
              <div className="space-y-SpacingNano">
                <Label>Kebijakan</Label>
                <div>
                  <Badge className={badgeOverride}>
                    {selectedItem.policy === 'Refund' ? 'Refund Uang' : 'Ganti Barang'}
                  </Badge>
                </div>
              </div>
              {selectedItem.policy === 'Refund' && (
                <div className="space-y-SpacingNano">
                  <Label>Estimasi Refund</Label>
                  <p className="text-FontSizeH4 font-black text-ColorPrimary">{formatCurrency(selectedItem.refund_nominal)}</p>
                </div>
              )}
            </div>

            <div className="space-y-SpacingNano">
              <Label>Lampiran Bukti</Label>
              <AttachmentDisplay 
                files={selectedItem.proof_url ? selectedItem.proof_url.split(',').filter(Boolean).map((url, idx) => ({ url, name: `Bukti ${idx + 1}` })) : []}
                id="item-attachments"
                className="!grid-cols-2 lg:!grid-cols-3"
                emptyText="Tidak ada bukti terlampir"
              />
            </div>

            <Divider className="opacity-OpacityMuted" />

            <div className="space-y-SpacingSmall">
              <p className="text-FontSizeNano font-bold text-Slate400 uppercase tracking-widest">Audit Trail Produk</p>
              <AuditTrail 
                createdAt={selectedItem.created_at}
                createdBy={selectedItem.created_by || 'System'}
                createdTimezone={selectedItem.created_timezone}
                updatedAt={selectedItem.updated_at}
                updatedBy={selectedItem.updated_by}
                updatedTimezone={selectedItem.updated_timezone}
                id="item-audit-trail"
              />
            </div>
          </div>
        )}
      </Modal>
    </DetailShell>
  );
};

export default KlaimReturDetailPage;
