import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { Label } from '../../../ui/components/elements/Label';
import { daftarHargaService } from '../../../logic/services/daftarHargaService';
import { IDaftarHarga } from '../../../logic/types/ITs_DaftarHarga';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';
import { formatCurrency } from '../../../logic/utils/data';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface DaftarHargaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
}

export const DaftarHargaDetailModal: React.FC<DaftarHargaDetailModalProps> = ({
  isOpen,
  onClose,
  id,
}) => {
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  const [data, setData] = useState<IDaftarHarga | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && id) {
      const load = async () => {
        setIsLoading(true);
        try {
          const res = await daftarHargaService.getById(id);
          setData(res);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      load();
    }
  }, [isOpen, id]);

  return (
    <Modal
      id="daftar-harga-detail-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Katalog Harga"
      submitLabel=""
      cancelLabel="Tutup"
      onCancel={onClose}
      className={cn("!max-w-[44rem]", isMobile && "!max-w-full")}
    >
      {isLoading ? (
        <div className="py-[3rem] text-center text-[#64748b]">Memuat detail...</div>
      ) : data ? (
        <div className="flex flex-col gap-[1.5rem]">
          {/* Header Info */}
          <div className="flex flex-col gap-[0.25rem] border-b border-[#f1f5f9] pb-[1rem]">
            <h3 className="text-[1.25rem] font-bold text-[#1e3a34]">{data.name}</h3>
            <div className="flex items-center gap-[0.5rem] text-[0.75rem] font-bold text-[#64748b] uppercase tracking-wider">
              <span>{data.sku}</span>
              <span>•</span>
              <span>{data.category} {data.sub_category ? `> ${data.sub_category}` : ''}</span>
            </div>
          </div>

          {/* Pricing Tiers Table */}
          <div className="space-y-[0.75rem]">
            <Label id="label-pricing-tiers" className="!mb-0 text-[0.875rem] font-bold text-[#1e3a34]">Daftar Harga Grosir</Label>
            <div className="overflow-hidden border border-[#e2e8f0] rounded-[1rem]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-[1rem] py-[0.75rem] text-[0.7rem] font-bold text-[#64748b] uppercase tracking-wider border-b border-[#e2e8f0]">Minimal Pembelian</th>
                    <th className="px-[1rem] py-[0.75rem] text-[0.7rem] font-bold text-[#64748b] uppercase tracking-wider border-b border-[#e2e8f0]">Harga Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {data.tiered_pricing.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-[1rem] py-[1rem] text-[0.875rem] font-bold text-[#1e293b]">
                        {tier.min_qty} {data.unit}
                      </td>
                      <td className="px-[1rem] py-[1rem] text-[0.875rem] font-bold text-[#0336A3]">
                        {formatCurrency(tier.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="border-t border-[#f1f5f9] pt-[1rem]">
            <AuditTrail
              id="daftar-harga-audit"
              createdAt={data.created_at}
              createdBy={data.created_by}
              createdTimezone={data.created_timezone}
              updatedAt={data.updated_at}
              updatedBy={data.updated_by}
              updatedTimezone={data.updated_timezone}
            />
          </div>
        </div>
      ) : (
        <div className="py-[3rem] text-center text-red-500 font-bold">Data tidak ditemukan</div>
      )}
    </Modal>
  );
};
