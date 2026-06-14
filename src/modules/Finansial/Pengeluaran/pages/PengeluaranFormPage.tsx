import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { TextInput, PriceInput, LongTextInput } from '../../../../ui/components/elements/Inputs';
import { DateTimeInput } from '../../../../ui/components/elements/DateTimeInput';
import { CustomValueDropdown, FixedDropdown } from '../../../../ui/components/elements/Dropdown';
import { MultipleUploadInput } from '../../../../ui/components/elements/UploadInput';
import { Label } from '../../../../ui/components/elements/Label';
import { pengeluaranService, helperStringifyPengeluaranType, helperParsePengeluaranType } from '../../../../logic/services/pengeluaranService';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { pembelianService } from '../../../../logic/services/pembelianService';
import { IPengeluaranPayload, TPengeluaranStatus } from '../../../../logic/types/ITs_Pengeluaran';
import { IBankAndCash } from '../../../../logic/types/ITs_BankAndCash';
import { toast } from 'react-hot-toast';
import { Plus, X, UploadCloud } from 'lucide-react';
import { GhostButton } from '../../../../ui/components/elements/Button';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';

export const PengeluaranFormPage: React.FC = () => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const purchaseId = searchParams.get('purchase_id');
  
  const navigate = useNavigate();
  const isEdit = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [bankOptions, setBankOptions] = useState<{ label: string; value: string }[]>([]);
  const [typeOptions, setTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [typeClassification, setTypeClassification] = useState<'Operasional' | 'Aset'>('Operasional');
  
  const [formData, setFormData] = useState<Partial<IPengeluaranPayload>>({
    transaction_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    bank_and_cash_id: '',
    type: '',
    description: '',
    amount: 0,
    proof_urls: [],
    files: [],
    purchase_id: purchaseId || undefined
  });

  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    loadOptions();
    if (isEdit && id) {
      loadData(id);
    } else if (purchaseId) {
      loadFromPurchase(purchaseId);
    }
  }, [isEdit, id, purchaseId]);

  const loadOptions = async () => {
    const banks = await bankAndCashService.getAll();
    setBankOptions(banks.map(b => ({ label: b.nama_akun, value: b.id })));
    
    setTypeOptions([
      { label: 'Biaya Sewa', value: 'Biaya Sewa' },
      { label: 'Gaji Karyawan', value: 'Gaji Karyawan' },
      { label: 'Listrik & Air', value: 'Listrik & Air' },
      { label: 'Kebutuhan Kantor', value: 'Kebutuhan Kantor' },
      { label: 'Pajak', value: 'Pajak' },
      { label: 'Pembelian Stok', value: 'Pembelian Stok' },
      { label: 'Operasional Gudang', value: 'Operasional Gudang' },
    ]);
  };

  const loadFromPurchase = async (pId: string) => {
    setIsLoading(true);
    try {
      const pData = await pembelianService.getById(pId);
      if (pData) {
        setTypeClassification('Operasional');
        const amountToPay = pData.payment_type === 'lunas' ? pData.grand_total_price : pData.deposit;
        setFormData(prev => ({
          ...prev,
          transaction_date: pData.datetime ? pData.datetime.slice(0, 16) : prev.transaction_date,
          amount: amountToPay,
          type: 'Pembelian Stok',
          description: `Pembayaran Pembelian PO: ${pData.po_number || '-'} (${pData.supplier_name || 'Umum'})`,
          bank_and_cash_id: pData.bank_and_cash_id || prev.bank_and_cash_id,
          purchase_id: pId
        }));
      }
    } catch (error) {
      toast.error('Gagal memuat data pembelian pendukung');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async (expenseId: string) => {
    setIsLoading(true);
    try {
      const data = await pengeluaranService.getById(expenseId);
      if (data) {
        const parsedType = helperParsePengeluaranType(data.type);
        setTypeClassification(parsedType.classification);
        setFormData({
          ...data,
          type: parsedType.name,
          proof_urls: JSON.parse(data.proof_urls || '[]')
        });
      }
    } catch (error) {
      toast.error('Gagal memuat data pengeluaran');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !!(
    formData.transaction_date &&
    formData.bank_and_cash_id &&
    formData.type &&
    formData.description &&
    (formData.amount || 0) > 0
  );

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const payload: IPengeluaranPayload = {
        ...formData as IPengeluaranPayload,
        type: helperStringifyPengeluaranType(formData.type || '', typeClassification),
        files: files
      };

      if (isEdit && id) {
        await pengeluaranService.update(id, payload);
        toast.success('Pengeluaran berhasil diperbarui');
      } else {
        await pengeluaranService.create(payload);
        toast.success('Pengeluaran berhasil ditambahkan');
      }
      navigate('/finansial/pengeluaran');
    } catch (error) {
      toast.error('Gagal menyimpan data pengeluaran');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormShell
      id="pengeluaran-form-shell"
      title={isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
      subtitle={isEdit ? 'Perbarui detil transaksi pengeluaran.' : 'Catat transaksi pengeluaran operasional baru.'}
      onSave={handleSave}
      onCancel={() => navigate('/finansial/pengeluaran')}
      isLoading={isLoading}
      isSaveDisabled={!isFormValid || isLoading}
    >
      <div className="flex flex-col gap-SpacingMedium w-full">
        
        {/* Row 1: 5 Columns on Desktop, 1 on Mobile */}
        <div className={cn("grid gap-SpacingMedium", isMobile ? "grid-cols-1" : "grid-cols-5")}>
          <div className="space-y-SpacingSmall">
            <Label id="label-date" required>Tanggal Transaksi</Label>
            <DateTimeInput
              id="transaction_date"
              value={formData.transaction_date ? formData.transaction_date.slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-amount" required>Nominal</Label>
            <PriceInput
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="0"
              readOnly={!!formData.purchase_id}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-source" required>Sumber Transaksi</Label>
            <FixedDropdown
              id="bank_and_cash_id"
              options={bankOptions}
              placeholder="Pilih bank..."
              value={formData.bank_and_cash_id || ''}
              onChange={(val) => setFormData({ ...formData, bank_and_cash_id: String(val) })}
              disabled={!!formData.purchase_id}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-type" required>Tipe</Label>
            <CustomValueDropdown
              id="type"
              options={typeOptions}
              placeholder="Tipe..."
              value={formData.type || ''}
              onChange={(val) => setFormData({ ...formData, type: String(val) })}
              disabled={!!formData.purchase_id}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-pengeluaran-classification" required>Klasifikasi</Label>
            <FixedDropdown
              id="type-classification"
              options={[
                { label: 'Operasional', value: 'Operasional' },
                { label: 'Aset', value: 'Aset' },
              ]}
              placeholder="Pilih Klasifikasi..."
              value={typeClassification}
              onChange={(val) => setTypeClassification(val as 'Operasional' | 'Aset')}
              disabled={!!formData.purchase_id}
            />
          </div>
        </div>

        {/* Row 2: Deskripsi (Left), Upload (Right) */}
        <div className={cn("grid gap-SpacingMedium", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          
          <div className="flex flex-col space-y-SpacingSmall">
            <Label id="label-description" required>Deskripsi</Label>
            <LongTextInput
              id="description"
              placeholder="Jelaskan detil pengeluaran..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              readOnly={!!formData.purchase_id}
              className="flex-1 min-h-[5.5rem] h-full"
              rows={isMobile ? 4 : 5}
            />
          </div>

          <div className="flex flex-col space-y-SpacingSmall">
            <Label id="label-proof">Upload Bukti (Maks. 5)</Label>
            <MultipleUploadInput 
              id="expense-files"
              onFilesChange={(newFiles) => setFiles(newFiles)}
              initialUrls={formData.proof_urls?.map(u => (u as any).url) || []}
              onRemoveInitialUrl={(url) => {
                setFormData(prev => ({
                  ...prev,
                  proof_urls: (prev.proof_urls || []).filter(u => (u as any).url !== url)
                }));
              }}
            />
          </div>
        </div>

      </div>
    </FormShell>
  );
};


export default PengeluaranFormPage;

