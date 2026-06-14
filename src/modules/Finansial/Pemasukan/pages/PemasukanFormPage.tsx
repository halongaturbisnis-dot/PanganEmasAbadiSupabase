import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { TextInput, PriceInput, LongTextInput } from '../../../../ui/components/elements/Inputs';
import { DateTimeInput } from '../../../../ui/components/elements/DateTimeInput';
import { CustomValueDropdown, FixedDropdown } from '../../../../ui/components/elements/Dropdown';
import { MultipleUploadInput } from '../../../../ui/components/elements/UploadInput';
import { Label } from '../../../../ui/components/elements/Label';
import { pemasukanService, helperStringifyPemasukanType, helperParsePemasukanType } from '../../../../logic/services/pemasukanService';
import { penjualanService } from '../../../../logic/services/penjualanService';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { IPemasukanPayload, TPemasukanStatus } from '../../../../logic/types/ITs_Pemasukan';
import { IBankAndCash } from '../../../../logic/types/ITs_BankAndCash';
import { toast } from 'react-hot-toast';
import { Plus, X, UploadCloud } from 'lucide-react';
import { GhostButton } from '../../../../ui/components/elements/Button';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';

export const PemasukanFormPage: React.FC = () => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;

  const searchParams = new URLSearchParams(location.search);
  const salesId = searchParams.get('sales_id');

  const [isLoading, setIsLoading] = useState(false);
  const [bankOptions, setBankOptions] = useState<{ label: string; value: string }[]>([]);
  const [typeOptions, setTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [typeClassification, setTypeClassification] = useState<'Operasional' | 'Aset'>('Operasional');
  
  const [formData, setFormData] = useState<Partial<IPemasukanPayload>>({
    transaction_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    bank_and_cash_id: '',
    type: '',
    description: '',
    amount: 0,
    sales_id: salesId || undefined,
    proof_urls: [],
    files: []
  });

  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    loadOptions();
    if (isEdit && id) {
      loadData(id);
    } else if (salesId) {
      loadSalesData(salesId);
    }
  }, [isEdit, id, salesId]);

  const loadOptions = async () => {
    const banks = await bankAndCashService.getAll();
    setBankOptions(banks.map(b => ({ label: b.nama_akun, value: b.id })));
    
    setTypeOptions([
      { label: 'Penjualan Produk', value: 'Penjualan Produk' },
      { label: 'Pendapatan Jasa', value: 'Pendapatan Jasa' },
      { label: 'Investasi', value: 'Investasi' },
      { label: 'Bunga Bank', value: 'Bunga Bank' },
      { label: 'Lain-lain', value: 'Lain-lain' },
    ]);
  };

  const loadSalesData = async (sid: string) => {
    setIsLoading(true);
    try {
      const data = await penjualanService.getById(sid);
      if (data) {
        setTypeClassification('Operasional');
        setFormData(prev => ({
          ...prev,
          type: 'Penjualan Produk',
          description: `Pemasukan dari Penjualan Invoice ${data.invoice_number}`,
          amount: data.payment_type === 'Lunas' ? data.grand_total : data.deposit,
          bank_and_cash_id: data.bank_cash_source_id,
          sales_id: sid
        }));
      }
    } catch (error) {
      toast.error('Gagal memuat data penjualan terkait');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async (incomeId: string) => {
    setIsLoading(true);
    try {
      const data = await pemasukanService.getById(incomeId);
      if (data) {
        const parsedType = helperParsePemasukanType(data.type);
        setTypeClassification(parsedType.classification);
        setFormData({
          ...data,
          type: parsedType.name,
          proof_urls: JSON.parse(data.proof_urls || '[]')
        });
      }
    } catch (error) {
      toast.error('Gagal memuat data pemasukan');
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
      const payload: IPemasukanPayload = {
        ...formData as IPemasukanPayload,
        type: helperStringifyPemasukanType(formData.type || '', typeClassification),
        files: files
      };

      if (isEdit && id) {
        await pemasukanService.update(id, payload);
        toast.success('Pemasukan berhasil diperbarui');
      } else {
        await pemasukanService.create(payload);
        toast.success('Pemasukan berhasil ditambahkan');
      }
      navigate('/finansial/pemasukan');
    } catch (error) {
      toast.error('Gagal menyimpan data pemasukan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormShell
      id="pemasukan-form-shell"
      title={isEdit ? 'Edit Pemasukan' : 'Tambah Pemasukan'}
      subtitle={isEdit ? 'Perbarui detil transaksi pemasukan.' : 'Catat transaksi pemasukan (Revenue) baru.'}
      onSave={handleSave}
      onCancel={() => navigate('/finansial/pemasukan')}
      isLoading={isLoading}
      isSaveDisabled={!isFormValid || isLoading}
    >
      <div className="flex flex-col gap-SpacingMedium w-full">
        
        {/* Row 1: 5 Columns on Desktop, 1 on Mobile */}
        <div className={cn("grid gap-SpacingMedium", isMobile ? "grid-cols-1" : "grid-cols-5")}>
          <div className="space-y-SpacingSmall">
            <Label id="label-pemasukan-date" required>Tanggal Transaksi</Label>
            <DateTimeInput
              id="transaction_date"
              value={formData.transaction_date ? formData.transaction_date.slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-pemasukan-amount" required>Nominal</Label>
            <PriceInput
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="0"
              disabled={!!salesId || !!formData.sales_id}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-pemasukan-source" required>Sumber Transaksi</Label>
            <FixedDropdown
              id="bank_and_cash_id"
              options={bankOptions}
              placeholder="Pilih bank..."
              value={formData.bank_and_cash_id || ''}
              onChange={(val) => setFormData({ ...formData, bank_and_cash_id: String(val) })}
              disabled={!!salesId || !!formData.sales_id}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-pemasukan-type" required>Tipe</Label>
            <CustomValueDropdown
              id="type"
              options={typeOptions}
              placeholder="Tipe..."
              value={formData.type || ''}
              onChange={(val) => setFormData({ ...formData, type: String(val) })}
              disabled={!!salesId || !!formData.sales_id}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-pemasukan-classification" required>Klasifikasi</Label>
            <FixedDropdown
              id="type-classification"
              options={[
                { label: 'Operasional', value: 'Operasional' },
                { label: 'Aset', value: 'Aset' },
              ]}
              placeholder="Pilih Klasifikasi..."
              value={typeClassification}
              onChange={(val) => setTypeClassification(val as 'Operasional' | 'Aset')}
              disabled={!!salesId || !!formData.sales_id}
            />
          </div>
        </div>

        {/* Row 2: Deskripsi (Left), Upload (Right) */}
        <div className={cn("grid gap-SpacingMedium", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          
          <div className="flex flex-col space-y-SpacingSmall">
            <Label id="label-pemasukan-description" required>Deskripsi</Label>
            <LongTextInput
              id="description"
              placeholder="Jelaskan detil pemasukan..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="flex-1 min-h-[5.5rem] h-full"
              rows={isMobile ? 4 : 5}
              disabled={!!salesId || !!formData.sales_id}
            />
          </div>

          <div className="flex flex-col space-y-SpacingSmall">
            <Label id="label-pemasukan-proof">Upload Bukti (Maks. 5)</Label>
            <MultipleUploadInput 
              id="income-files"
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

export default PemasukanFormPage;
