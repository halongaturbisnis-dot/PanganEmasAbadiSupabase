import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { TextInput, NumberInput, LongTextInput, PriceInput } from '../../../ui/components/elements/Inputs';
import { Label } from '../../../ui/components/elements/Label';
import { stokTerbuangService } from '../../../logic/services/stokTerbuangService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { formatCurrency } from '../../../logic/utils/data';
import { IStokTerbuang } from '../../../logic/types/ITs_StokTerbuang';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';
import { AttachmentDisplay } from '../../../ui/components/elements/AttachmentDisplay';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';

interface StokTerbuangDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stokTerbuangId?: string;
  onSuccess: () => void;
  id?: string;
}

export const StokTerbuangDetailModal: React.FC<StokTerbuangDetailModalProps> = ({
  isOpen,
  onClose,
  stokTerbuangId,
  onSuccess,
  id = "stok-terbuang-detail-modal",
}) => {
  const [data, setData] = useState<IStokTerbuang | null>(null);
  const [runningStock, setRunningStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stokTerbuangId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const res = await stokTerbuangService.getById(stokTerbuangId);
          setData(res);
          if (res) {
            const stock = await stokBerjalanService.getBySku(res.sku);
            setRunningStock(stock);
          }
        } catch (e) {
          console.error('Failed to load stok terbuang detail:', e);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      setData(null);
      setRunningStock(null);
    }
  }, [isOpen, stokTerbuangId]);

  // Parse list of files URLs for AttachmentDisplay
  const formattedFiles = useMemo(() => {
    if (!data?.proof_url) return [];
    try {
      const parsed = JSON.parse(data.proof_url);
      if (Array.isArray(parsed)) {
        return parsed.map((url, index) => ({
          url,
          name: `Bukti-${index + 1}`
        }));
      }
    } catch (e) {
      // Fallback single url if plain string
      if (typeof data.proof_url === 'string' && data.proof_url.startsWith('http')) {
        return [{ url: data.proof_url, name: 'Bukti Fisik' }];
      }
    }
    return [];
  }, [data]);

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Stok Terbuang"
      cancelLabel="Tutup"
      onCancel={onClose}
      className="!max-w-[44rem]"
    >
      {isLoading ? (
        <div className="py-[3rem] text-center text-[#64748b]">Memuat detail transaksi...</div>
      ) : data ? (
        <div className="flex flex-col gap-[1rem]">
          {/* Master Stock Banner */}
          {runningStock && (
            <div className="hidden bg-[#f0fdf4] p-[0.75rem] rounded-[0.75rem] border border-[#dcfce7] flex items-center justify-between text-TextColorBase">
              <div className="flex flex-col gap-[0.125rem]">
                <span className="text-[0.6875rem] text-[#166534] font-bold uppercase tracking-wider">
                  Persediaan Saat Ini (Stok Berjalan)
                </span>
                <span className="text-[0.8125rem] font-bold text-[#166534]">
                  {runningStock.qty_current || 0} {data.unit} @{' '}
                  {formatCurrency(runningStock.price_per_unit_running || 0)}
                </span>
              </div>
              <span className="text-[0.6875rem] font-medium text-[#16a34a] bg-white border border-[#dcfce7] px-[0.5rem] py-[0.125rem] rounded-full">
                Kondisi Aktif
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
            {/* Row 1: SKU & Nama Produk */}
            <div className="space-y-[0.375rem]">
              <Label id={`${id}-label-sku`}>
                SKU Produk
              </Label>
              <TextInput
                id={`${id}-input-sku`}
                value={data.sku || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            <div className="space-y-[0.375rem]">
              <Label id={`${id}-label-name`}>
                Nama Produk
              </Label>
              <TextInput
                id={`${id}-input-name`}
                value={data.name || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Row 2: Kategori & Sub Kategori */}
            <div className="space-y-[0.375rem]">
              <Label id={`${id}-label-kategori`}>
                Kategori
              </Label>
              <TextInput
                id={`${id}-input-kategori`}
                value={data.category || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            <div className="space-y-[0.375rem]">
              <Label id={`${id}-label-sub-category`}>Sub Kategori</Label>
              <TextInput
                id={`${id}-input-sub-category`}
                value={data.sub_category || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Row 3: Unit & Kuantitas Terbuang */}
            <div className="space-y-[0.375rem]">
              <Label id={`${id}-label-unit`}>
                Unit
              </Label>
              <TextInput
                id={`${id}-input-unit`}
                value={data.unit || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            <div className="space-y-[0.375rem]">
              <Label id={`${id}-label-qty`}>
                Kuantitas Terbuang
              </Label>
              <NumberInput
                id={`${id}-input-qty`}
                value={data.qty || 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Row 4: Pricing Info */}
            <div className="hidden space-y-[0.375rem]">
              <Label id={`${id}-label-price-per-unit-out`}>
                Ekspektasi Harga Satuan
              </Label>
              <PriceInput
                id={`${id}-input-price-per-unit-out`}
                value={data.price_per_unit_out ? Math.round(data.price_per_unit_out) : 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            <div className="hidden space-y-[0.375rem]">
              <Label id={`${id}-label-total-price-out`}>
                Estimasi Nilai Discard
              </Label>
              <PriceInput
                id={`${id}-input-total-price-out`}
                value={data.total_price_out ? Math.round(data.total_price_out) : 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Row 5: Bukti Upload (Spans full width) */}
            <div className="sm:col-span-2 space-y-[0.375rem]">
              <Label id={`${id}-lbl-proofs`}>Foto/Lampiran Bukti Fisik</Label>
              <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-[0.75rem]">
                <AttachmentDisplay
                  id={`${id}-proofs-viewer`}
                  files={formattedFiles}
                  emptyText="Tidak ada file bukti fisik terlampir"
                />
              </div>
            </div>

            {/* Row 6: Keterangan (Spans full width) */}
            <div className="sm:col-span-2 space-y-[0.375rem]">
              <Label id={`${id}-label-description`}>Keterangan / Alasan Pembuangan</Label>
              <LongTextInput
                id={`${id}-input-description`}
                value={data.description || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
                rows={3}
              />
            </div>

            {/* Audit Trail */}
            <div className="sm:col-span-2 border-t border-[#f1f5f9] pt-[1rem] mt-[0.5rem]">
              <AuditTrail
                id={`${id}-audit`}
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
      ) : (
        <div className="py-[3rem] text-center text-red-500 font-bold">Data detail transaksi tidak ditemukan</div>
      )}
    </Modal>
  );
};
