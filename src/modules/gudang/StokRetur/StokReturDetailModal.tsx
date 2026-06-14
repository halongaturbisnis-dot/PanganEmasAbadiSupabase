import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { TextInput, NumberInput, LongTextInput, PriceInput } from '../../../ui/components/elements/Inputs';
import { Label } from '../../../ui/components/elements/Label';
import { stokReturService } from '../../../logic/services/stokReturService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { formatCurrency } from '../../../logic/utils/data';
import { IStokRetur } from '../../../logic/types/ITs_StokRetur';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';

interface StokReturDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stokReturId?: string;
  onSuccess: () => void;
}

export const StokReturDetailModal: React.FC<StokReturDetailModalProps> = ({
  isOpen,
  onClose,
  stokReturId,
}) => {
  const [data, setData] = useState<IStokRetur | null>(null);
  const [runningStock, setRunningStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stokReturId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const res = await stokReturService.getById(stokReturId);
          setData(res);
          if (res) {
            const stock = await stokBerjalanService.getBySku(res.sku);
            setRunningStock(stock);
          }
        } catch (e) {
          console.error('Failed to load stok retur detail:', e);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      setData(null);
      setRunningStock(null);
    }
  }, [isOpen, stokReturId]);

  return (
    <Modal
      id="stok-retur-detail-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Transaksi Stok Retur"
      submitLabel=""
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
                  Kondisi Master Stok Berjalan Saat Ini
                </span>
                <span className="text-[0.8125rem] font-bold text-[#166534]">
                  {runningStock.qty_current || 0} {data.unit} @{' '}
                  {formatCurrency(runningStock.price_per_unit_running || 0)}
                </span>
              </div>
              <span className="text-[0.6875rem] font-medium text-[#16a34a] bg-white border border-[#dcfce7] px-[0.5rem] py-[0.125rem] rounded-full">
                Moving Average
              </span>
            </div>
          )}

          {/* Grid fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
            {/* SKU */}
            <div className="space-y-[0.375rem]">
              <Label id="label-detail-sku">SKU</Label>
              <TextInput
                id="detail-sku"
                value={data.sku || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Nama Produk */}
            <div className="space-y-[0.375rem]">
              <Label id="label-detail-name">Nama Produk</Label>
              <TextInput
                id="detail-name"
                value={data.name || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Kategori */}
            <div className="space-y-[0.375rem]">
              <Label id="label-detail-kategori">Kategori</Label>
              <TextInput
                id="detail-kategori"
                value={data.category || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Sub Kategori */}
            <div className="space-y-[0.375rem]">
              <Label id="label-detail-sub-category">Sub Kategori</Label>
              <TextInput
                id="detail-sub-category"
                value={data.sub_category || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Unit */}
            <div className="space-y-[0.375rem]">
              <Label id="label-detail-unit">Unit</Label>
              <TextInput
                id="detail-unit"
                value={data.unit || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Qty Retur */}
            <div className="space-y-[0.375rem]">
              <Label id="label-detail-qty-retur">Kuantitas Retur</Label>
              <NumberInput
                id="detail-qty-retur"
                value={data.qty || 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Price per Unit Referensi */}
            <div className="hidden space-y-[0.375rem]">
              <Label id="label-detail-price-per-unit-in">Harga Satuan Masuk</Label>
              <PriceInput
                id="detail-price-per-unit-in"
                value={data.price_per_unit_in ? Math.round(data.price_per_unit_in) : 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Total Nilai Retur */}
            <div className="hidden space-y-[0.375rem]">
              <Label id="label-detail-total-price-in">Total Nilai Retur</Label>
              <PriceInput
                id="detail-total-price-in"
                value={data.total_price_in ? Math.round(data.total_price_in) : 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Keterangan */}
            <div className="sm:col-span-2 space-y-[0.375rem]">
              <Label id="label-detail-description">Alasan / Keterangan Retur</Label>
              <LongTextInput
                id="detail-description"
                value={data.description || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
                rows={3}
              />
            </div>

            {/* Audit Trail */}
            <div className="sm:col-span-2 border-t border-[#f1f5f9] pt-[1rem] mt-[0.5rem]">
              <AuditTrail
                id="stok-retur-detail-audit"
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
