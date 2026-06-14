import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { NumberInput, PriceInput } from '../../../ui/components/elements/Inputs';
import { Label } from '../../../ui/components/elements/Label';
import { Plus, Trash2 } from 'lucide-react';
import { daftarHargaService } from '../../../logic/services/daftarHargaService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { IDaftarHarga, IDaftarHargaPayload, ITieredPrice } from '../../../logic/types/ITs_DaftarHarga';
import { IStokBerjalan } from '../../../logic/types/ITs_StokBerjalan';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { cn } from '../../../logic/utils/cn';

interface DaftarHargaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: IDaftarHarga | null;
  skuInitial?: string;
}

export const DaftarHargaFormModal: React.FC<DaftarHargaFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
  skuInitial,
}) => {
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStock, setSelectedStock] = useState<IStokBerjalan | null>(null);
  const [tieredPricing, setTieredPricing] = useState<ITieredPrice[]>([]);
  const [sku, setSku] = useState('');

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setSku(editData.sku);
        setTieredPricing(editData.tiered_pricing || []);
        loadStock(editData.sku);
      } else if (skuInitial) {
        setSku(skuInitial);
        setTieredPricing([{ min_qty: 1, price: 0 }]);
        loadStock(skuInitial);
      } else {
        setSku('');
        setTieredPricing([{ min_qty: 1, price: 0 }]);
        setSelectedStock(null);
      }
    }
  }, [isOpen, editData, skuInitial]);

  const loadStock = async (targetSku: string) => {
    try {
      const res = await stokBerjalanService.getBySku(targetSku);
      setSelectedStock(res);
    } catch (e) {
      console.error('Failed to load stock info', e);
    }
  };

  const handleAddTier = () => {
    setTieredPricing([...tieredPricing, { min_qty: 1, price: 0 }]);
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = [...tieredPricing];
    newTiers.splice(index, 1);
    setTieredPricing(newTiers);
  };

  const handleUpdateTier = (index: number, field: keyof ITieredPrice, value: number) => {
    const newTiers = [...tieredPricing];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTieredPricing(newTiers);
  };

  const handleSave = async () => {
    if (!sku || !selectedStock) {
      swalToast.fire({ icon: 'warning', title: 'Data produk tidak valid' });
      return;
    }

    // Validation: min_qty and price must be > 0
    const isValid = tieredPricing.every(t => t.min_qty > 0 && t.price > 0);
    if (!isValid || tieredPricing.length === 0) {
      swalToast.fire({ icon: 'warning', title: 'Mohon isi minimal satu harga bertingkat dengan benar' });
      return;
    }

    setIsProcessing(true);
    try {
      const payload: IDaftarHargaPayload = {
        sku: selectedStock.sku,
        product_id: selectedStock.id, // Using stok_berjalan ID as product_id
        category: selectedStock.category,
        sub_category: selectedStock.sub_category || '',
        name: selectedStock.name,
        unit: selectedStock.unit,
        tiered_pricing: tieredPricing,
      };

      let result;
      if (editData) {
        result = await daftarHargaService.update(editData.id, payload);
      } else {
        result = await daftarHargaService.create(payload);
      }

      if (result) {
        swalToast.fire({ icon: 'success', title: `Daftar harga ${editData ? 'diperbarui' : 'disimpan'}!` });
        onSuccess();
        onClose();
      } else {
        swalToast.fire({ icon: 'error', title: 'Gagal memproses data' });
      }
    } catch (e) {
      console.error(e);
      swalToast.fire({ icon: 'error', title: 'Terjadi kesalahan sistem' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      id="daftar-harga-form-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Daftar Harga" : "Atur Daftar Harga Baru"}
      onSubmit={handleSave}
      submitLabel={editData ? "Update Harga" : "Simpan Harga"}
      cancelLabel="Batal"
      isSubmitDisabled={isProcessing}
      className={cn("!max-w-[48rem]", isMobile && "!max-w-full")}
    >
      <div className="flex flex-col gap-[1.5rem]">
        {/* Product Basic Info (Read Only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem] p-[1rem] bg-[#f8fafc] rounded-[1rem] border border-[#e2e8f0]">
          <div className="flex flex-col gap-[0.25rem]">
            <span className="text-[0.625rem] font-bold text-[#64748b] uppercase tracking-wider">SKU</span>
            <span className="text-[0.875rem] font-bold text-[#1e293b]">{selectedStock?.sku || sku}</span>
          </div>
          <div className="flex flex-col gap-[0.25rem]">
            <span className="text-[0.625rem] font-bold text-[#64748b] uppercase tracking-wider">Nama Produk</span>
            <span className="text-[0.875rem] font-bold text-[#1e293b]">{selectedStock?.name || 'Loading...'}</span>
          </div>
          <div className="flex flex-col gap-[0.25rem]">
            <span className="text-[0.625rem] font-bold text-[#64748b] uppercase tracking-wider">Kategori</span>
            <span className="text-[0.875rem] font-medium text-[#1e293b]">{selectedStock?.category} {selectedStock?.sub_category ? `> ${selectedStock.sub_category}` : ''}</span>
          </div>
          <div className="flex flex-col gap-[0.25rem]">
            <span className="text-[0.625rem] font-bold text-[#64748b] uppercase tracking-wider">Satuan</span>
            <span className="text-[0.875rem] font-medium text-[#1e293b]">{selectedStock?.unit}</span>
          </div>
        </div>

        {/* Tiered Pricing Section */}
        <div className="space-y-[1rem]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Label id="label-pricing-title" className="!mb-0 text-[1rem] font-bold text-[#1e3a34]">Pengaturan Harga Grosir</Label>
              <span className="text-[0.75rem] text-[#64748b]">Tentukan minimal kuantitas untuk tier harga tertentu</span>
            </div>
            <button
              id="add-tier-btn"
              type="button"
              onClick={handleAddTier}
              className="flex items-center gap-[0.375rem] px-[0.75rem] py-[0.375rem] bg-[#f0fdf4] text-[#166534] border border-[#dcfce7] rounded-full text-[0.75rem] font-bold hover:bg-[#dcfce7] transition-all"
            >
              <Plus size={14} />
              Tambah Tier
            </button>
          </div>

          <div className="space-y-[0.75rem]">
            {tieredPricing.map((tier, idx) => (
              <div 
                key={idx} 
                className="grid grid-cols-12 gap-[0.75rem] items-end p-[0.75rem] border border-[#e2e8f0] rounded-[0.75rem] bg-white shadow-sm"
              >
                <div className="col-span-4 space-y-[0.375rem]">
                  <Label id={`label-qty-${idx}`} className="!text-[0.6875rem] !font-bold">Min. Qty ({selectedStock?.unit})</Label>
                  <NumberInput
                    id={`input-qty-${idx}`}
                    placeholder="0"
                    value={tier.min_qty}
                    onChange={(e) => handleUpdateTier(idx, 'min_qty', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-6 space-y-[0.375rem]">
                  <Label id={`label-price-${idx}`} className="!text-[0.6875rem] !font-bold">Harga Jual per {selectedStock?.unit}</Label>
                  <PriceInput
                    id={`input-price-${idx}`}
                    placeholder="0"
                    value={tier.price}
                    onChange={(e) => handleUpdateTier(idx, 'price', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2 flex justify-end pb-[0.25rem]">
                  {tieredPricing.length > 1 && (
                    <button
                      id={`remove-tier-${idx}`}
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="p-[0.5rem] text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
