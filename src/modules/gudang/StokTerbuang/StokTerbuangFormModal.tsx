import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { NumberInput, LongTextInput, PriceInput } from '../../../ui/components/elements/Inputs';
import { CustomValueDropdown } from '../../../ui/components/elements/Dropdown';
import { Label } from '../../../ui/components/elements/Label';
import { MultipleUploadInput } from '../../../ui/components/elements/UploadInput';
import { stokTerbuangService } from '../../../logic/services/stokTerbuangService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { formatCurrency } from '../../../logic/utils/data';
import { IStokTerbuangPayload } from '../../../logic/types/ITs_StokTerbuang';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface StokTerbuangFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id?: string;
}

export const StokTerbuangFormModal: React.FC<StokTerbuangFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  id = "stok-terbuang-form-modal",
}) => {
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [runningStock, setRunningStock] = useState<any>(null);
  const [productList, setProductList] = useState<any[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<Partial<IStokTerbuangPayload>>({
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
      setAttachedFiles([]);
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

  const pricePerUnitOut = useMemo(() => {
    if (!runningStock) return 0;
    return runningStock.price_per_unit_running || runningStock.base_price || 0;
  }, [runningStock]);

  const totalValuationOut = useMemo(() => {
    const qty = Number(formData.qty || 0);
    return qty * pricePerUnitOut;
  }, [formData.qty, pricePerUnitOut]);

  // Handle file list updates from MultiUploadInput
  const handleFilesChange = (files: File[]) => {
    setAttachedFiles(files);
  };

  const handleSave = async () => {
    if (!formData.sku || !formData.qty || Number(formData.qty) <= 0) {
      swalToast.fire({ icon: 'warning', title: 'Mohon isi SKU dan Kuantitas Terbuang dengan benar' });
      return;
    }

    if (runningStock && Number(formData.qty) > (runningStock.qty_current || 0)) {
      swalToast.fire({
        icon: 'error',
        title: 'Kuantitas Melebihi Persediaan',
        text: `Jumlah yang diajukan untuk dibuang (${formData.qty}) melebihi total persediaan berjalan saat ini (${runningStock.qty_current || 0} ${runningStock.unit}).`
      });
      return;
    }

    const confirm = await swalConfig.fire({
      title: 'Konfirmasi Catat Stok Terbuang',
      text: 'Stok terbuang yang disimpan akan secara langsung memotong/mengurangi kuantitas di master data Stok Berjalan secara sistematis. Apakah Anda yakin?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Catat',
      cancelButtonText: 'Batal'
    });
    if (!confirm.isConfirmed) return;

    setIsProcessing(true);
    try {
      const payload: IStokTerbuangPayload = {
        sku: formData.sku || '',
        qty: Number(formData.qty || 0),
        category: runningStock?.category || '',
        name: runningStock?.name || '',
        unit: runningStock?.unit || '',
        price_per_unit_out: pricePerUnitOut,
        total_price_out: totalValuationOut,
        description: formData.description || '',
      };

      const result = await stokTerbuangService.create(payload, attachedFiles);
      if (result) {
        swalToast.fire({ icon: 'success', title: 'Transaksi Stok Terbuang berhasil dicatat' });
        onSuccess();
        onClose();
      } else {
        swalToast.fire({ icon: 'error', title: 'Gagal mencatat transaksi stok terbuang' });
      }
    } catch (e: any) {
      console.error(e);
      swalToast.fire({ icon: 'error', title: 'Gagal menyimpan data', text: e.message || 'Terjadi kesalahan' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Stok Terbuang"
      onSubmit={handleSave}
      submitLabel="Catat Discard"
      cancelLabel="Batal"
      isSubmitDisabled={isProcessing || !formData.sku || !formData.qty || Number(formData.qty) <= 0 || !formData.description?.trim() || (!!runningStock && Number(formData.qty) > (runningStock.qty_current || 0))}
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
            <Label id={`${id}-label-sku`} required>
              SKU Produk
            </Label>
            <CustomValueDropdown
              id={`${id}-input-sku`}
              placeholder="Pilih atau masukkan SKU..."
              options={skuOptions}
              value={formData.sku}
              onChange={handleSelectSku}
              disabled={false}
            />
          </div>

          <div className="space-y-[0.375rem]">
            <Label id={`${id}-label-name`}>
              Nama Produk
            </Label>
            <input
              id={`${id}-input-name`}
              type="text"
              value={runningStock?.name || ''}
              placeholder="Nama produk terisi otomatis..."
              disabled
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none"
            />
          </div>

          {/* Row 2: Kategori & Sub Kategori */}
          <div className="space-y-[0.375rem]">
            <Label id={`${id}-label-kategori`}>
              Kategori
            </Label>
            <input
              id={`${id}-input-kategori`}
              type="text"
              value={runningStock?.category || ''}
              placeholder="Kategori terisi otomatis..."
              disabled
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-[0.375rem]">
            <Label id={`${id}-label-sub-category`}>Sub Kategori</Label>
            <input
              id={`${id}-input-sub-category`}
              type="text"
              value={runningStock?.sub_category || ''}
              placeholder="Sub Kategori terisi otomatis..."
              disabled
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none"
            />
          </div>

          {/* Row 3: Unit & Kuantitas Terbuang */}
          <div className="space-y-[0.375rem]">
            <Label id={`${id}-label-unit`}>
              Unit
            </Label>
            <input
              id={`${id}-input-unit`}
              type="text"
              value={runningStock?.unit || ''}
              placeholder="Unit terisi otomatis..."
              disabled
              className="w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-[#1e3a34]/25 bg-gray-100/50 cursor-not-allowed text-[#64748b] leading-normal font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-[0.375rem]">
            <Label id={`${id}-label-qty`} required>
              Kuantitas Terbuang
            </Label>
            <NumberInput
              id={`${id}-input-qty`}
              placeholder="Masukkan kuantitas terbuang..."
              value={formData.qty}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData((p) => ({
                  ...p,
                  qty: val,
                }));
              }}
            />
            {!!runningStock && Number(formData.qty) > (runningStock.qty_current || 0) && (
              <p className="text-[0.75rem] text-red-500 font-medium">
                Maksimal kuantitas adalah {runningStock.qty_current || 0}
              </p>
            )}
          </div>

          {/* Row 4: Pricing Info */}
          <div className="hidden space-y-[0.375rem]">
            <Label id={`${id}-label-price-per-unit-out`}>
              Ekspektasi Harga Satuan
            </Label>
            <PriceInput
              id={`${id}-input-price-per-unit-out`}
              placeholder="0"
              value={Math.round(pricePerUnitOut)}
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
              placeholder="0"
              value={Math.round(totalValuationOut)}
              disabled
              className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
            />
          </div>

          {/* Row 5: Bukti Upload (Spans full width) */}
          <div className="sm:col-span-2 space-y-[0.375rem]">
            <Label id={`${id}-label-upload`}>Unggah Bukti Fisik</Label>
            <div className="w-full">
              <MultipleUploadInput
                id={`${id}-multi-upload`}
                onFilesChange={handleFilesChange}
                maxFiles={5}
              />
            </div>
          </div>

          {/* Row 6: Keterangan (Spans full width) */}
          <div className="sm:col-span-2 space-y-[0.375rem]">
            <Label id={`${id}-label-description`} required>Keterangan / Alasan Pembuangan</Label>
            <LongTextInput
              id={`${id}-input-description`}
              placeholder="Tambahkan alasan detail pembuangan stok..."
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
