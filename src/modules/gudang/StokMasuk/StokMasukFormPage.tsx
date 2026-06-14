import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { FormShell } from '../../../ui/components/common/shells/FormShell';
import { Card } from '../../../ui/components/common/Card';
import { TextInput, NumberInput, LongTextInput } from '../../../ui/components/elements/Inputs';
import { CustomDropdown } from '../../../ui/components/elements/Dropdown';
import { stokMasukService } from '../../../logic/services/stokMasukService';
import { stokBerjalanService } from '../../../logic/services/stokBerjalanService';
import { IStokMasuk } from '../../../logic/types/ITs_StokMasuk';
import { Box, Calculator, Info, AlertCircle, TrendingUp } from 'lucide-react';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { formatCurrency } from '../../../logic/utils/data';
import { Label } from '../../../ui/components/elements/Label';
import { cn } from '../../../logic/utils/cn';

/**
 * STOK MASUK FORM PAGE
 * Menangani pembuatan (Create) data Stok Masuk.
 * Secara otomatis menghitung Moving Average Price berdasarkan kondisi Stok Berjalan saat ini.
 */
export const StokMasukFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueInfo, setQueueInfo] = useState<any>(null);
  const [runningStock, setRunningStock] = useState<any>(null);
  const [productList, setProductList] = useState<any[]>([]); // For manual selection
  const [isManual, setIsManual] = useState(false);
  
  // Form Values
  const [formData, setFormData] = useState<Partial<IStokMasuk>>({
    qty_in: 0,
    price_per_unit_in: 0,
    total_price_in: 0,
    new_running_stock_price_per_unit: 0,
    description: '',
  });

  // Load Context Data
  useEffect(() => {
    const loadContext = async () => {
      setIsLoading(true);
      try {
        const receivingId = searchParams.get('receiving_id');
        const processingId = searchParams.get('processing_id');
        const type = searchParams.get('type');

        if (id) {
          const existing = await stokMasukService.getById(id);
          if (existing) {
            setFormData(existing);
            const stock = await stokBerjalanService.getBySku(existing.sku);
            setRunningStock(stock);
          }
        } else if (type === 'manual') {
          setIsManual(true);
          const allStock = await stokBerjalanService.getAll(true);
          setProductList(allStock);
        } else if (receivingId) {
          const info = await stokMasukService.getQueueItemByIds(receivingId, processingId);
          if (info) {
            setQueueInfo(info);
            const stock = await stokBerjalanService.getBySku(info.sku);
            setRunningStock(stock);
            
            // Sisa kuantitas yang bisa dimasukkan
            const maxQty = Number(info.qty_max) || 0;
            const alreadyQty = Number(info.qty_already_in) || 0;
            const remainingQty = maxQty - alreadyQty;

            // Definisikan valuasi awal dari penerimaan/proses
            setFormData({
              purchase_id: info.purchase_id,
              purchase_product_id: info.purchase_product_id,
              receiving_id: info.receiving_id,
              processing_id: info.processing_id,
              sku: info.sku,
              name: info.name,
              category: info.category,
              sub_category: info.sub_category,
              unit: info.unit,
              qty_in: remainingQty,
              price_per_unit_in: info.price_per_unit_in,
              total_price_in: remainingQty * info.price_per_unit_in,
              description: '',
            });
          }
        } else {
          navigate('/gudang/stok-masuk');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadContext();
  }, [id, searchParams, navigate]);

  // Handle Product Selection for Manual
  const handleProductSelect = async (sku: string) => {
    const item = productList.find(p => p.sku === sku);
    if (!item) return;

    const stock = await stokBerjalanService.getBySku(sku);
    setRunningStock(stock);

    setFormData(prev => ({
      ...prev,
      sku: item.sku,
      name: item.name,
      category: item.category,
      sub_category: item.sub_category,
      unit: item.unit,
      price_per_unit_in: item.price_per_unit_running || 0,
      qty_in: 0,
      total_price_in: 0
    }));
  };

  // Kalkulasi Moving Average Live (Simulator)
  const simulatedMA = React.useMemo(() => {
    const qtyIn = Number(formData.qty_in || 0);
    const totalPriceIn = Number(formData.total_price_in || 0);
    
    if (!runningStock) return formData.price_per_unit_in || 0;
    
    const currentQty = Number(runningStock.qty_current || 0);
    const currentPrice = Number(runningStock.price_per_unit_running || 0);
    
    const totalNewQty = currentQty + qtyIn;
    if (totalNewQty <= 0) return formData.price_per_unit_in || 0;
    
    return ((currentQty * currentPrice) + totalPriceIn) / totalNewQty;
  }, [formData.qty_in, formData.total_price_in, formData.price_per_unit_in, runningStock]);

  useEffect(() => {
    setFormData(p => ({ ...p, new_running_stock_price_per_unit: simulatedMA }));
  }, [simulatedMA]);

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      let result;
      if (id) {
        result = await stokMasukService.update(id, formData);
      } else {
        result = await stokMasukService.create(formData as any);
      }

      if (result) {
        swalToast.fire({ icon: 'success', title: 'Stok masuk berhasil dicatat' });
        navigate('/gudang/stok-masuk');
      } else {
        swalToast.fire({ icon: 'error', title: 'Gagal mencatat stok masuk' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return null; // Or skeleton

  return (
    <FormShell
      title={id ? "Edit Stok Masuk" : "Catat Stok Masuk"}
      id="stok-masuk-form-shell"
      onSave={handleSave}
      isLoading={isProcessing}
      isSaveDisabled={!formData.sku || !formData.qty_in}
      onCancel={() => navigate('/gudang/stok-masuk')}
    >
      <div className="flex flex-col gap-[1.5rem]">
        {/* Manual Selection (Only for Create + Manual) */}
        {isManual && !id && (
          <Card id="manual-selection-card" title="Pilih Produk Master (Manual)" icon={Box}>
            <div className="space-y-2">
              <Label id="label-product-select">Cari Produk dari Stok Berjalan</Label>
              <CustomDropdown
                id="product-select"
                placeholder="Ketik SKU atau Nama Produk..."
                options={productList.map(p => ({ label: `${p.sku} - ${p.name}`, value: p.sku }))}
                value={formData.sku}
                onChange={handleProductSelect}
              />
              <p className="text-[0.7rem] text-[#64748b] italic">
                * Gunakan mode manual hanya jika produk tidak berasal dari alur Penerimaan/QC.
              </p>
            </div>
          </Card>
        )}

        {/* Info Card - Product Details */}
        {(formData.sku || isManual) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1rem] animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-[#f8fafc] p-[1.25rem] rounded-[1rem] border border-[#e2e8f0] flex items-center gap-[1rem]">
              <div className="w-[3rem] h-[3rem] bg-[#eff6ff] rounded-[0.75rem] flex items-center justify-center shrink-0">
                <Box size={24} className="text-[#3b82f6]" />
              </div>
              <div className="flex flex-col min-w-0">
                 <h3 className="text-[1rem] font-bold text-[#1e293b] truncate">
                  {formData.name || (isManual ? 'Pilih Produk Terlebih Dahulu' : 'Nama Produk')}
                </h3>
                <p className="text-[0.75rem] text-[#64748b] font-mono">SKU: {formData.sku || '-'}</p>
                {formData.category && (
                  <p className="text-[0.7rem] text-[#64748b] mt-0.5 uppercase tracking-wider font-semibold">
                    {formData.category} / {formData.sub_category}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#f0fdf4] p-[1.25rem] rounded-[1rem] border border-[#dcfce7] flex items-center gap-[1rem]">
              <div className="w-[3rem] h-[3rem] bg-[#dcfce7] rounded-[0.75rem] flex items-center justify-center shrink-0">
                <TrendingUp size={24} className="text-[#16a34a]" />
              </div>
              <div className="flex flex-col">
                <p className="text-[0.7rem] text-[#166534] font-bold uppercase tracking-widest">Stok Berjalan Saat Ini</p>
                <h3 className="text-[1.125rem] font-bold text-[#166534]">
                  {runningStock?.qty_current || 0} <span className="text-[0.875rem] font-normal">{formData.unit}</span>
                </h3>
                <p className="text-[0.75rem] text-[#166534]/70">
                  Harga: {formatCurrency(runningStock?.price_per_unit_running || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-[1.5rem]">
          {/* Main Form Fields */}
          <div className="md:col-span-7 space-y-[1.25rem]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1rem]">
              <div className="space-y-[0.5rem]">
                <Label id="label-qty-in" required>KUANTITAS MASUK ({formData.unit})</Label>
                <NumberInput 
                  id="input-qty-in"
                  value={formData.qty_in}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData(p => ({ 
                      ...p, 
                      qty_in: val,
                      total_price_in: val * (p.price_per_unit_in || 0)
                    }));
                  }}
                />
              </div>
              <div className="space-y-[0.5rem]">
                <Label id="label-price-unit" required>HARGA SATUAN MASUK</Label>
                <NumberInput 
                  id="input-price-unit"
                  value={formData.price_per_unit_in}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    setFormData(p => ({ 
                      ...p, 
                      price_per_unit_in: price,
                      total_price_in: (p.qty_in || 0) * price 
                    }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-[0.5rem]">
              <Label id="label-total-price">TOTAL VALUASI MASUK</Label>
              <div className="p-[1rem] bg-gray-50 border border-gray-200 rounded-[0.75rem] font-bold text-[1.125rem] text-[#1e293b]">
                {formatCurrency(formData.total_price_in || 0)}
              </div>
            </div>

            <div className="space-y-[0.5rem]">
              <Label id="label-desc">KETERANGAN / CATATAN</Label>
              <LongTextInput 
                id="input-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Tambahkan catatan jika diperlukan..."
              />
            </div>
          </div>

          {/* Right Area: Valuation Result */}
          <div className="md:col-span-5">
            <div className="bg-[#1e293b] rounded-[1.25rem] p-[1.5rem] text-white space-y-[1.5rem] shadow-xl relative overflow-hidden">
               {/* Background pattern */}
              <div className="absolute top-0 right-0 w-[8rem] h-[8rem] bg-white/5 rounded-full -mr-[4rem] -mt-[4rem]" />
              
              <div className="flex items-center gap-[0.75rem]">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Calculator size={20} className="text-[#38bdf8]" />
                </div>
                <div>
                  <h4 className="text-[0.875rem] font-bold">Simulator Moving Average</h4>
                  <p className="text-[0.6rem] text-white/50 uppercase tracking-widest font-bold">Perhitungan Valuasi Baru</p>
                </div>
              </div>

              <div className="space-y-[1rem]">
                <div className="flex justify-between items-end border-b border-white/10 pb-[1rem]">
                  <span className="text-[0.75rem] text-white/60">Valuasi Stok Lama</span>
                  <span className="text-[0.875rem] font-mono">
                    {formatCurrency((runningStock?.qty_current || 0) * (runningStock?.price_per_unit_running || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-[1rem]">
                  <span className="text-[0.75rem] text-white/60">Valuasi Masuk</span>
                  <span className="text-[0.875rem] font-mono">
                    + {formatCurrency(formData.total_price_in || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-end pb-[0.5rem]">
                  <span className="text-[0.75rem] text-white/60">Total Kuantitas Baru</span>
                  <span className="text-[0.875rem] font-mono">
                    {(runningStock?.qty_current || 0) + (formData.qty_in || 0)} {formData.unit}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 p-[1.25rem] rounded-[1rem] border border-white/10">
                <span className="text-[0.625rem] text-white/50 block mb-1 uppercase font-bold tracking-widest">Harga Rata-Rata Baru (Predicted)</span>
                <div className="text-[1.5rem] font-bold text-[#38bdf8]">
                  {formatCurrency(formData.new_running_stock_price_per_unit || 0)}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[0.625rem] text-white/40 italic">
                  <Info size={12} />
                  Dihitung otomatis saat penyimpanan sukses
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-[1rem] rounded-[1rem] flex gap-3">
                <AlertCircle size={20} className="text-amber-400 shrink-0 mt-1" />
                <p className="text-[0.7rem] text-amber-200/80 leading-relaxed">
                  Pencatatan stok masuk akan langsung mempengaruhi <strong>Stok Berjalan</strong> dan memperbarui <strong>Working Price</strong> di master data. Pastikan kuantitas benar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormShell>
  );
};

export default StokMasukFormPage;
