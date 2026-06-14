import React, { useState, useEffect } from 'react';
import { IStokOpname } from '../../logic/types/ITs_StokOpname';
import { stokOpnameService } from '../../logic/services/stokOpnameService';
import { Modal } from '../../ui/components/common/Modal';
import { formatDate } from '../../logic/utils/date';
import { Label } from '../../ui/components/elements/Label';
import { cn } from '../../logic/utils/cn';
import { AuditTrail } from '../../ui/components/elements/AuditTrail';

interface StokOpnameDetailModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StokOpnameDetailModal: React.FC<StokOpnameDetailModalProps> = ({ 
  id, 
  isOpen, 
  onClose 
}) => {
  const [data, setData] = useState<IStokOpname | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && id) {
      loadData();
    }
  }, [id, isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    const result = await stokOpnameService.getById(id);
    setData(result);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const isPositive = data ? data.qty_diff > 0 : false;
  const isNegative = data ? data.qty_diff < 0 : false;

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Stok Opname"
      cancelLabel="Tutup"
      onCancel={onClose}
      className="!max-w-[44rem]"
      // Disabling OK button as SO is irreversible and read-only
      submitLabel=""
    >
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Memuat detail...</div>
      ) : !data ? (
        <div className="py-8 text-center text-red-500">Data Stok Opname tidak ditemukan.</div>
      ) : (
        <div className="flex flex-col gap-[1.5rem]">
          {/* Info Banner */}
          <div className="bg-[#f0fdf4] p-[0.75rem] rounded-[0.75rem] border border-[#dcfce7] flex items-center justify-between text-TextColorBase">
            <div className="flex flex-col gap-[0.125rem]">
              <span className="text-[0.6875rem] text-[#166534] font-bold uppercase tracking-wider">
                Produk Terpilih
              </span>
              <span className="text-[0.8125rem] font-bold text-[#166534]">
                {data.stok_name || 'Tidak diketahui'} (SKU: {data.sku})
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-white text-[#166534] border border-[#dcfce7]">
                {data.no_so}
              </span>
              <p className="text-[0.6875rem] text-[#166534]/80 mt-1">
                {formatDate(data.created_at || '')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
            <div className="space-y-[0.375rem]">
              <Label id="stok-opname-detail-label-qty-system">
                Stok Sistem {data.stok_unit ? `(${data.stok_unit})` : ''}
              </Label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={data.qty_system}
                  disabled
                  className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-bold focus:outline-none focus:ring-0 text-left"
                />
              </div>
            </div>

            <div className="space-y-[0.375rem] relative">
              <Label id="stok-opname-detail-label-qty-actual" className="text-ColorPrimary font-bold">
                Stok Aktual {data.stok_unit ? `(${data.stok_unit})` : ''}
              </Label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={data.qty_actual}
                  disabled
                  className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-ColorPrimary/50 bg-[#f8fafc] cursor-not-allowed text-[#1e293b] leading-normal font-black focus:outline-none focus:ring-0 text-left"
                />
              </div>
              <div className="absolute right-3 top-[2.1rem]">
                  <span className={cn(
                    "text-[0.875rem] font-black",
                    isPositive ? "text-[#166534]" : isNegative ? "text-[#b91c1c]" : "text-[#64748b]"
                  )}>
                    ({isPositive ? '+' : ''}{data.qty_diff})
                  </span>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="space-y-[0.375rem]">
              <Label id="stok-opname-detail-label-price">
                Harga Per Unit
              </Label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.harga_per_unit || 0)}
                  disabled
                  className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none focus:ring-0 text-left"
                />
              </div>
            </div>

            <div className="space-y-[0.375rem]">
              <Label id="stok-opname-detail-label-valuation">
                Total Valuasi Selisih
              </Label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.total_valuasi_selisih || 0)}
                  disabled
                  className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none focus:ring-0 text-left"
                />
              </div>
            </div>
          </div>

          <div className="space-y-[0.375rem]">
            <Label id="stok-opname-detail-label-notes">Keterangan / Alasan Audit</Label>
            <textarea
              id="stok-opname-detail-input-notes"
              value={data.notes || 'Tidak ada catatan...'}
              disabled
              rows={3}
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none resize-none"
            />
          </div>

          <AuditTrail 
            id="stok-opname-audit"
            createdAt={data.created_at} 
            createdBy={data.created_by} 
            createdTimezone={data.created_timezone}
          />
        </div>
      )}
    </Modal>
  );
};

