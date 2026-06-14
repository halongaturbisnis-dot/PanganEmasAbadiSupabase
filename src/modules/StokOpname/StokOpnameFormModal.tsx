import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../ui/components/common/Modal';
import { NumberInput, LongTextInput, PriceInput } from '../../ui/components/elements/Inputs';
import { CustomValueDropdown } from '../../ui/components/elements/Dropdown';
import { Label } from '../../ui/components/elements/Label';
import { IStokOpnamePayload } from '../../logic/types/ITs_StokOpname';
import { stokOpnameService } from '../../logic/services/stokOpnameService';
import { stokBerjalanService } from '../../logic/services/stokBerjalanService';
import { swalConfig, toast as swalToast } from '../../logic/utils/swalConfig';
import { formatCurrency } from '../../logic/utils/data';

interface StokOpnameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id?: string;
}

export const StokOpnameFormModal: React.FC<StokOpnameFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  id = "stok-opname-form"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [runningStock, setRunningStock] = useState<any>(null);
  const [productList, setProductList] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<IStokOpnamePayload>>({
    sku: '',
    qty_system: 0,
    qty_actual: undefined,
    notes: ''
  });

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

  useEffect(() => {
    if (isOpen) {
      setRunningStock(null);
      setFormData({
        sku: '',
        qty_system: 0,
        qty_actual: undefined,
        notes: ''
      });
    }
  }, [isOpen]);

  const skuOptions = useMemo(() => {
    return productList.map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.sku }));
  }, [productList]);

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

    setFormData((prev) => ({
      ...prev,
      sku: item?.sku || sku,
      qty_system: stock?.qty_current || 0,
      qty_actual: undefined // Jangan auto-isi sesuai qty sistem untuk mencegah bias
    }));
  };

  const pricePerUnit = useMemo(() => {
    if (!runningStock) return 0;
    return runningStock.price_per_unit_running || runningStock.base_price || 0;
  }, [runningStock]);

  const totalValuasiAktual = useMemo(() => {
    const qty = Number(formData.qty_actual || 0);
    return qty * pricePerUnit;
  }, [formData.qty_actual, pricePerUnit]);

  const totalValuasiSelisih = useMemo(() => {
    const diff = Number(formData.qty_actual || 0) - Number(formData.qty_system || 0);
    return diff * pricePerUnit;
  }, [formData.qty_actual, formData.qty_system, pricePerUnit]);

  const handleSave = async () => {
    if (!formData.sku || formData.qty_actual === undefined) {
      swalToast.fire({ icon: 'warning', title: 'Mohon lengkapi SKU dan Stok Aktual Baru' });
      return;
    }

    const qtyDiff = Number(formData.qty_actual) - Number(formData.qty_system);
    const diffText = qtyDiff > 0 ? `Bertambah ${qtyDiff}` : qtyDiff < 0 ? `Berkurang ${Math.abs(qtyDiff)}` : `Tidak ada selisih`;

    const confirm = await swalConfig.fire({
      title: 'Konfirmasi Stok Opname',
      html: `Apakah Anda yakin ingin mencatat Stok Opname untuk <b>${runningStock?.name || formData.sku}</b>?<br/><br/><span class="text-[0.75rem] text-[#b91c1c] font-bold">Pencatatan ini bersifat permanen dan tidak dapat diedit/dihapus.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Catat Opname',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setIsProcessing(true);
    try {
      const payload: IStokOpnamePayload = {
        ...formData,
        sku: formData.sku || '',
        qty_system: formData.qty_system || 0,
        qty_actual: formData.qty_actual || 0,
        harga_per_unit: pricePerUnit,
        total_valuasi_aktual: totalValuasiAktual,
        total_valuasi_selisih: totalValuasiSelisih
      };

      const res = await stokOpnameService.create(payload);

      if (res) {
        swalToast.fire({ icon: 'success', title: 'Stok Opname berhasil dicatat!' });
        onSuccess();
        onClose();
      } else {
        swalToast.fire({ icon: 'error', title: 'Gagal mencatat Stok Opname' });
      }
    } catch (error) {
      console.error(error);
      swalToast.fire({ icon: 'error', title: 'Terjadi kesalahan sistem' });
    } finally {
      setIsProcessing(false);
    }
  };

  const diff = Number(formData.qty_actual || 0) - Number(formData.qty_system || 0);

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title="Pencatatan Stok Opname (Live Audit)"
      onSubmit={handleSave}
      submitLabel="Catat Stok Opname"
      cancelLabel="Batal"
      isSubmitDisabled={isProcessing || !formData.sku || formData.qty_actual === undefined}
      className="!max-w-[44rem]"
    >
      <div className="flex flex-col gap-[1rem]">
        {/* Info Banner of Selected Product Stock */}
        {/*{runningStock && (
          <div className="hidden bg-[#f0fdf4] p-[0.75rem] rounded-[0.75rem] border border-[#dcfce7] flex items-center justify-between text-TextColorBase">
            <div className="flex flex-col gap-[0.125rem]">
              <span className="text-[0.6875rem] text-[#166534] font-bold uppercase tracking-wider">
                Persediaan Sistem (Stok Berjalan)
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
        )}*/}

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
              value={formData.sku || ''}
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

          {/* Row 3: Stok Sistem Saat Ini & Stok Aktual Baru */}
          <div className="hidden space-y-[0.375rem]">
            <Label id={`${id}-label-qty-system`}>
              Stok Sistem Saat Ini {runningStock?.unit ? `(${runningStock.unit})` : ''}
            </Label>
            <NumberInput
              id={`${id}-input-qty-system`}
              placeholder="Pilih SKU..."
              value={formData.qty_system !== undefined && formData.sku ? formData.qty_system : ''}
              disabled
              className="hidden bg-gray-100/50 cursor-not-allowed text-[#64748b] opacity-[0.7]"
            />
          </div>

          <div className="space-y-[0.375rem]">
            <Label id={`${id}-label-qty-actual`} required className="text-ColorPrimary">
              Stok Aktual {runningStock?.unit ? `(${runningStock.unit})` : ''}
            </Label>
            <NumberInput
              id={`${id}-input-qty-actual`}
              placeholder="0"
              value={formData.qty_actual}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData((p) => ({ ...p, qty_actual: val }));
              }}
              className="border-ColorPrimary/50 focus:border-ColorPrimary focus:ring-ColorPrimary font-bold"
            />
            {formData.sku && diff !== 0 && (
              <p className={`hidden text-[0.75rem] font-bold text-left pt-1 ${diff > 0 ? "text-[#166534]" : "text-[#b91c1c]"}`}>
                Selisih: {diff > 0 ? '+' : ''}{diff}
              </p>
            )}
          </div>

          {/* Row 4: Pricing Info */}
          <div className="hidden space-y-[0.375rem]">
            <Label id={`${id}-label-price-per-unit`}>
              Harga Per Unit
            </Label>
            <PriceInput
              id={`${id}-input-price-per-unit`}
              placeholder="0"
              value={Math.round(pricePerUnit)}
              disabled
              className="hidden bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
            />
          </div>

          <div className="hidden space-y-[0.375rem]">
            <Label id={`${id}-label-total-valuasi`}>
              Total Valuasi Selisih
            </Label>
            <PriceInput
              id={`${id}-input-total-valuasi`}
              placeholder="0"
              value={Math.round(totalValuasiSelisih)}
              disabled
              className="hidden bg-gray-100/50 cursor-not-allowed opacity-[0.7]"
            />
          </div>

          {/* Row 5: Keterangan (Spans full width) */}
          <div className="sm:col-span-2 space-y-[0.375rem]">
            <Label id={`${id}-label-notes`}>Keterangan / Alasan Audit (Opsional)</Label>
            <LongTextInput
              id={`${id}-input-notes`}
              placeholder="Contoh: Stok menyusut karena tumpah, atau Salah hitung pada penerimaan sebelumnya..."
              value={formData.notes || ''}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Row 6: Warning Banner */}
          <div className="sm:col-span-2 bg-[#fee2e2] text-[#991b1b] text-[0.75rem] p-[0.75rem] rounded-[0.5rem] font-medium border border-[#fecaca] flex items-center gap-[0.5rem]">
            <span className="font-bold uppercase tracking-wider bg-[#fca5a5] text-white px-2 py-0.5 rounded-sm">Awas!</span> 
            Tindakan Stok Opname bersifat mutlak dan memotong/menambah kuantitas stok berjalan secara seketika berdasarkan selisih aktual.
          </div>
        </div>
      </div>
    </Modal>
  );
};


