import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DetailShell } from '../../../../ui/components/common/shells/DetailShell';
import { liabilitasService } from '../../../../logic/services/liabilitasService';
import { ILiabilitas, ILiabilitasPembayaran, TLiabilitasStatus } from '../../../../logic/types/ITs_Liabilitas';
import { 
  AlertCircle, 
  CheckCircle2, 
  Plus
} from 'lucide-react';
import { tokens } from '../../../../ui/styles/tokens';
import { formatCurrency } from '../../../../logic/utils/data';
import { formatDate, formatDateFull, formatDateShort, formatDateTimeLocal } from '../../../../logic/utils/date';
import { cn } from '../../../../logic/utils/cn';
import { PageLoading } from '../../../../ui/components/LoadingState/PageLoading';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { PrimaryButton, SecondaryButton } from '../../../../ui/components/elements/Button';
import { Modal } from '../../../../ui/components/common/Modal';
import { TextInput, NumberInput, PriceInput, LongTextInput } from '../../../../ui/components/elements/Inputs';
import { FixedDropdown } from '../../../../ui/components/elements/Dropdown';
import { DateTimeInput, DateInput } from '../../../../ui/components/elements/DateTimeInput';
import { MultipleUploadInput } from '../../../../ui/components/elements/UploadInput';
import { AttachmentDisplay } from '../../../../ui/components/elements/AttachmentDisplay';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { IBankAndCash } from '../../../../logic/types/ITs_BankAndCash';
import { AuditTrail } from '../../../../ui/components/elements/AuditTrail';
import { Label } from '../../../../ui/components/elements/Label';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';

export const LiabilitasDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referrer = searchParams.get('referrer');
  const { state } = useGlobalState();
  
  const [data, setData] = useState<(ILiabilitas & { payments: ILiabilitasPembayaran[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ILiabilitasPembayaran | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<IBankAndCash[]>([]);

  const [paymentForm, setPaymentForm] = useState<{
    payment_date: string;
    amount: number;
    payment_method: 'Tunai' | 'Non Tunai';
    bank_and_cash_id: string;
    description: string;
    next_sla: string | null;
    files: File[];
  }>({
    payment_date: formatDateTimeLocal(),
    amount: 0,
    payment_method: 'Non Tunai' as 'Tunai' | 'Non Tunai',
    bank_and_cash_id: '',
    description: '',
    next_sla: null,
    files: []
  });

  useEffect(() => {
    if (isModalOpen) {
      setPaymentForm(prev => ({
        ...prev,
        payment_date: formatDateTimeLocal(),
        next_sla: null // Init value for SLA
      }));
    }
  }, [isModalOpen]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      const result = await liabilitasService.getById(id);
      setData(result);
      
      const accRes = await bankAndCashService.getAll();
      setAccounts(accRes);
      if (accRes.length > 0) {
        setPaymentForm(prev => ({ ...prev, bank_and_cash_id: accRes[0].id }));
      }
      
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  const handleViewPayment = (payment: ILiabilitasPembayaran) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const handleAddPayment = async () => {
    if (!id || !data) return;

    if (!paymentForm.description || paymentForm.files.length === 0 || paymentForm.amount <= 0 || !paymentForm.bank_and_cash_id) {
      swalToast.fire({ icon: 'error', title: 'Mohon lengkapi semua data pembayaran' });
      return;
    }

    if (paymentForm.amount > data.outstanding_amount) {
      swalToast.fire({ icon: 'error', title: 'Nominal cicilan tidak boleh melebihi sisa hutang' });
      return;
    }

    const confirm = await swalConfig.fire({
      title: 'Konfirmasi Pembayaran',
      text: 'Catatan pembayaran ini akan otomatis tercatat sebagai Pengeluaran dan bersifat irreversible (tidak dapat dibatalkan). Lanjutkan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setIsSubmitting(true);
    const success = await liabilitasService.addPayment({
      liabilitas_id: id,
      ...paymentForm
    });

    if (success) {
      swalToast.fire({ icon: 'success', title: 'Berhasil! Pembayaran telah dicatat dan terhubung ke pengeluaran.' });
      setIsModalOpen(false);
      // Reset form
      setPaymentForm({
        payment_date: formatDateTimeLocal(),
        amount: 0,
        payment_method: 'Non Tunai',
        bank_and_cash_id: accounts[0]?.id || '',
        description: '',
        next_sla: null,
        files: []
      });
      const result = await liabilitasService.getById(id);
      setData(result);
    } else {
      swalToast.fire({ icon: 'error', title: 'Gagal mencatat pembayaran' });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <DetailShell title="Memuat Detail Liabilitas..." onBack={() => navigate(-1)}>
        <div className="flex h-[300px] items-center justify-center">
          <PageLoading />
        </div>
      </DetailShell>
    );
  }

  if (!data) {
    return (
      <DetailShell title="Data Tidak Ditemukan" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center h-64 text-TextColorMuted">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p>Maaf, data liabilitas tidak tersedia.</p>
        </div>
      </DetailShell>
    );
  }

  const isPaid = data.status === TLiabilitasStatus.SETTLED;

  return (
    <DetailShell 
      title={data.name} 
      onBack={() => navigate(referrer || '/finansial/liabilitas')}
      id="liabilitas-detail-shell"
    >
      <div className="p-SpacingBase space-y-SpacingBase">
        {/* TOP SECTION */}
        <div className="bg-ColorPrimary/10 rounded-RadiusLarge p-SpacingMedium border border-ColorPrimary/5">
            <div className="flex justify-between items-start mb-SpacingMedium">
                <div className="grid grid-cols-3 gap-SpacingLarge flex-1">
                    <div>
                        <Label id="lbl-tanggal-transaksi">Tanggal Transaksi</Label>
                        <p className="text-TextColorBase font-medium pt-1.5">{formatDate(data.datetime)}</p>
                    </div>
                </div>
                <div className={cn(
                    "inline-flex items-center px-4 py-1 rounded-full text-FontSizeXs font-medium text-white",
                    isPaid ? "bg-green-500" : "bg-red-500"
                )}>
                    {isPaid ? <CheckCircle2 size={16} className="mr-2" /> : <AlertCircle size={16} className="mr-2" />}
                    {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-SpacingMedium">
                <div>
                  <Label id="lbl-nilai-pokok">Nilai Pokok</Label>
                  <p className="text-TextColorBase font-bold pt-1.5">{formatCurrency(data.principal_amount)}</p>
                </div>
                <div>
                  <Label id="lbl-total-terbayar">Total Terbayar</Label>
                  <p className="text-TextColorBase font-bold pt-1.5">{formatCurrency(data.paid_amount)}</p>
                </div>
                <div>
                  <Label id="lbl-sisa-hutang" className="text-red-500">Sisa Hutang</Label>
                  <p className="text-red-500 font-bold pt-1.5">{formatCurrency(data.outstanding_amount)}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-SpacingMedium mt-SpacingMedium">
                <div>
                    <Label id="lbl-kategori">Kategori</Label>
                    <p className="text-TextColorBase font-medium pt-1.5">{data.category}</p>
                </div>
                <div>
                    <Label id="lbl-pihak-terkait">Pihak Terkait</Label>
                    <p className="text-TextColorBase font-medium pt-1.5">{data.entity_name}</p>
                </div>
                <div>
                    <Label id="lbl-jatuh-tempo">Jatuh Tempo Berikutnya</Label>
                    <p className="text-TextColorBase font-medium pt-1.5">{data.due_date ? formatDate(data.due_date) : '-'}</p>
                </div>
            </div>
        </div>

        {/* TABLE LOG */}
        <div className="bg-ColorBg rounded-RadiusLarge p-SpacingMedium border border-ColorPrimary/5">
            <div className="flex justify-between items-center mb-SpacingMedium">
                <h3 className="text-FontSizeSm font-bold">Log Pembayaran Hutang</h3>
                <PrimaryButton onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2"/> Catat Pembayaran
                </PrimaryButton>
            </div>
            <Table id="log-pembayaran-table">
                <TableHeader>
                    <TableRow isHeader={true}>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Nominal</TableHead>
                        <TableHead>Sisa Hutang</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>SLA Berikutnya</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.payments.length > 0 ? (
                        (() => {
                            let runningPaidTotal = 0;
                            return [...data.payments]
                                .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
                                .map((p) => {
                                    runningPaidTotal += p.amount;
                                    const remaining = data.principal_amount - runningPaidTotal;
                                    return (
                                        <TableRow key={p.id} className="cursor-pointer hover:bg-ColorPrimary/5" onClick={() => handleViewPayment(p)}>
                                            <TableCell>{formatDateFull(p.payment_date)}</TableCell>
                                            <TableCell>{formatCurrency(p.amount)}</TableCell>
                                            <TableCell className="!text-fontSizeXs text-red-500 font-medium">{formatCurrency(remaining)}</TableCell>
                                            <TableCell>{p.description || '-'}</TableCell>
                                            <TableCell>{p.next_sla ? formatDateFull(p.next_sla) : '-'}</TableCell>
                                        </TableRow>
                                    );
                                });
                        })()
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-SpacingLarge text-TextColorMuted text-FontSizeXs font-italic">Tidak ada log pembayaran.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        <div className="flex justify-end pr-SpacingSmall">
            <AuditTrail 
                createdAt={data.created_at} 
                createdBy={data.created_by} 
                updatedAt={data.updated_at}
                updatedBy={data.updated_by}
            />
        </div>
      </div>

      <Modal 
        id="payment-modal" 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="CATAT PEMBAYARAN CICILAN"
        variant="popup"
        className="max-w-2xl"
      >
        <div className="space-y-SpacingMedium">
          {/* ROW 1: Tanggal | Sumber Kas & Bank */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
            <div className="space-y-SpacingSmall">
              <Label id="lbl-pay-date" required>TANGGAL</Label>
              <DateTimeInput 
                id="pay-date" 
                value={paymentForm.payment_date} 
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))} 
              />
            </div>
            <div className="space-y-SpacingSmall">
              <Label id="lbl-pay-account" required>SUMBER REKENING KAS & BANK</Label>
              <FixedDropdown 
                id="pay-account" 
                value={paymentForm.bank_and_cash_id} 
                onChange={(val) => setPaymentForm(prev => ({ ...prev, bank_and_cash_id: String(val) }))}
                options={accounts.map(acc => ({ label: acc.nama_akun, value: acc.id }))}
              />
            </div>
          </div>

          {/* ROW 2: Nominal | SLA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
            <div className="space-y-SpacingSmall">
              <Label id="lbl-pay-amount" required>NOMINAL CICILAN (RP)</Label>
              <PriceInput 
                id="pay-amount" 
                value={paymentForm.amount} 
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))} 
                placeholder="0"
              />
              {data && paymentForm.amount > data.outstanding_amount && (
                <div className="text-red-500 text-xs font-medium">
                  Nominal melebihi sisa hutang ({formatCurrency(data.outstanding_amount)})
                </div>
              )}
            </div>
            <div className="space-y-SpacingSmall">
              <Label id="lbl-next-sla">SLA BERIKUTNYA (OPSIONAL)</Label>
              <DateInput 
                id="next-sla" 
                value={paymentForm.next_sla ? paymentForm.next_sla.split('T')[0] : ""} 
                onChange={(e) => setPaymentForm(prev => ({ ...prev, next_sla: e.target.value }))} 
                placeholder="Pilih tanggal jatuh tempo berikutnya..."
              />
            </div>
          </div>

          {/* ROW 3: Keterangan (Fullwidth) */}
          <div className="space-y-SpacingSmall">
            <Label id="lbl-pay-desc" required>KETERANGAN</Label>
            <LongTextInput 
              id="pay-desc" 
              rows={3}
              value={paymentForm.description} 
              onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tambahkan catatan pembayaran di sini..."
            />
          </div>

          {/* ROW 4: Upload (Fullwidth) */}
          <div className="space-y-SpacingSmall">
            <Label id="lbl-pay-proof" required>LAMPIRAN BUKTI</Label>
            <div className="min-h-[100px]">
              <MultipleUploadInput
                id="pay-files"
                onFilesChange={(files) => setPaymentForm(prev => ({ ...prev, files }))}
                maxFiles={3}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-SpacingSmall pt-SpacingMedium">
            <SecondaryButton 
              id="cancel-payment-btn"
              onClick={() => setIsModalOpen(false)} 
              disabled={isSubmitting}
            >
              Batal
            </SecondaryButton>
            <PrimaryButton 
              id="submit-payment-btn"
              onClick={handleAddPayment} 
              isLoading={isSubmitting}
              disabled={isSubmitting || !paymentForm.description || paymentForm.files.length === 0 || paymentForm.amount <= 0 || !paymentForm.bank_and_cash_id || !!(data && paymentForm.amount > data.outstanding_amount)}
              className="min-w-[150px]"
            >
              Simpan Pembayaran
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* VIEW MODAL */}
      <Modal 
        id="view-payment-modal" 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        title="DETAIL PEMBAYARAN CICILAN"
        variant="popup"
        className="max-w-2xl"
      >
        {selectedPayment && (
          <div className="space-y-SpacingMedium">
            {/* ROW 1: Tanggal | Sumber Kas & Bank */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
              <div className="space-y-SpacingSmall">
                <Label id="lbl-view-date">TANGGAL</Label>
                <DateTimeInput 
                  id="view-date" 
                  value={selectedPayment.payment_date} 
                  disabled
                />
              </div>
              <div className="space-y-SpacingSmall">
                <Label id="lbl-view-account">SUMBER REKENING KAS & BANK</Label>
                <FixedDropdown 
                  id="view-account" 
                  value={selectedPayment.bank_and_cash_id} 
                  options={accounts.map(acc => ({ label: acc.nama_akun, value: acc.id }))}
                  disabled
                />
              </div>
            </div>

            {/* ROW 2: Nominal | SLA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
              <div className="space-y-SpacingSmall">
                <Label id="lbl-view-amount">NOMINAL CICILAN (RP)</Label>
                <PriceInput 
                  id="view-amount" 
                  value={selectedPayment.amount} 
                  disabled
                />
              </div>
              <div className="space-y-SpacingSmall">
                <Label id="lbl-view-sla">SLA BERIKUTNYA</Label>
                <DateInput 
                  id="view-next-sla" 
                  value={selectedPayment.next_sla ? selectedPayment.next_sla.split('T')[0] : ""} 
                  disabled
                  placeholder="Tidak ada / Belum diset"
                />
              </div>
            </div>

            {/* ROW 3: Keterangan (Fullwidth) */}
            <div className="space-y-SpacingSmall">
              <Label id="lbl-view-desc">KETERANGAN</Label>
              <LongTextInput 
                id="view-desc" 
                rows={3}
                value={selectedPayment.description || '-'} 
                disabled
              />
            </div>

            {/* ROW 4: Upload (Fullwidth) */}
            <div className="space-y-SpacingSmall">
              <Label id="lbl-view-proof">LAMPIRAN BUKTI</Label>
              <AttachmentDisplay 
                id="view-files"
                files={
                  (() => {
                    if (!selectedPayment.proof_urls) return [];
                    const parsed = typeof selectedPayment.proof_urls === 'string' ? JSON.parse(selectedPayment.proof_urls) : selectedPayment.proof_urls;
                    return (parsed || []).map((file: any) => ({
                      url: typeof file === 'string' ? file : file.url,
                      name: typeof file === 'string' ? 'Bukti Pembayaran' : (file.key || 'Bukti Pembayaran')
                    }));
                  })()
                }
              />
            </div>

            {/* AuditTrail */}
            <div className="pt-SpacingMedium border-t border-ColorPrimary/10">
              <AuditTrail 
                createdAt={selectedPayment.created_at} 
                createdBy={selectedPayment.created_by} 
                updatedAt={selectedPayment.updated_at}
                updatedBy={selectedPayment.updated_by}
              />
            </div>
            
            <div className="pt-SpacingMedium flex justify-end">
                <SecondaryButton 
                  id="close-view-payment-btn"
                  onClick={() => setIsViewModalOpen(false)} 
                >
                  Tutup
                </SecondaryButton>
            </div>
          </div>
        )}
      </Modal>
    </DetailShell>
  );
};

export default LiabilitasDetailPage;
