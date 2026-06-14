import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailShell } from '../../../ui/components/common/shells/DetailShell';
import { Card } from '../../../ui/components/common/Card';
import { Divider } from '../../../ui/components/elements/Divider';
import { Badge } from '../../../ui/components/elements/Badge';
import { AttachmentDisplay } from '../../../ui/components/elements/AttachmentDisplay';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';
import { Label } from '../../../ui/components/elements/Label';
import { penerimaanService } from '../../../logic/services/penerimaanService';
import { ITs_Penerimaan } from '../../../logic/types/ITs_Penerimaan';
import { ShoppingCart, Package, Info, AlertTriangle, CheckCircle, FileText, Calendar, Droplets } from 'lucide-react';
import { formatDateFull as formatDateTime, formatDate } from '../../../logic/utils/date';
import { dbClient } from '../../../logic/libs/database';
import { cn } from '../../../logic/utils/cn';

/**
 * PENERIMAAN DETAIL PAGE
 * Halaman tampilan data Penerimaan (Read Only).
 */
export const PenerimaanDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [data, setData] = useState<ITs_Penerimaan | null>(null);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditable, setIsEditable] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const item = await penerimaanService.getById(id);
        if (item) {
          setData(item);
          // Fetch product info with extended details
          const sql = `
            SELECT 
              pp.name as nama_produk, pp.category, pp.sub_category, pp.unit, pp.qty as kuantiti, 
              pp.price_per_unit as harga_satuan, pp.kadar_air as purchase_kadar_air, 
              p.po_number as kode_pembelian, s.name as nama_suplier,
              sh.vehicle_number, sh.driver_name
            FROM pembelian_produk pp
            JOIN pembelian p ON pp.purchase_id = p.id
            LEFT JOIN suplier s ON p.supplier_id = s.id
            JOIN pengiriman sh ON sh.id = ?
            WHERE pp.id = ?
          `;
          const res = await dbClient.query(sql, [item.shipping_id, item.purchase_product_id]);
          if (res.rows.length > 0) setProductInfo(res.rows[0]);

          // Check if data is editable based on business rules
          let editable = true;
          if (item.sorting_type === 'QC') {
            // Check if processing has started
            const procRes = await dbClient.query(`SELECT id FROM pemrosesan WHERE receiving_id = ? LIMIT 1`, [item.id]);
            if (procRes.rows.length > 0) editable = false;
          } else {
            // Check if stock has been entered
            const stockRes = await dbClient.query(`SELECT id FROM stok_masuk WHERE receiving_id = ? LIMIT 1`, [item.id]);
            if (stockRes.rows.length > 0) editable = false;
          }
          setIsEditable(editable);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (isLoading) return <div className="p-[2rem] text-center">Memuat data...</div>;
  if (!data) return <div className="p-[2rem] text-center text-red-500">Data tidak ditemukan</div>;

  // Check if moisture exceeds standard
  const isNotStandard = data.actual_moisture !== undefined && 
                        productInfo?.purchase_kadar_air !== undefined && 
                        data.actual_moisture > productInfo.purchase_kadar_air;

  const parseAttachments = (jsonStr?: string) => {
    if (!jsonStr) return [];
    try {
      const urls = JSON.parse(jsonStr);
      if (Array.isArray(urls)) {
        return urls.map(url => ({ url }));
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  return (
    <DetailShell
      title="Detail Penerimaan"
      id="penerimaan-detail-shell"
      onBack={() => navigate('/gudang/penerimaan')}
      onEdit={isEditable ? () => navigate(`/gudang/penerimaan/edit/${data.id}`) : undefined}
    >
      <div className="flex flex-col gap-[1.5rem]">
        {/* Visual Header matching Form */}
        <div className="flex justify-between items-start px-[0.5rem] bg-[#f8fafc] p-[1rem] rounded-[1rem] border border-[#e2e8f0]">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col">
              <h3 className="text-[1.25rem] font-bold text-[#1e293b] leading-tight">
                {productInfo?.nama_produk || 'Memuat...'}
              </h3>
              <span className="text-[0.875rem] text-[#64748b]">
                {productInfo?.category || '-'} {productInfo?.sub_category ? `> ${productInfo?.sub_category}` : ''}
              </span>
            </div>
          </div>
          <div className="text-right flex flex-col gap-2">
            <div>
              <span className="text-[0.75rem] text-[#64748b] block mb-1">No. PO</span>
              <span className="text-[1rem] font-bold text-[#1e3a34]">
                {productInfo?.kode_pembelian || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-[1.25rem]">
          {/* Main Work Area (Left) */}
          <div className="md:col-span-8 space-y-[1.25rem]">
            {/* Top Row: Waktu & QC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
              <div className="space-y-[0.5rem]">
                <Label id="label-datetime">WAKTU PENERIMAAN</Label>
                <div className="px-[1rem] py-[0.625rem] bg-white border border-[#e2e8f0] rounded-[0.5rem] text-[#1e293b] min-h-[42px] flex items-center">
                  {formatDateTime(data.datetime)}
                </div>
              </div>
              <div className="space-y-[0.5rem]">
                <Label id="label-sorting">QC / NON QC</Label>
                <div className="px-[1rem] py-[0.625rem] bg-white border border-[#e2e8f0] rounded-[0.5rem] text-[#1e293b] min-h-[42px] flex items-center justify-between">
                  <span>{data.sorting_type === 'QC' ? 'QC' : 'Non QC'}</span>
                  <div className="flex scale-75 origin-right">
                    <Badge variant={data.sorting_type === 'QC' ? 'info' : 'secondary'} className="px-4 py-1.5 text-sm">
                      {data.sorting_type}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Row: Qtys & Moisture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
              <div className="space-y-[0.5rem]">
                <Label id="label-qty-diterima">QTY DITERIMA ({productInfo?.unit || '-'})</Label>
                <div className="px-[1rem] py-[0.625rem] bg-white border border-[#e2e8f0] rounded-[0.5rem] font-bold text-[#1e293b] min-h-[42px] flex items-center">
                  {data.qty_received_actual?.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="space-y-[0.5rem]">
                <div className="flex items-center justify-between">
                  <Label id="label-actual-moisture">KADAR AIR (%) {productInfo?.purchase_kadar_air > 0 && <span className="text-[0.7rem] font-normal opacity-70 ml-1">(STANDARD: {productInfo.purchase_kadar_air}%)</span>}</Label>
                  {isNotStandard && (
                    <div className="bg-FeedbackColorError/10 text-FeedbackColorError text-[0.625rem] font-bold px-[0.5rem] py-[0.125rem] rounded-full border border-FeedbackColorError/20">
                      TIDAK STANDARD
                    </div>
                  )}
                </div>
                <div className="px-[1rem] py-[0.625rem] bg-white border border-[#e2e8f0] rounded-[0.5rem] font-bold text-[#1e293b] min-h-[42px] flex items-center justify-between">
                   <span>{data.actual_moisture ? `${data.actual_moisture}` : '-'}</span>
                   <span className="text-[#64748b] ml-1">%</span>
                </div>
              </div>
            </div>

            {/* KETERANGAN */}
            <div className="space-y-[0.5rem]">
              <Label id="label-desc">KETERANGAN</Label>
              <div className="px-[1rem] py-[0.75rem] bg-white border border-[#e2e8f0] rounded-[0.5rem] text-[0.875rem] text-[#1e293b] min-h-[4rem]">
                {data.description || 'Tidak ada keterangan.'}
              </div>
            </div>

            {/* BUKTI PENERIMAAN MULTIUPLOADINPUT */}
            <div className="space-y-[0.5rem]">
              <Label id="label-receipt-files">BUKTI PENERIMAAN</Label>
              <div className="p-4 border border-dashed border-[#10b981] rounded-xl bg-white">
                <AttachmentDisplay files={parseAttachments(data.receipt_proof_url)} id="receipt-attachments" />
              </div>
            </div>
          </div>

          {/* Rejection Area (Right - Red Box) */}
          <div className="md:col-span-4 space-y-[1.25rem]">
            <div className="border-2 border-[#fecaca] bg-[#fff5f5] rounded-[1.25rem] p-[1.25rem] space-y-[1.25rem]">
              <div className="space-y-[0.5rem]">
                <Label id="label-qty-reject" className="text-[#991b1b]">QTY REJECT ({productInfo?.unit || '-'})</Label>
                <div className="px-[1rem] py-[0.625rem] bg-white border border-[#fecaca] rounded-[0.5rem] font-bold text-[#991b1b] min-h-[42px] flex items-center">
                  {data.qty_rejection?.toLocaleString('id-ID') || 0}
                </div>
              </div>
              <div className="space-y-[0.5rem]">
                <Label id="label-rejection-reason" className="text-[#991b1b]">ALASAN REJECT</Label>
                <div className="px-[1rem] py-[0.75rem] bg-white border border-[#fecaca] rounded-[0.5rem] text-[0.875rem] text-red-900 min-h-[6rem]">
                  {data.rejected_reason || '-'}
                </div>
              </div>
              <div className="space-y-[0.5rem]">
                <Label id="label-reject-files" className="text-[#991b1b]">BUKTI REJECT</Label>
                <div className="p-4 border border-dashed border-[#ef4444] rounded-xl bg-white">
                  <AttachmentDisplay files={parseAttachments(data.rejected_proof_url)} id="reject-attachments" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AUDIT TRAIL SECTION (Full Width, Separate at Bottom) */}
        <div className="mt-[0rem]">
              <AuditTrail 
                id="penerimaan-audit"
                createdAt={data.created_at} 
                createdBy={data.created_by} 
                createdTimezone={data.created_timezone}
                updatedAt={data.updated_at}
                updatedBy={data.updated_by}
                updatedTimezone={data.updated_timezone}
              />
        </div>

      </div>
    </DetailShell>
  );
};

export default PenerimaanDetailPage;