import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { TextInput, NumberInput, LongTextInput, PriceInput } from '../../../ui/components/elements/Inputs';
import { Label } from '../../../ui/components/elements/Label';
import { stokMasukService } from '../../../logic/services/stokMasukService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { formatCurrency } from '../../../logic/utils/data';
import { IStokMasuk } from '../../../logic/types/ITs_StokMasuk';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';

interface StokMasukDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stokMasukId?: string;
}

export const StokMasukDetailModal: React.FC<StokMasukDetailModalProps> = ({
  isOpen,
  onClose,
  stokMasukId,
}) => {
  const [data, setData] = useState<IStokMasuk | null>(null);
  const [runningStock, setRunningStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stokMasukId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const res = await stokMasukService.getById(stokMasukId);
          setData(res);
          if (res) {
            const stock = await stokBerjalanService.getBySku(res.sku);
            setRunningStock(stock);
          }
        } catch (e) {
          console.error('Failed to load stok masuk detail:', e);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      setData(null);
      setRunningStock(null);
    }
  }, [isOpen, stokMasukId]);

  return (
    <Modal
      id="stok-masuk-detail-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Catatan Stok Masuk"
      submitLabel=""
      cancelLabel="Tutup"
      onCancel={onClose}
      className="!max-w-[44rem]"
    >
      {isLoading ? (
        <div className="py-[3rem] text-center text-[#64748b]">Memuat detail...</div>
      ) : data ? (
        <div className="flex flex-col gap-[1rem]">
          {/* Persediaan Saat Ini Banner */}
          {runningStock && (
            <div className="hidden bg-[#f0fdf4] p-[0.75rem] rounded-[0.75rem] border border-[#dcfce7] flex items-center justify-between text-TextColorBase">
              <div className="flex flex-col gap-[0.125rem]">
                <span className="text-[0.6875rem] text-[#166534] font-bold uppercase tracking-wider">
                  Persediaan Saat Ini
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

            {/* Qty Masuk */}
            <div className="space-y-[0.375rem]">
              <Label id="label-detail-qty-in">Qty Masuk</Label>
              <NumberInput
                id="detail-qty-in"
                value={data.qty_in || 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Price per Unit */}
            <div className="hidden space-y-[0.375rem]">
              <Label id="label-detail-price-per-unit-in">Price per Unit</Label>
              <PriceInput
                id="detail-price-per-unit-in"
                value={data.price_per_unit_in ? Math.round(data.price_per_unit_in) : 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* Total Price */}
            <div className="hidden space-y-[0.375rem]">
              <Label id="label-detail-total-price-in">Total Price</Label>
              <PriceInput
                id="detail-total-price-in"
                value={data.total_price_in ? Math.round(data.total_price_in) : 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            {/* New Price Per Unit */}
            <div className="hidden space-y-[0.375rem]">
              <Label id="label-detail-new-ma-price">New Price Per Unit</Label>
              <PriceInput
                id="detail-new-ma-price"
                value={data.new_running_stock_price_per_unit ? Math.round(data.new_running_stock_price_per_unit) : 0}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
              />
            </div>

            <div className="hidden sm:block" />

            {/* Keterangan */}
            <div className="sm:col-span-2 space-y-[0.375rem]">
              <Label id="label-detail-description">Keterangan</Label>
              <LongTextInput
                id="detail-description"
                value={data.description || ''}
                disabled
                className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
                rows={2}
              />
            </div>

            {/* Audit Trail */}
            <div className="sm:col-span-2 border-t border-[#f1f5f9] pt-[1rem] mt-[0.5rem]">
              <AuditTrail
                id="stok-masuk-detail-audit"
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
        <div className="py-[3rem] text-center text-red-500 font-bold">Data detail tidak ditemukan</div>
      )}
    </Modal>
  );
};
