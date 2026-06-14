import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { FormShell } from '../../../ui/components/common/shells/FormShell';
import { TextInput, NumberInput, LongTextInput, PercentageInput } from '../../../ui/components/elements/Inputs';
import { DateTimeInput } from '../../../ui/components/elements/DateTimeInput';
import { FixedDropdown } from '../../../ui/components/elements/Dropdown';
import { MultipleUploadInput } from '../../../ui/components/elements/UploadInput';
import { Card } from '../../../ui/components/common/Card';
import { Label } from '../../../ui/components/elements/Label';
import { Divider } from '../../../ui/components/elements/Divider';
import { penerimaanService } from '../../../logic/services/penerimaanService';
import { ITs_Penerimaan, IPenerimaanSortingType } from '../../../logic/types/ITs_Penerimaan';
import { ShoppingCart, Package, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { dbClient } from '../../../logic/libs/database';
import { cn } from '../../../logic/utils/cn';

/**
 * PENERIMAAN FORM PAGE
 * Menangani pembuatan (Create) data Penerimaan Produk.
 */
export const PenerimaanFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [rejectFiles, setRejectFiles] = useState<File[]>([]);
  
  // Form Values
  const [formData, setFormData] = useState<Partial<ITs_Penerimaan>>({
    datetime: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    sorting_type: IPenerimaanSortingType.NON_QC,
    qty_rejection: 0,
    rejected_valuation: 0,
    qty_received_actual: 0,
    qty_diff: 0,
    accepted_valuation: 0,
    price_per_unit_accepted: 0,
    actual_moisture: undefined,
    description: '',
  });

  // Check if moisture exceeds standard
  const isNotStandard = formData.actual_moisture !== undefined && 
                        productInfo?.purchase_kadar_air !== undefined && 
                        formData.actual_moisture > productInfo.purchase_kadar_air;

  // Load Context Data
  useEffect(() => {
    const loadContext = async () => {
      const productId = searchParams.get('product_id');
      const purchaseId = searchParams.get('purchase_id');
      const shippingId = searchParams.get('shipping_id');

      if (id) {
        const existing = await penerimaanService.getById(id);
        if (existing) {
          setFormData(existing);
          const sql = `
            SELECT 
              pp.name as nama_produk, pp.category, pp.sub_category, pp.qty as kuantiti, 
              pp.price_per_unit as harga_satuan, pp.kadar_air as purchase_kadar_air, pp.unit, 
              p.po_number as kode_pembelian, s.name as nama_suplier,
              sh.vehicle_number, sh.driver_name
            FROM pembelian_produk pp
            JOIN pembelian p ON pp.purchase_id = p.id
            LEFT JOIN suplier s ON p.supplier_id = s.id
            JOIN pengiriman sh ON sh.id = ?
            WHERE pp.id = ?
          `;
          const res = await dbClient.query(sql, [existing.shipping_id, existing.purchase_product_id]);
          if (res.rows.length > 0) setProductInfo(res.rows[0]);
        }
      } else if (productId && purchaseId && shippingId) {
        setFormData(prev => ({
          ...prev,
          purchase_id: purchaseId,
          purchase_product_id: productId,
          shipping_id: shippingId
        }));

        const sql = `
          SELECT 
            pp.name as nama_produk, pp.category, pp.sub_category, pp.qty as kuantiti, 
            pp.price_per_unit as harga_satuan, pp.kadar_air as purchase_kadar_air, pp.unit, 
            p.po_number as kode_pembelian, s.name as nama_suplier,
            sh.vehicle_number, sh.driver_name
          FROM pembelian_produk pp
          JOIN pembelian p ON pp.purchase_id = p.id
          LEFT JOIN suplier s ON p.supplier_id = s.id
          JOIN pengiriman sh ON sh.id = ?
          WHERE pp.id = ?
        `;
        try {
          const res = await dbClient.query(sql, [shippingId, productId]);
          if (res.rows.length > 0) setProductInfo(res.rows[0]);
        } catch (e) {
          console.error(e);
        }
      } else {
        navigate('/gudang/penerimaan');
      }
    };
    loadContext();
  }, [id, searchParams, navigate]);

  // Recalculate Totals (Still needed for persistence, even if hidden in UI)
  useEffect(() => {
    if (!productInfo) return;

    const qtyBeli = productInfo.kuantiti || 0;
    const hargaSatuan = productInfo.harga_satuan || 0;
    const qtyReject = formData.qty_rejection || 0;
    const qtyDiterima = formData.qty_received_actual || 0;
    
    const valuationReject = qtyReject * hargaSatuan;
    const totalValuasiBeli = qtyBeli * hargaSatuan;
    const valuationAccepted = totalValuasiBeli - valuationReject;
    const diff = qtyBeli - qtyReject - qtyDiterima;
    const pricePerUnit = qtyDiterima > 0 ? valuationAccepted / qtyDiterima : 0;

    setFormData(prev => ({
      ...prev,
      rejected_valuation: valuationReject,
      accepted_valuation: valuationAccepted,
      qty_diff: diff,
      price_per_unit_accepted: pricePerUnit
    }));
  }, [formData.qty_rejection, formData.qty_received_actual, productInfo]);

  // Effect to reset rejection fields if qty is empty/0
  useEffect(() => {
    if (!formData.qty_rejection || formData.qty_rejection <= 0) {
      setFormData(prev => ({
        ...prev,
        rejected_reason: '',
        rejected_proof_url: undefined
      }));
      setRejectFiles([]);
    }
  }, [formData.qty_rejection]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let result;
      if (id) {
        result = await penerimaanService.update(id, formData, receiptFiles.length > 0 ? receiptFiles : undefined, rejectFiles.length > 0 ? rejectFiles : undefined);
      } else {
        result = await penerimaanService.create(formData as any, receiptFiles, rejectFiles);
      }

      if (result) {
        swalToast.fire({ icon: 'success', title: 'Penerimaan berhasil disimpan' });
        navigate('/gudang/penerimaan');
      } else {
        swalToast.fire({ icon: 'error', title: 'Gagal menyimpan penerimaan' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Validation for Save Button
  const isSaveDisabled = (() => {
    // Basic mandatory
    const hasReceipts = (formData.receipt_proof_url && JSON.parse(formData.receipt_proof_url).length > 0) || receiptFiles.length > 0;

    if (!formData.qty_received_actual && formData.qty_received_actual !== 0) return true;
    if (!hasReceipts) return true;
    if (!formData.datetime) return true;

    // Conditional: Kadar Air
    if (productInfo?.purchase_kadar_air > 0 && (formData.actual_moisture === undefined || formData.actual_moisture === null)) return true;

    // Conditional: Rejection
    if ((formData.qty_rejection || 0) > 0) {
      if (!formData.rejected_reason) return true;
      const hasRejectedProofs = (formData.rejected_proof_url && JSON.parse(formData.rejected_proof_url).length > 0) || rejectFiles.length > 0;
      if (!hasRejectedProofs) return true;
    }

    return false;
  })();

  return (
    <FormShell
      title={id ? "Edit Penerimaan" : "Proses Penerimaan"}
      id="penerimaan-form-shell"
      onSave={handleSave}
      isLoading={isLoading}
      isSaveDisabled={isSaveDisabled}
      onCancel={() => navigate('/gudang/penerimaan')}
    >
      <div className="flex flex-col gap-[1.5rem]">
        {/* Visual Header as per sketch */}
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
          <div className="md:col-span-8 space-y-[1.25rem] pb-[4rem]">
            {/* Top Row: Waktu & QC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
              <div className="space-y-[0.5rem]">
                <Label id="label-datetime" required>WAKTU PENERIMAAN</Label>
                <DateTimeInput 
                  id="input-datetime"
                  value={formData.datetime}
                  onChange={(e) => setFormData(p => ({ ...p, datetime: e.target.value }))}
                />
              </div>
              <div className="space-y-[0.5rem]">
                <Label id="label-sorting" required>QC / NON QC</Label>
                <FixedDropdown 
                  id="input-sorting"
                  options={[
                    { value: IPenerimaanSortingType.NON_QC, label: 'Non QC' },
                    { value: IPenerimaanSortingType.QC, label: 'QC' },
                  ]}
                  value={formData.sorting_type || IPenerimaanSortingType.NON_QC}
                  onChange={(val) => setFormData(p => ({ ...p, sorting_type: val as any }))}
                />
              </div>
            </div>

            {/* Middle Row: Qtys & Moisture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
              <div className="space-y-[0.5rem]">
                <Label id="label-qty-diterima" required>QTY DITERIMA ({productInfo?.unit || '-'})</Label>
                <NumberInput 
                  id="input-qty-diterima"
                  value={formData.qty_received_actual}
                  onChange={(e) => setFormData(p => ({ ...p, qty_received_actual: Number(e.target.value) }))}
                  placeholder="Input qty aktual..."
                />
              </div>
              <div className="space-y-[0.5rem]">
                <div className="flex items-center justify-between">
                  <Label id="label-actual-moisture" required={productInfo?.purchase_kadar_air > 0}>
                    KADAR AIR (%) {productInfo?.purchase_kadar_air > 0 && <span className="text-[0.7rem] font-normal opacity-70 ml-1">(STANDARD: {productInfo.purchase_kadar_air}%)</span>}
                  </Label>
                  {isNotStandard && (
                    <div className="bg-FeedbackColorError/10 text-FeedbackColorError text-[0.625rem] font-bold px-[0.5rem] py-[0.125rem] rounded-full border border-FeedbackColorError/20 animate-pulse">
                      TIDAK STANDARD
                    </div>
                  )}
                </div>
                <PercentageInput 
                  id="input-actual-moisture"
                  value={formData.actual_moisture}
                  onChange={(e) => setFormData(p => ({ ...p, actual_moisture: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Input % aktual..."
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-[0.5rem]">
              <Label id="label-desc">KETERANGAN</Label>
              <LongTextInput 
                id="input-desc"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Catatan tambahan di sini..."
              />
            </div>

            {/* Bukti Penerimaan */}
            <div className="space-y-[0.5rem]">
              <Label id="label-receipt-files" required>BUKTI PENERIMAAN</Label>
              <MultipleUploadInput 
                id="input-receipt-files"
                maxFiles={10}
                initialUrls={formData.receipt_proof_url ? JSON.parse(formData.receipt_proof_url) : []}
                onFilesChange={setReceiptFiles}
                onRemoveInitialUrl={(url) => {
                  const current = formData.receipt_proof_url ? JSON.parse(formData.receipt_proof_url) : [];
                  const filtered = current.filter((u: string) => u !== url);
                  setFormData(prev => ({ ...prev, receipt_proof_url: JSON.stringify(filtered) }));
                }}
              />
            </div>
            
            {/* Removed redundant spacer since pb-[4rem] added to container */}
          </div>

          {/* Rejection Area (Right - Red Box) */}
          <div className="md:col-span-4 pb-[4rem]">
            <div className={cn(
              "border-2 border-[#fecaca] bg-[#fff5f5] rounded-[1.25rem] p-[1.25rem] space-y-[1.25rem] transition-all",
              (!formData.qty_rejection || formData.qty_rejection <= 0) && "opacity-60 bg-gray-50 border-gray-200"
            )}>
              <div className="space-y-[0.5rem]">
                <Label id="label-qty-reject" className="text-[#991b1b]">QTY REJECT ({productInfo?.unit || '-'})</Label>
                <NumberInput 
                  id="input-qty-reject"
                  className="!border-[#fecaca] focus:!border-[#ef4444]"
                  value={formData.qty_rejection}
                  onChange={(e) => setFormData(p => ({ ...p, qty_rejection: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-[0.5rem]">
                <Label id="label-rejection-reason" className={cn("text-[#991b1b]", (formData.qty_rejection || 0) > 0 && "after:content-['*'] after:ml-1 after:text-FeedbackColorError")}>ALASAN REJECT</Label>
                <LongTextInput 
                  id="input-rejection-reason"
                  rows={4}
                  className="!border-[#fecaca] focus:!border-[#ef4444]"
                  value={formData.rejected_reason}
                  onChange={(e) => setFormData(p => ({ ...p, rejected_reason: e.target.value }))}
                  placeholder="Jelaskan alasan reject..."
                  disabled={!formData.qty_rejection || formData.qty_rejection <= 0}
                />
              </div>
              <div className="space-y-[0.5rem]">
                <Label id="label-reject-files" className={cn("text-[#991b1b]", (formData.qty_rejection || 0) > 0 && "after:content-['*'] after:ml-1 after:text-FeedbackColorError")}>BUKTI REJECT</Label>
                <MultipleUploadInput 
                  id="input-reject-files"
                  maxFiles={5}
                  initialUrls={formData.rejected_proof_url ? JSON.parse(formData.rejected_proof_url) : []}
                  onFilesChange={setRejectFiles}
                  onRemoveInitialUrl={(url) => {
                    const current = formData.rejected_proof_url ? JSON.parse(formData.rejected_proof_url) : [];
                    const filtered = current.filter((u: string) => u !== url);
                    setFormData(prev => ({ ...prev, rejected_proof_url: JSON.stringify(filtered) }));
                  }}
                  disabled={!formData.qty_rejection || formData.qty_rejection <= 0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormShell>
  );
};

export default PenerimaanFormPage;
