import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { NumberInput, LongTextInput, PriceInput } from '../../../ui/components/elements/Inputs';
import { CustomValueDropdown } from '../../../ui/components/elements/Dropdown';
import { Label } from '../../../ui/components/elements/Label';
import { stokReturService } from '../../../logic/services/stokReturService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { formatCurrency } from '../../../logic/utils/data';
import { IStokReturPayload } from '../../../logic/types/ITs_StokRetur';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface StokReturFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id?: string;
}

export const StokReturFormModal: React.FC<StokReturFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  id = "stok-retur-form-modal",
}) => {
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [runningStock, setRunningStock] = useState<any>(null);
  const [productList, setProductList] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<IStokReturPayload>>({
    sku: '',
    qty: 0,
    description: '',
  });

  // Load static catalog list from running stock
  useEffect(() => {
    if (isOpen) {
      const loadCatalog = async () => {
        try {
          const allStock = await stokBerjalanService.getAll(true);
          setProductList(allStock);
        } catch (e) {
          console.error('Failed to load stock catalog:', e);
        }
      };
      loadCatalog();
    }
  }, [isOpen]);

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      setRunningStock(null);
      setFormData({
        sku: '',
        qty: 0,
        description: '',
      });
    }
  }, [isOpen]);

  // Handle product selection
  const handleSelectSku = async (sku: string) => {
    const item = productList.find((p) => p.sku === sku);
    
    let stock = null;
    if (sku) {
      try {
        stock = await stokBerjalanService.getBySku(sku);
      } catch (e) {
        console.error('Failed to load item stock:', e);
      }
    }
    setRunningStock(stock);

    if (item) {
      setFormData((prev) => ({
        ...prev,
        sku: item.sku,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        sku: sku,
      }));
    }
  };

  // Autocomplete Select Options mapping
  const skuOptions = useMemo(() => {
    return productList.map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.sku }));
  }, [productList]);

  const pricePerUnitIn = useMemo(() => {
    if (!runningStock) return 0;
    return runningStock.price_per_unit_running || runningStock.base_price || 0;
  }, [runningStock]);

  const totalValuationIn = useMemo(() => {
    const qty = Number(formData.qty || 0);
    return qty * pricePerUnitIn;
  }, [formData.qty, pricePerUnitIn]);

  const handleSave = async () => {
    if (!formData.sku || !formData.qty || Number(formData.qty) <= 0) {
      swalToast.fire({ icon: 'warning', title: 'Mohon isi SKU dan Kuantitas Retur dengan benar' });
      return;
    }

    const confirm = await swalConfig.fire({
      title: 'Konfirmasi Simpan Stok Retur',
      text: 'Stok retur yang disimpan akan secara langsung mengembalikan/menambah kuantitas di master data Stok Berjalan. Dan kuantitas retur ini juga dicatat dalam perhitungan stok running. Apakah Anda yakin?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setIsProcessing(true);
    try {
      const payload: IStokReturPayload = {
        sku: formData.sku || '',
        qty: Number(formData.qty || 0),
        category: runningStock?.category || '',
        name: runningStock?.name || '',
        unit: runningStock?.unit || '',
        price_per_unit_in: pricePerUnitIn,
        total_price_in: totalValuationIn,
        description: formData.description || '',
      };

      const result = await stokReturService.create(payload);
      if (result) {
        swalToast.fire({ icon: 'success', title: 'Transaksi Stok Retur berhasil dicatat' });
        onSuccess();
        onClose();
      } else {
        swalToast.fire({ icon: 'error', title: 'Gagal mencatat transaksi stok retur' });
      }
    } catch (e) {
      console.error(e);
      swalToast.fire({ icon: 'error', title: 'Input data tidak valid' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Stok Retur Baru"
      onSubmit={handleSave}
      submitLabel="Simpan Retur"
      cancelLabel="Batal"
      isSubmitDisabled={isProcessing || !formData.sku || !formData.qty || Number(formData.qty) <= 0 || !formData.description?.trim()}
      className="!max-w-[44rem]"
    >
      <div className="flex flex-col gap-[1rem]">
        {/* Info Banner of Selected Product Stock */}
        {runningStock && (
          <div className="hidden bg-[#f0fdf4] p-[0.75rem] rounded-[0.75rem] border border-[#dcfce7] flex items-center justify-between text-TextColorBase">
            <div className="flex flex-col gap-[0.125rem]">
              <span className="text-[0.6875rem] text-[#166534] font-bold uppercase tracking-wider">
                Persediaan Saat Ini (Stok Berjalan)
              </span>
              <span className="text-[0.8125rem] font-bold text-[#166534]">
                {runningStock.qty_current || 0} {runningStock.unit} @{' '}
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
            <Label id="label-sku" required>
              SKU Produk
            </Label>
            <CustomValueDropdown
              id="input-sku"
              placeholder="Pilih atau masukkan SKU..."
              options={skuOptions}
              value={formData.sku}
              onChange={handleSelectSku}
              disabled={false}
            />
          </div>

          <div className="space-y-[0.375rem]">
            <Label id="label-name">
              Nama Produk
            </Label>
            <input
              id="input-name"
              type="text"
              value={runningStock?.name || ''}
              placeholder="Nama produk terisi otomatis..."
              disabled
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none"
            />
          </div>

          {/* Row 2: Kategori & Sub Kategori */}
          <div className="space-y-[0.375rem]">
            <Label id="label-kategori">
              Kategori
            </Label>
            <input
              id="input-kategori"
              type="text"
              value={runningStock?.category || ''}
              placeholder="Kategori terisi otomatis..."
              disabled
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-[0.375rem]">
            <Label id="label-sub-category">Sub Kategori</Label>
            <input
              id="input-sub-category"
              type="text"
              value={runningStock?.sub_category || ''}
              placeholder="Sub Kategori terisi otomatis..."
              disabled
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none"
            />
          </div>

          {/* Row 3: Unit & Kuantitas Retur */}
          <div className="space-y-[0.375rem]">
            <Label id="label-unit">
              Unit
            </Label>
            <input
              id="input-unit"
              type="text"
              value={runningStock?.unit || ''}
              placeholder="Unit terisi otomatis..."
              disabled
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-[0.375rem]">
            <Label id="label-qty" required>
              Kuantitas Retur
            </Label>
            <NumberInput
              id="input-qty"
              placeholder="Masukkan kuantitas retur..."
              value={formData.qty}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData((p) => ({
                  ...p,
                  qty: val,
                }));
              }}
            />
          </div>

          {/* Row 4: Pricing Info */}
          <div className="hidden space-y-[0.375rem]">
            <Label id="label-price-per-unit-in">
              Harga Satuan Masuk (Referensi)
            </Label>
            <PriceInput
              id="input-price-per-unit-in"
              placeholder="0"
              value={Math.round(pricePerUnitIn)}
              disabled
              className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
            />
          </div>

          <div className="hidden space-y-[0.375rem]">
            <Label id="label-total-price-in">
              Total Nilai Retur
            </Label>
            <PriceInput
              id="input-total-price-in"
              placeholder="0"
              value={Math.round(totalValuationIn)}
              disabled
              className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
            />
          </div>

          {/* Row 5: Keterangan (Spans full width) */}
          <div className="sm:col-span-2 space-y-[0.375rem]">
            <Label id="label-description" required>Alasan Retur / Deskripsi</Label>
            <LongTextInput
              id="input-description"
              placeholder="Tambahkan alasan detail pengembalian stok..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
