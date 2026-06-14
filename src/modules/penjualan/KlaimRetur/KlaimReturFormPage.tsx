import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { klaimReturService } from '../../../logic/services/klaimReturService';
import { storageService } from '../../../logic/services/storage';
import { ITs_KlaimRetur, ITs_KlaimReturItem } from '../../../logic/types/ITs_KlaimRetur';
import { ITs_Penjualan, ITs_PenjualanProduk } from '../../../logic/types/ITs_Penjualan';
import { TextInput, LongTextInput, NumberInput } from '../../../ui/components/elements/Inputs';
import { DateTimeInput } from '../../../ui/components/elements/DateTimeInput';
import { FixedDropdown } from '../../../ui/components/elements/Dropdown';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../ui/components/common/Table';
import { Trash2, ShoppingBag, Plus, Receipt, List, CheckCircle2, ChevronLeft, Save } from 'lucide-react';
import { formatCurrency } from '../../../logic/utils/data';
import { formatDateTimeLocal } from '../../../logic/utils/date';
import { toast } from 'react-hot-toast';
import { Modal } from '../../../ui/components/common/Modal';
import { MultipleUploadInput } from '../../../ui/components/elements/UploadInput';
import { PrimaryButton, SecondaryButton } from '../../../ui/components/elements/Button';
import { Badge } from '../../../ui/components/elements/Badge';
import { Label } from '../../../ui/components/elements/Label';
import { FormShell } from '../../../ui/components/common/shells/FormShell';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { cn } from '../../../logic/utils/cn';
import { Tabs } from '../../../ui/components/common/Tabs';

export const KlaimReturFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<ITs_KlaimRetur>>({
    datetime: formatDateTimeLocal(),
    status: 'Pending'
  });
  const [items, setItems] = useState<Partial<ITs_KlaimReturItem>[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<ITs_Penjualan[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ITs_PenjualanProduk[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ITs_PenjualanProduk | null>(null);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'claimed'>('available');

  // Modal Item States
  const [itemQty, setItemQty] = useState(0);
  const [itemReason, setItemReason] = useState('');
  const [itemPolicy, setItemPolicy] = useState<'Replace' | 'Refund'>('Refund');
  const [itemProofUrl, setItemProofUrl] = useState('');

  // Storage Rule Integration States
  const [isSaving, setIsSaving] = useState(false);
  const [itemFiles, setItemFiles] = useState<Record<string, File[]>>({});
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);

  const fetchInvoices = useCallback(async (search: string = '') => {
    const data = await klaimReturService.getApprovedInvoices(search);
    setInvoices(data);
  }, []);

  useEffect(() => {
    fetchInvoices();
    if (isEdit) {
      loadData();
    }
  }, [fetchInvoices, isEdit]);

  // Sync Modal States when opened
  useEffect(() => {
    if (isItemModalOpen) {
      if (editingItemIdx !== null && items[editingItemIdx]) {
        const existingItem = items[editingItemIdx]!;
        const prodId = existingItem.penjualan_produk_id;
        setItemQty(existingItem.qty || 0);
        setItemReason(existingItem.reason || '');
        setItemPolicy(existingItem.policy || 'Refund');
        setItemProofUrl(existingItem.proof_url || '');
        if (prodId && itemFiles[prodId]) {
          setCurrentFiles(itemFiles[prodId]);
        } else {
          setCurrentFiles([]);
        }
      } else if (selectedProduct) {
        setItemQty(selectedProduct.qty || 0);
        setItemReason('');
        setItemPolicy('Refund');
        setItemProofUrl('');
        setCurrentFiles([]);
      }
    }
  }, [isItemModalOpen]);

  const loadData = async () => {
    if (!id) return;
    const data = await klaimReturService.getById(id);
    if (data) {
      setFormData(data);
      setItems(data.items || []);
      if (data.penjualan_id) {
        const prods = await klaimReturService.getInvoiceProducts(data.penjualan_id);
        setAvailableProducts(prods);
      }
    }
  };

  const handleInvoiceSelect = async (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    setFormData(prev => ({
      ...prev,
      penjualan_id: inv.id,
      invoice_number: inv.invoice_number,
      customer_id: inv.customer_id
    }));

    const prods = await klaimReturService.getInvoiceProducts(invoiceId);
    setAvailableProducts(prods);
    setItems([]); // Clear items if invoice changed
  };

  const handleAddItem = (product: ITs_PenjualanProduk) => {
    setSelectedProduct(product);
    setEditingItemIdx(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (idx: number) => {
    setEditingItemIdx(idx);
    setSelectedProduct(null);
    setIsItemModalOpen(true);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleModalConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct && editingItemIdx === null) return;

    const existingItem = editingItemIdx !== null ? items[editingItemIdx] : undefined;
    const pricePerUnit = selectedProduct ? selectedProduct.unit_selling_price : (existingItem?.refund_nominal && existingItem?.qty ? Number(existingItem.refund_nominal) / Number(existingItem.qty) : 0);
    const prodId = (selectedProduct?.id || existingItem?.penjualan_produk_id)!;

    const newItem: Partial<ITs_KlaimReturItem> = {
      penjualan_produk_id: prodId,
      name: selectedProduct?.name || existingItem?.name,
      unit: selectedProduct?.unit || existingItem?.unit,
      qty: itemQty,
      reason: itemReason,
      policy: itemPolicy,
      proof_url: itemProofUrl,
      refund_nominal: itemPolicy === 'Refund' ? (Number(pricePerUnit || 0)) * itemQty : 0
    };

    if (currentFiles.length > 0) {
      setItemFiles(prev => ({
        ...prev,
        [prodId]: currentFiles
      }));
    } else if (!itemProofUrl) {
      setItemFiles(prev => {
        const next = { ...prev };
        delete next[prodId];
        return next;
      });
    }

    if (editingItemIdx !== null) {
      const newItems = [...items];
      newItems[editingItemIdx] = newItem;
      setItems(newItems);
      setEditingItemIdx(null);
    } else {
      setItems(prev => [...prev, newItem]);
      toast.success(`${newItem.name} ditambahkan`);
    }

    setIsItemModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.penjualan_id) {
      toast.error('Pilih nomor invoice terlebih dahulu');
      return;
    }
    if (items.length === 0) {
      toast.error('Daftar produk klaim tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Memproses berkas dan menyimpan data...');

    try {
      const updatedItems = [...items];
      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        const prodId = item.penjualan_produk_id;
        
        if (prodId && itemFiles[prodId] && itemFiles[prodId].length > 0) {
          const filesToUpload = itemFiles[prodId];
          toast.loading(`Mengupload bukti untuk ${item.name}...`, { id: loadingToast });
          
          const uploadedUrls: string[] = [];
          for (const fileToUpload of filesToUpload) {
            const uploadRes = await storageService.upload(fileToUpload, 'klaim-retur');
            uploadedUrls.push(uploadRes.url);
          }
          
          const finalUrlString = uploadedUrls.join(',');
          
          if (item.proof_url && item.proof_url.startsWith('https://')) {
            const oldUrls = item.proof_url.split(',');
            for (const oldUrl of oldUrls) {
              if (oldUrl.startsWith('https://') && !oldUrl.startsWith('blob:') && !oldUrl.startsWith('data:')) {
                try {
                  const oldKey = oldUrl.split('.t3.tigrisfiles.io/')[1];
                  if (oldKey) {
                    console.log(`[Storage Cleanup] Deleting old file: ${oldKey}`);
                    await storageService.delete(oldKey);
                  }
                } catch (cleanupErr) {
                  console.warn('[Storage Cleanup Warning] Old file deletion skipped:', cleanupErr);
                }
              }
            }
          }
          
          updatedItems[i] = {
            ...item,
            proof_url: finalUrlString
          };
        }
      }

      let res;
      if (isEdit && id) {
        res = await klaimReturService.update(id, formData, updatedItems);
      } else {
        res = await klaimReturService.create(formData, updatedItems);
      }

      if (res) {
        toast.success(isEdit ? 'Klaim retur diperbarui' : 'Klaim retur berhasil dibuat', { id: loadingToast });
        navigate('/penjualan/klaim-retur');
      } else {
        toast.error('Gagal menyimpan data ke database', { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat mengunggah berkas atau menyimpan data', { id: loadingToast });
    } finally {
      setIsSaving(false);
      toast.dismiss(loadingToast);
    }
  };

  const unclaimedProducts = availableProducts.filter(p => !items.some(item => item.penjualan_produk_id === p.id));
  const isFormValid = !!(formData.penjualan_id && formData.datetime && items.length > 0);
  const isModalValid = !!(itemQty > 0 && itemReason.trim() !== '' && (currentFiles.length > 0 || itemProofUrl));

  return (
    <FormShell
      title={isEdit ? "Ubah Klaim Retur" : "Pengajuan Klaim Retur"}
      subtitle="Input data pengajuan pengembalian barang dari konsumen"
      onSave={handleSubmit}
      onCancel={() => navigate('/penjualan/klaim-retur')}
      onBack={() => navigate('/penjualan/klaim-retur')}
      isLoading={isSaving}
      isSaveDisabled={isSaving || !isFormValid}
    >
      <div className="space-y-[1.5rem] pb-[6rem]">
        {/* Header Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.5rem] bg-white p-[1.5rem] rounded-[1.25rem] border border-slate-200 shadow-sm transition-all duration-300">
          <div className="space-y-[1rem]">
            <div className="space-y-[0.5rem]">
              <Label>Nomor Invoice Penjualan</Label>
              <FixedDropdown
                id="invoice-select"
                options={invoices.map(inv => ({ 
                  value: inv.id, 
                  label: `${inv.invoice_number} - ${inv.customer_name}` 
                }))}
                value={formData.penjualan_id || ''}
                onChange={handleInvoiceSelect}
                placeholder="Cari & Pilih Nomor Invoice"
                searchable
                onSearch={fetchInvoices}
                disabled={isEdit}
              />
            </div>

            <div className="space-y-[0.5rem]">
              <Label>Waktu Pengajuan</Label>
              <DateTimeInput
                id="datetime"
                value={formData.datetime || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, datetime: e.target.value }))}
                onClick={() => {
                  const now = formatDateTimeLocal();
                  setFormData(prev => ({ ...prev, datetime: now }));
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-[1rem]">
            <div className="space-y-[0.5rem]">
              <Label>Keterangan</Label>
              <LongTextInput
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Keterangan tambahan untuk pengajuan ini..."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Product Selection Area */}
        <div className={cn(
          "bg-white p-[1.5rem] rounded-[1.25rem] border border-slate-200 shadow-sm",
          !formData.penjualan_id && "opacity-50 pointer-events-none grayscale"
        )}>
          <div className="flex items-center justify-between mb-[1.25rem]">
            <div className="flex items-center gap-[0.75rem]">
              <div className="p-[0.5rem] bg-blue-50 rounded-[0.75rem] text-blue-600">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="text-[1rem] font-bold text-slate-900 leading-none">Daftar Produk Klaim</h3>
                <p className="text-[0.75rem] text-slate-500 mt-[0.25rem]">Pilih produk dari invoice dan tentukan jenis klaimnya</p>
              </div>
            </div>
          </div>

          {availableProducts.length > 0 ? (
            <div className="space-y-[1rem]">
              <Tabs 
                id="retur-tabs" 
                activeTab={activeTab} 
                onChange={(val) => setActiveTab(val as any)}
                variant="segmented"
                className="w-full"
                tabs={[
                  { 
                    id: 'available', 
                    label: `Tersedia (${unclaimedProducts.length})`,
                    icon: <List size={14} />
                  },
                  { 
                    id: 'claimed', 
                    label: `Dipilih (${items.length})`,
                    icon: <CheckCircle2 size={14} />
                  }
                ]}
              />

              {activeTab === 'available' && (
                <div className="rounded-[1rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                  <Table id="available-products-table">
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[40%]">Produk</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead>Jml Beli</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unclaimedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-slate-400 italic">
                            Semua produk telah dipindahkan ke daftar retur
                          </TableCell>
                        </TableRow>
                      ) : (
                        unclaimedProducts.map((p) => (
                          <TableRow key={p.id} className="group hover:bg-blue-50/30 transition-colors">
                            <TableCell className="font-bold text-slate-900">{p.name}</TableCell>
                            <TableCell><Badge variant="neutral">{p.unit}</Badge></TableCell>
                            <TableCell>{p.qty}</TableCell>
                            <TableCell>{formatCurrency(p.unit_selling_price)}</TableCell>
                            <TableCell className="text-right">
                              <PrimaryButton 
                                id={`select-prod-${p.id}`}
                                onClick={() => handleAddItem(p)}
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 font-bold hover:bg-blue-100"
                                icon={<Plus size={14} />}
                              >
                                Pilih
                              </PrimaryButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'claimed' && (
                <div className="rounded-[1rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                  <Table id="claimed-items-table">
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[30%]">Produk</TableHead>
                        <TableHead>Retur/Satuan</TableHead>
                        <TableHead>Kebijakan</TableHead>
                        <TableHead>Estimasi Refund</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                             Pilih produk dari tab "Tersedia" untuk mulai mengajukan retur
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((it, idx) => (
                          <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell>
                              <div className="font-bold text-slate-900">{it.name}</div>
                              <div className="text-[0.7rem] text-slate-500 line-clamp-1 italic">{it.reason}</div>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-slate-900">{it.qty}</span> <span className="text-slate-500">{it.unit}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={it.policy === 'Refund' ? 'info' : 'success'}>
                                {it.policy === 'Refund' ? 'Refund Uang' : 'Ganti Barang'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-Black">
                              {it.policy === 'Refund' ? formatCurrency(it.refund_nominal || 0) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-[0.5rem]">
                                <button 
                                  onClick={() => handleEditItem(idx)}
                                  className="p-[0.5rem] text-blue-600 hover:bg-blue-50 rounded-[0.5rem] transition-colors"
                                  title="Edit detail"
                                >
                                  <Save size={16} />
                                </button>
                                <button 
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-[0.5rem] text-red-600 hover:bg-red-50 rounded-[0.5rem] transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 border-2 border-dashed border-slate-200 rounded-[1.25rem] flex flex-col items-center justify-center text-slate-400 gap-[0.5rem]">
               <Receipt size={32} strokeWidth={1} />
               <p className="text-[0.875rem]">Pilih invoice terlebih dahulu untuk melihat daftar produk</p>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItemIdx(null);
        }}
        title={editingItemIdx !== null ? "Edit Detail Klaim" : "Pengajuan Klaim Produk"}
        id="claim-item-modal"
      >
        <form onSubmit={handleModalConfirm} className="space-y-[1.25rem] p-[0.5rem]">
          <div className="bg-slate-50 p-[1rem] rounded-[1rem] border border-slate-200">
            <p className="text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider mb-[0.25rem]">Produk</p>
            <p className="text-[1rem] font-bold text-slate-900">{selectedProduct?.name || (editingItemIdx !== null ? items[editingItemIdx]?.name : '')}</p>
            <p className="text-[0.875rem] text-slate-500">
              {(selectedProduct?.qty || (editingItemIdx !== null ? items[editingItemIdx]?.qty : 0)) || 0} {(selectedProduct?.unit || (editingItemIdx !== null ? items[editingItemIdx]?.unit : ''))} dibeli
            </p>
          </div>

          <div className="space-y-[0.5rem]">
            <Label>Jumlah yang Diretur {(selectedProduct?.unit || (editingItemIdx !== null ? items[editingItemIdx]?.unit : ''))}</Label>
            <NumberInput
              id="retur-qty"
              value={itemQty}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                const maxQty = (selectedProduct?.qty || (editingItemIdx !== null ? items[editingItemIdx]?.qty : 0)) || 0;
                setItemQty(Math.min(val, maxQty));
              }}
              min={0}
              max={(selectedProduct?.qty || (editingItemIdx !== null ? items[editingItemIdx]?.qty : 0)) || 999999}
              required
            />
            <p className="text-[0.7rem] text-slate-500">Maksimal {(selectedProduct?.qty || (editingItemIdx !== null ? items[editingItemIdx]?.qty : 0)) || 0} {(selectedProduct?.unit || (editingItemIdx !== null ? items[editingItemIdx]?.unit : ''))}</p>
          </div>

          <div className="space-y-[0.5rem]">
            <Label>Alasan Retur</Label>
            <LongTextInput
              id="retur-reason"
              value={itemReason}
              onChange={(e) => setItemReason(e.target.value)}
              placeholder="Contoh: Barang cacat, Salah kirim, Kadaluarsa..."
              required
              rows={3}
            />
          </div>

          <div className="space-y-[0.5rem]">
            <Label>Bukti Foto/Video</Label>
            <MultipleUploadInput
              id="retur-proof"
              initialUrls={itemProofUrl ? itemProofUrl.split(',') : []}
              onFilesChange={(files) => {
                setCurrentFiles(files);
              }}
              onRemoveInitialUrl={(url) => {
                const newUrls = itemProofUrl.split(',').filter(u => u !== url);
                setItemProofUrl(newUrls.join(','));
              }}
              maxFiles={5}
            />
          </div>

          <div className="space-y-[0.5rem]">
            <Label>Kebijakan Penyelesaian</Label>
            <FixedDropdown
              id="policy-select"
              options={[
                { value: 'Refund', label: 'Refund (Uang Kembali)' },
                { value: 'Replace', label: 'Replace (Ganti Barang)' }
              ]}
              value={itemPolicy}
              onChange={(val) => setItemPolicy(val as 'Replace' | 'Refund')}
            />
            {itemPolicy === 'Refund' && (
              <p className="text-[0.875rem] font-bold text-green-700 bg-green-50 p-[0.75rem] rounded-[0.75rem] border border-green-100 italic mt-[0.5rem]">
                Estimasi Pengembalian: {formatCurrency((selectedProduct?.unit_selling_price || (editingItemIdx !== null && items[editingItemIdx]?.refund_nominal && items[editingItemIdx]?.qty ? (Number(items[editingItemIdx]!.refund_nominal!) / Number(items[editingItemIdx]!.qty!)) : 0) || 0) * itemQty)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-[0.75rem] pt-[1rem]">
            <SecondaryButton onClick={() => {
              setIsItemModalOpen(false);
              setEditingItemIdx(null);
            }} type="button">Batal</SecondaryButton>
            <PrimaryButton type="submit" disabled={!isModalValid}>Konfirmasi</PrimaryButton>
          </div>
        </form>
      </Modal>
    </FormShell>
  );
};

// export default KlaimReturFormPage; // Removed default export to support named import in App.tsx
