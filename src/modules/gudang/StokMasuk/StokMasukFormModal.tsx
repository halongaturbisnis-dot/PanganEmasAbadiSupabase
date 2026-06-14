import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { NumberInput, LongTextInput, PriceInput } from '../../../ui/components/elements/Inputs';
import { CustomValueDropdown } from '../../../ui/components/elements/Dropdown';
import { Label } from '../../../ui/components/elements/Label';
import { stokMasukService } from '../../../logic/services/stokMasukService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { formatCurrency } from '../../../logic/utils/data';
import { IStokMasuk } from '../../../logic/types/ITs_StokMasuk';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { cn } from '../../../logic/utils/cn';

interface StokMasukFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  queueItem?: any; // If recorded from a queue row
}

export const StokMasukFormModal: React.FC<StokMasukFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  queueItem,
}) => {
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [runningStock, setRunningStock] = useState<any>(null);
  const [productList, setProductList] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<IStokMasuk>>({
    sku: '',
    name: '',
    category: '',
    sub_category: '',
    unit: '',
    qty_in: 0,
    price_per_unit_in: 0,
    total_price_in: 0,
    new_running_stock_price_per_unit: 0,
    description: '',
  });

  // Load static catalog lists for dropdown menu autocompletes
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

  // Pre-populate data when opening with an Antrian Masuk queue item
  useEffect(() => {
    if (isOpen && queueItem) {
      const loadQueueInfo = async () => {
        try {
          // Force user to choose SKU first
          setRunningStock(null);
          const maxQty = Number(queueItem.qty_max) || 0;
          const alreadyQty = Number(queueItem.qty_already_in) || 0;
          const remainingQty = maxQty - alreadyQty;
          
          setFormData({
            purchase_id: queueItem.purchase_id,
            purchase_product_id: queueItem.purchase_product_id,
            receiving_id: queueItem.receiving_id,
            processing_id: queueItem.processing_id,
            sku: '',
            name: '',
            category: '',
            sub_category: '',
            unit: '',
            qty_in: remainingQty,
            price_per_unit_in: queueItem.price_per_unit_in || 0,
            total_price_in: remainingQty * (queueItem.price_per_unit_in || 0),
            description: '',
          });
        } catch (e) {
          console.error('Failed to initialize queue info:', e);
        }
      };
      loadQueueInfo();
    } else if (isOpen && !queueItem) {
      // Manual reset
      setRunningStock(null);
      setFormData({
        sku: '',
        name: '',
        category: '',
        sub_category: '',
        unit: '',
        qty_in: 0,
        price_per_unit_in: 0,
        total_price_in: 0,
        new_running_stock_price_per_unit: 0,
        description: '',
      });
    }
  }, [isOpen, queueItem]);

  // Trigger when SKU is changed manually
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
        name: item.name,
        category: item.category,
        sub_category: item.sub_category || '',
        unit: item.unit,
        price_per_unit_in: prev.price_per_unit_in || item.price_per_unit_running || 0,
        total_price_in: prev.total_price_in || (prev.qty_in || 0) * (prev.price_per_unit_in || item.price_per_unit_running || 0),
      }));
    } else {
      if (queueItem) {
        setFormData((prev) => ({
          ...prev,
          sku: sku,
          name: queueItem.name || '',
          category: queueItem.category || '',
          sub_category: queueItem.sub_category || '',
          unit: queueItem.unit || '',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          sku: sku,
          name: '',
          category: '',
          sub_category: '',
          unit: '',
        }));
      }
    }
  };

  // Simulator Moving Average Logic
  const simulatedMA = useMemo(() => {
    const qtyIn = Number(formData.qty_in || 0);
    const totalPriceIn = Number(formData.total_price_in || 0);

    if (!runningStock) return formData.price_per_unit_in || 0;

    const currentQty = Number(runningStock.qty_current || 0);
    const currentPrice = Number(runningStock.price_per_unit_running || 0);

    const totalNewQty = currentQty + qtyIn;
    if (totalNewQty <= 0) return formData.price_per_unit_in || 0;

    return (currentQty * currentPrice + totalPriceIn) / totalNewQty;
  }, [formData.qty_in, formData.total_price_in, formData.price_per_unit_in, runningStock]);

  useEffect(() => {
    setFormData((p) => ({ ...p, new_running_stock_price_per_unit: simulatedMA }));
  }, [simulatedMA]);

  // Autocomplete Select Options mapping
  const skuOptions = useMemo(() => {
    return productList.map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.sku }));
  }, [productList]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(productList.map((p) => p.category).filter(Boolean))).map((c) => ({
      label: c,
      value: c,
    }));
  }, [productList]);

  const subCategoryOptions = useMemo(() => {
    return Array.from(new Set(productList.map((p) => p.sub_category).filter(Boolean))).map((sc) => ({
      label: sc,
      value: sc,
    }));
  }, [productList]);

  const nameOptions = useMemo(() => {
    return Array.from(new Set(productList.map((p) => p.name).filter(Boolean))).map((n) => ({
      label: n,
      value: n,
    }));
  }, [productList]);

  const unitOptions = useMemo(() => {
    return Array.from(new Set(productList.map((p) => p.unit).filter(Boolean))).map((u) => ({
      label: u,
      value: u,
    }));
  }, [productList]);

  const handleSave = async () => {
    if (!formData.sku || !formData.qty_in) {
      swalToast.fire({ icon: 'warning', title: 'Mohon lengkapi SKU dan Kuantitas Masuk' });
      return;
    }

    const confirm = await swalConfig.fire({
      title: 'Konfirmasi Simpan Stok Masuk',
      text: 'Data stok masuk yang sudah disimpan TIDAK DAPAT diubah atau dihapus. Apakah Anda yakin?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setIsProcessing(true);
    try {
      const result = await stokMasukService.create(formData as any);
      if (result) {
        swalToast.fire({ icon: 'success', title: 'Stok masuk berhasil dicatat' });
        onSuccess();
        onClose();
      } else {
        swalToast.fire({ icon: 'error', title: 'Gagal mencatat stok masuk' });
      }
    } catch (e) {
      console.error(e);
      swalToast.fire({ icon: 'error', title: 'Format atau input data tidak valid' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      id="stok-masuk-form-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={queueItem ? 'Catat Stok Masuk (Antrian)' : 'Tambah Stok Masuk (Manual)'}
      onSubmit={handleSave}
      submitLabel="Simpan"
      cancelLabel="Batal"
      isSubmitDisabled={isProcessing || !formData.sku || !formData.qty_in}
      className="!max-w-[44rem]"
    >
      <div className="flex flex-col gap-[1rem]">

        {/* Input fields formatted exactly as sketched */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
          {/* Row 1: SKU & Kategori */}
          <div className="space-y-[0.375rem]">
            <Label id="label-sku" required>
              SKU
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
            <Label id="label-kategori" required>
              Kategori
            </Label>
            <CustomValueDropdown
              id="input-kategori"
              placeholder="Pilih atau masukkan kategori..."
              options={categoryOptions}
              value={formData.category}
              onChange={(val) => setFormData((p) => ({ ...p, category: val }))}
              disabled={!!runningStock}
            />
          </div>

          {/* Row 2: Sub Kategori & Nama Produk */}
          <div className="space-y-[0.375rem]">
            <Label id="label-sub-category">Sub Kategori</Label>
            <CustomValueDropdown
              id="input-sub-category"
              placeholder="Pilih atau masukkan sub kategori..."
              options={subCategoryOptions}
              value={formData.sub_category}
              onChange={(val) => setFormData((p) => ({ ...p, sub_category: val }))}
              disabled={!!runningStock}
            />
          </div>
          <div className="space-y-[0.375rem]">
            <Label id="label-name" required>
              Nama Produk
            </Label>
            <CustomValueDropdown
              id="input-name"
              placeholder="Pilih atau masukkan nama produk..."
              options={nameOptions}
              value={formData.name}
              onChange={(val) => setFormData((p) => ({ ...p, name: val }))}
              disabled={!!runningStock}
            />
          </div>

          {/* Row 3: Unit & Qty Masuk */}
          <div className="space-y-[0.375rem]">
            <Label id="label-unit" required>
              Unit
            </Label>
            <CustomValueDropdown
              id="input-unit"
              placeholder="Pilih atau masukkan unit..."
              options={unitOptions}
              value={formData.unit}
              onChange={(val) => setFormData((p) => ({ ...p, unit: val }))}
              disabled={!!runningStock}
            />
          </div>
          <div className="space-y-[0.375rem]">
            <Label id="label-qty-in" required>
              Qty Masuk
            </Label>
            <NumberInput
              id="input-qty-in"
              placeholder="Masukkan kuantitas..."
              value={formData.qty_in}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData((p) => ({
                  ...p,
                  qty_in: val,
                  total_price_in: val * (p.price_per_unit_in || 0),
                }));
              }}
            />
          </div>

          {/* Row 4: Price per Unit & Total Price */}
          <div className={cn(!queueItem ? "space-y-[0.375rem]" : "hidden")}>
            <Label id="label-price-per-unit-in" required>
              Harga per Unit
            </Label>
            <PriceInput
              id="input-price-per-unit-in"
              placeholder="0"
              value={formData.price_per_unit_in ? Math.round(formData.price_per_unit_in) : 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData((p) => ({
                  ...p,
                  price_per_unit_in: val,
                  total_price_in: Math.round((p.qty_in || 0) * val),
                }));
              }}
              disabled={!!queueItem}
              className={!!queueItem ? "bg-gray-100/50 cursor-not-allowed opacity-[0.7]" : ""}
            />
          </div>
          <div className={cn(!queueItem ? "space-y-[0.375rem]" : "hidden")}>
            <Label id="label-total-price-in" required>
              Total Harga
            </Label>
            <PriceInput
              id="input-total-price-in"
              placeholder="0"
              value={formData.total_price_in ? Math.round(formData.total_price_in) : 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData((p) => {
                  const qty = Number(p.qty_in || 0);
                  const pricePerUnit = qty > 0 ? val / qty : p.price_per_unit_in || 0;
                  return {
                    ...p,
                    total_price_in: val,
                    price_per_unit_in: Math.round(pricePerUnit),
                  };
                });
              }}
              disabled={!!queueItem}
              className={!!queueItem ? "bg-gray-100/50 cursor-not-allowed opacity-[0.7]" : ""}
            />
          </div>

          {/* Row 5: New Price Per Unit & Empty Column */}
          <div className="hidden space-y-[0.375rem]">
            <Label id="label-new-ma-price">Harga Baru per Unit</Label>
            <PriceInput
              id="input-new-ma-price"
              placeholder="0"
              value={formData.new_running_stock_price_per_unit ? Math.round(formData.new_running_stock_price_per_unit) : 0}
              disabled
              className="bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
            />
          </div>
          <div className="hidden sm:block" />

          {/* Row 6: Keterangan (Spans full width) */}
          <div className="sm:col-span-2 space-y-[0.375rem]">
            <Label id="label-description">Keterangan</Label>
            <LongTextInput
              id="input-description"
              placeholder="Tambahkan catatan jika diperlukan..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
