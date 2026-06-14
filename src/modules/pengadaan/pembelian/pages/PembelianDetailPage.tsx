import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DetailShell } from '../../../../ui/components/common/shells/DetailShell';
import { TextInput, PriceInput, LongTextInput, PhoneInput, EmailInput } from '../../../../ui/components/elements/Inputs';
import { DateTimeInput, DateInput } from '../../../../ui/components/elements/DateTimeInput';
import { Label } from '../../../../ui/components/elements/Label';
import { FixedDropdown } from '../../../../ui/components/elements/Dropdown';
import { ToggleButton } from '../../../../ui/components/elements/ToggleButton';
import { 
  IPembelianPayload, 
  TPembelianStatus, 
  TPembelianPaymentType, 
  TPembelianPaymentMethod, 
  TPembelianShippingType 
} from '../../../../logic/types/ITs_Pembelian';
import { ISuplier } from '../../../../logic/types/ITs_Suplier';
import { ICustomer } from '../../../../logic/types/ITs_Customer';
import { IBankAndCash } from '../../../../logic/types/ITs_BankAndCash';
import { pembelianService } from '../../../../logic/services/pembelianService';
import { suplierService } from '../../../../logic/services/suplierService';
import { customerService } from '../../../../logic/services/customerService';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { toast } from 'react-hot-toast';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { MapViewer } from '../../../../ui/components/elements/MapViewer';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { AuditTrail } from '../../../../ui/components/elements/AuditTrail';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { tokens } from '../../../../ui/styles/tokens';
import { AttachmentDisplay } from '../../../../ui/components/elements/AttachmentDisplay';
import { PhoneDisplay } from '../../../../ui/components/elements/PhoneDisplay';
import { 
  User, 
  Package, 
  DollarSign, 
  CreditCard, 
  Users, 
  Paperclip, 
  Calendar, 
  Hash, 
  Info,
  ExternalLink,
  FileText,
  Box,
  Truck
} from 'lucide-react';
import { motion } from 'motion/react';

import { PrimaryButton } from '../../../../ui/components/elements/Button';

type TActiveTab = 'supplier' | 'products' | 'costs' | 'payment' | 'customer' | 'attachment';

const ValueBox: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn(
    "w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-ColorSidebarBorder/OpacityMuted bg-ColorBgSecondary/OpacityMuted min-h-[2.5rem] flex items-center text-FontSizeSm font-medium text-TextColorBase",
    className
  )}>
    {children}
  </div>
);

export const PembelianDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useGlobalState();
  const [searchParams] = useSearchParams();
  const referrer = searchParams.get('referrer');
  const { isMobile, isTablet, isWide } = state.viewport;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isCheckingLock, setIsCheckingLock] = useState(true);
  const [activeTab, setActiveTab] = useState<TActiveTab>('supplier');
  const [data, setData] = useState<IPembelianPayload | null>(null);

  // Resolved identities for read-only view
  const [supplier, setSupplier] = useState<ISuplier | null>(null);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [bankAccount, setBankAccount] = useState<IBankAndCash | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const detail = (await pembelianService.getById(id)) as any;
        if (detail) {
          setData(detail);
          
          const processed = await pembelianService.isProcessedInPengeluaran(id);
          const paid = await pembelianService.hasPaidLiabilitas(id);
          
          // Lock if processed in pengeluaran, paid, or has internal shipping
          const hasInternalShipping = detail.has_internal_shipping && detail.shipping_type === TPembelianShippingType.INTERNAL;
          setIsLocked(processed || paid || hasInternalShipping);
          setIsCheckingLock(false);
          
          // Resolve Master Data
          const [suppliersRes, customersRes, banksRes] = await Promise.all([
            suplierService.getAll(),
            customerService.getAll(),
            bankAndCashService.getAll()
          ]);

          const matchedSupplier = suppliersRes.find(s => s.id === detail.supplier_id);
          if (matchedSupplier) setSupplier(matchedSupplier);

          if (detail.customer_id) {
            const matchedCustomer = customersRes.find(c => c.id === detail.customer_id);
            if (matchedCustomer) setCustomer(matchedCustomer);
          }

          const matchedBank = banksRes.find(b => b.id === detail.bank_and_cash_id);
          if (matchedBank) setBankAccount(matchedBank);
        } else {
          toast.error('Data transaksi tidak ditemukan');
          navigate(referrer || '/pengadaan/pembelian');
        }
      } catch (error) {
        toast.error('Gagal memuat rincian transaksi');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !data) return;
    swalConfig.fire({
      title: 'Hapus Transaksi?',
      text: `Anda yakin ingin menghapus PO ${data.po_number}? Data rincian yang dihapus tidak dapat dikembalikan!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: tokens.semantic.colors.light.FeedbackColorError,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await pembelianService.delete(id);
        if (success) {
          swalToast.fire({ icon: 'success', title: 'Transaksi berhasil dihapus' });
          navigate(referrer || '/pengadaan/pembelian');
        } else {
          swalToast.fire({ icon: 'error', title: 'Gagal menghapus transaksi' });
        }
      }
    });
  };

  if (!data && !isLoading) return null;

  const tabs: { key: TActiveTab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'supplier', label: 'Supplier', icon: User },
    { key: 'products', label: 'Daftar Produk', icon: Package },
    { key: 'costs', label: 'Daftar Biaya', icon: DollarSign },
    { key: 'payment', label: 'Pembayaran', icon: CreditCard },
    { key: 'customer', label: 'Customer', icon: Users },
    { key: 'attachment', label: 'Lampiran', icon: Paperclip },
  ];

  const getStatusBadge = () => {
    if (!data) return null;
    const isKirim = (data as any).has_internal_shipping && data.shipping_type === TPembelianShippingType.INTERNAL;
    
    if (isKirim) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
          <Truck size={14} />
          Kirim
        </span>
      );
    }

    if (data.status === TPembelianStatus.DRAFT) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 shadow-sm">
          <Box size={14} />
          Muat
        </span>
      );
    }

    return null;
  };

  return (
    <DetailShell
      id={`detail-${data?.id || 'loading'}`}
      title={
        <div className="flex items-center gap-3">
          <span>{data ? `Detail PO: ${data.po_number}` : 'Memuat Rincian...'}</span>
          {getStatusBadge()}
        </div>
      }
      isLoading={isLoading}
      onBack={() => navigate(referrer || '/pengadaan/pembelian')}
      onEdit={data && !isCheckingLock && !isLocked && referrer === '/pengadaan/pembelian' ? () => navigate(`/pengadaan/pembelian/edit/${data.id}`) : undefined}
      onDelete={data && !isCheckingLock && !isLocked && referrer === '/pengadaan/pembelian' ? handleDelete : undefined}
    >
      {data && (
      <div className="w-full space-y-6 relative">
        <div className="print:hidden">
          {referrer === '/finansial/pengeluaran' && (
            <motion.div 
              className="fixed bottom-SpacingBase right-SpacingBase z-[90]"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: [0, -10, 0]
              }}
              transition={{
                y: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                scale: { duration: 0.3 },
                opacity: { duration: 0.3 }
              }}
            >
              <PrimaryButton 
                className="shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] shadow-ColorPrimary/40 flex items-center gap-3 hover:scale-105 active:scale-95 transition-transform !rounded-full py-4 px-8 border-2 border-white/20"
                onClick={() => navigate(`/finansial/pengeluaran/tambah?purchase_id=${data.id}`)}
                id="buat-pengeluaran-btn"
              >
                <DollarSign size={20} className="animate-pulse" />
                <span className="font-black uppercase tracking-widest text-FontSizeSm">Konfirmasi</span>
              </PrimaryButton>
            </motion.div>
          )}
        </div>
        {/* NEW: Audit Trail inserted between header and content structure */}
        <div className={cn(
          "grid gap-SpacingMedium bg-white p-SpacingMedium rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm items-stretch", 
          isWide ? "grid-cols-12" : "grid-cols-1"
        )}>
          <div className={cn(
            isWide ? "col-span-3 flex flex-col justify-between h-full gap-y-SpacingMedium" : 
            isTablet ? "w-full grid grid-cols-2 gap-x-SpacingLarge gap-y-0" : 
            "w-full flex flex-col gap-y-SpacingSmall"
          )}>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="det-label-datetime" className="flex items-center gap-1.5 text-TextColorBase">
                <Calendar size={14} className="text-gray-500" />
                Tanggal Transaksi
              </Label>
              <DateTimeInput
                id="det-datetime"
                disabled
                value={data.datetime ? data.datetime.slice(0, 16) : ''}
              />
            </div>

            <div className={cn("space-y-SpacingSmall flex-1 flex flex-col justify-center", (isMobile || isTablet) ? "mt-0" : "mt-3")}>
              <Label id="det-label-po-number" className="flex items-center gap-1.5 text-TextColorBase">
                <Hash size={14} className="text-gray-500" />
                No. PO (Purchase Order)
              </Label>
              <TextInput
                id="det-po_number"
                disabled
                value={data.po_number}
                className="bg-gray-50 font-semibold"
              />
            </div>
          </div>

          <div className={cn(
            "grid gap-SpacingMedium items-stretch h-full", 
            (isWide || isTablet) ? "grid-cols-3" : "grid-cols-1",
            isWide ? "col-span-9" : "w-full"
          )}>
            <div className={cn(
              "p-5 rounded-3xl justify-center flex flex-col shadow-sm relative overflow-hidden bg-[linear-gradient(to_top,#93F9B9,#1D976C)]",
              isMobile ? "h-32" : "h-full"
            )}>
              <div className="space-y-1">
                <span className="text-Black text-[0.6875rem] font-bold uppercase tracking-wider block opacity-60">Total Harga Produk</span>
                <span className="text-Black text-[1rem] font-black tracking-tight block break-all leading-tight">
                  {formatCurrency(data.sum_product_price || 0)}
                </span>
              </div>
            </div>

            <div className={cn(
              "p-5 rounded-3xl flex flex-col justify-center shadow-sm relative overflow-hidden bg-[linear-gradient(to_bottom,#f37335,#fdc830)]",
              isMobile ? "h-32" : "h-full"
            )}>
              <div className="space-y-1">
                <span className="text-Black text-[0.6875rem] font-bold uppercase tracking-wider block opacity-60">Total Biaya Tambahan</span>
                <span className="text-Black text-[1rem] font-black tracking-tight block break-all leading-tight">
                  {formatCurrency(data.sum_added_cost || 0)}
                </span>
              </div>
            </div>

            <div className={cn(
              "p-5 rounded-3xl flex flex-col justify-center shadow-md relative overflow-hidden bg-[linear-gradient(to_bottom,#155799,#159957)] text-white",
              isMobile ? "h-32" : "h-full"
            )}>
              <div className="space-y-1">
                <span className="text-white text-[0.6875rem] font-bold uppercase tracking-wider block opacity-80">GRAND TOTAL</span>
                <span className="text-white text-[1rem] font-black tracking-tight block break-all leading-none">
                  {formatCurrency(data.grand_total_price || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SUB TAB NAVIGATION: Read-only version */}
        <div className="w-full bg-white rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm overflow-hidden">
          <div className="flex justify-center border-b border-gray-100 overflow-x-auto scrollbar-none bg-gray-50 w-full">
            <div className="flex w-full justify-center max-w-full">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                      isActive 
                        ? "border-ColorPrimary text-ColorPrimary bg-white" 
                        : "border-transparent text-TextColorBase opacity-60 hover:opacity-100 hover:bg-gray-100"
                    )}
                  >
                  {tab.label}
                </button>
              );
            })}
            </div>
          </div>

          <div className="p-SpacingBase min-h-[16rem] pb-24">
            {activeTab === 'supplier' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className={cn("flex items-start gap-SpacingLarge", isMobile ? "flex-col" : "flex-row")}>
                  <div className={cn("grid gap-x-SpacingLarge gap-y-SpacingMedium", isMobile ? "w-full grid-cols-1" : "w-1/2 grid-cols-2")}>
                    <div className="space-y-SpacingSmall">
                      <Label id="det-label-supplier">Nama Suplier</Label>
                      <ValueBox>{supplier?.name || '-'}</ValueBox>
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="det-label-bank">Nama Bank</Label>
                      <ValueBox>{supplier?.bank_name || '-'}</ValueBox>
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="det-label-telepon">Telepon</Label>
                      <ValueBox>
                        <PhoneDisplay value={supplier?.telepon} />
                      </ValueBox>
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="det-label-rek">No. Rekening</Label>
                      <ValueBox>{supplier?.no_rekening || '-'}</ValueBox>
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="det-label-email">Email</Label>
                      <ValueBox>{supplier?.email || '-'}</ValueBox>
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="det-label-pemilik">Pemilik Rekening</Label>
                      <ValueBox>{supplier?.nama_pemilik_rekening || '-'}</ValueBox>
                    </div>
                    <div className={cn("space-y-SpacingSmall", !isMobile && "col-span-2")}>
                      <Label id="det-label-alamat">Alamat Lengkap</Label>
                      <ValueBox className="items-start py-SpacingBase leading-relaxed">
                        {supplier?.alamat || '-'}
                      </ValueBox>
                    </div>
                  </div>
                  <div className={cn(
                    "relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner",
                    isMobile ? "w-full h-[18rem]" : "w-1/2 h-[26rem]"
                  )}>
                    <MapViewer
                      id="det-supplier-map"
                      latlong={supplier?.latlong || '-6.200000,106.816666'}
                      label={supplier?.name || 'Lokasi Suplier'}
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="overflow-x-auto w-full animate-in fade-in duration-200">
                <Table id="det-products-table" noBorder={true}>
                  <TableHeader>
                    <TableRow noBorder={true} isHeader={true}>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Kuantitas</TableHead>
                      <TableHead>Harga Satuan</TableHead>
                      <TableHead>Total Harga</TableHead>
                      <TableHead>Kadar Air</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!data.products || data.products.length === 0) ? (
                      <TableRow noBorder={true}>
                        <TableCell colSpan={6} className="text-center py-SpacingLarge text-TextColorMuted">Tidak ada produk.</TableCell>
                      </TableRow>
                    ) : (
                      data.products.map((row, index) => (
                        <TableRow key={row.id || index} noBorder={true}>
                          <TableCell className="!text-left px-SpacingBase">
                            <div className="flex flex-col">
                              <span className="font-semibold text-FontSizeXs text-TextColorBase leading-tight">
                                {row.name}
                              </span>
                              {(row.category || row.sub_category) && (
                                <span className="text-TextColorMuted text-FontSizeNano leading-tight mt-0.5">
                                  {row.category} {row.sub_category ? `> ${row.sub_category}` : ''}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{row.unit}</TableCell>
                          <TableCell>{row.qty}</TableCell>
                          <TableCell>{formatCurrency(row.price_per_unit || 0)}</TableCell>
                          <TableCell>{formatCurrency(row.sum_price || 0)}</TableCell>
                          <TableCell>{row.kadar_air ? `${row.kadar_air}%` : '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === 'costs' && (
              <div className="overflow-x-auto w-full animate-in fade-in duration-200">
                <Table id="det-costs-table" noBorder={true}>
                  <TableHeader>
                    <TableRow noBorder={true} isHeader={true}>
                      <TableHead>Jenis / Tipe Biaya</TableHead>
                      <TableHead>Nominal Biaya</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!data.additional_costs || data.additional_costs.length === 0) ? (
                      <TableRow noBorder={true}>
                        <TableCell colSpan={3} className="text-center py-SpacingLarge text-TextColorMuted">Tidak ada biaya tambahan.</TableCell>
                      </TableRow>
                    ) : (
                      data.additional_costs.map((row, index) => (
                        <TableRow key={row.id || index} noBorder={true}>
                          <TableCell className="!text-left px-SpacingBase">
                            <span className="font-semibold !text-FontSizeXs !text-center text-TextColorBase">{row.type}</span>
                          </TableCell>
                          <TableCell>{formatCurrency(row.cost || 0)}</TableCell>
                          <TableCell className="text-left !text-FontSizeXs">{row.description || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className={cn("grid gap-SpacingMedium", isMobile ? "grid-cols-1" : "grid-cols-4")}>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-pay-type">Jenis Payment</Label>
                    <ToggleButton
                      disabled
                      labelClassName="!text-FontSizeXs"
                      options={[
                        { label: 'Lunas', value: TPembelianPaymentType.LUNAS },
                        { label: 'Tempo', value: TPembelianPaymentType.TEMPO }
                      ]}
                      value={data.payment_type || TPembelianPaymentType.LUNAS}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-pay-method">Metode Payment</Label>
                    <ToggleButton
                      disabled
                      labelClassName="!text-FontSizeXs"
                      options={[
                        { label: 'Tunai', value: TPembelianPaymentMethod.TUNAI },
                        { label: 'Non Tunai', value: TPembelianPaymentMethod.NON_TUNAI }
                      ]}
                      value={data.payment_method || TPembelianPaymentMethod.TUNAI}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-bank">Sumber Transaksi</Label>
                    <FixedDropdown
                      disabled
                      options={[{ label: bankAccount?.nama_akun || 'Rekening Utama', value: data.bank_and_cash_id }]}
                      value={data.bank_and_cash_id}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-ship-type">Jenis Pengiriman</Label>
                    <FixedDropdown
                      disabled
                      options={[
                        { label: 'Internal (Gudang)', value: TPembelianShippingType.INTERNAL },
                        { label: 'Customer (Langsung)', value: TPembelianShippingType.CUSTOMER }
                      ]}
                      value={data.shipping_type || TPembelianShippingType.INTERNAL}
                      onChange={() => {}}
                    />
                  </div>
                </div>

                <div className={cn("grid gap-SpacingMedium", isMobile ? "grid-cols-1" : "grid-cols-4")}>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-deposit">Deposit (Rp)</Label>
                    <PriceInput 
                      disabled 
                      value={data.deposit || 0} 
                      className={cn(data.payment_type !== TPembelianPaymentType.TEMPO && "bg-Black/5 opacity-opacity-OpacityMid")}
                      onChange={() => {}} 
                    />
                  </div>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-outstanding">Outstanding (Rp)</Label>
                    <TextInput 
                      disabled 
                      value={formatCurrency(data.outstanding || 0)} 
                      className={cn("font-medium", data.payment_type !== TPembelianPaymentType.TEMPO ? "bg-Black/5 opacity-opacity-OpacityMid" : "bg-gray-100")} 
                    />
                  </div>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-sla">Service Level Agreement</Label>
                    <DateInput 
                      disabled 
                      value={data.sla_date ? data.sla_date.slice(0, 10) : ''} 
                      className={cn(data.payment_type !== TPembelianPaymentType.TEMPO && "bg-Black/5 opacity-opacity-OpacityMid")}
                    />
                  </div>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-customer">Relasi Customer</Label>
                    <FixedDropdown
                      disabled
                      options={[{ label: customer?.name || 'Internal / Tanpa Relasi', value: data.customer_id || '' }]}
                      value={data.customer_id || ''}
                      onChange={() => {}}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customer' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-start gap-4 bg-ColorPrimary/5 p-SpacingBase rounded-RadiusMedium border border-ColorPrimary/20">
                  <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-FontSizeXs text-TextColorBase font-bold leading-none">
                      Metode Pengiriman Logistik: {data.shipping_type === TPembelianShippingType.INTERNAL ? 'Gudang Internal' : 'Customer (Langsung)'}
                    </p>
                    <p className="text-FontSizeXs text-TextColorBase leading-relaxed">
                      {data.shipping_type === TPembelianShippingType.INTERNAL 
                        ? 'Pengiriman dialokasikan ke Gudang Operasional Internal.' 
                        : 'Berikut adalah rincian data customer penerima barang untuk pengiriman langsung.'}
                    </p>
                  </div>
                </div>

                {data.shipping_type === TPembelianShippingType.CUSTOMER ? (
                  <div className={cn("flex gap-SpacingLarge items-start", isMobile ? "flex-col" : "flex-row")}>
                    <div className={cn("grid gap-y-SpacingMedium", isMobile ? "w-full grid-cols-1" : "w-1/3 grid-cols-1")}>
                      <div className="space-y-SpacingSmall">
                        <Label id="det-label-cust-name">Nama Customer</Label>
                        <ValueBox>{customer?.name || '-'}</ValueBox>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-SpacingLarge">
                        <div className="space-y-SpacingSmall">
                          <Label id="det-label-cust-company">Perusahaan</Label>
                          <ValueBox>{customer?.company || '-'}</ValueBox>
                        </div>
                        <div className="space-y-SpacingSmall">
                          <Label id="det-label-cust-bidang">Bidang Usaha</Label>
                          <ValueBox>{customer?.bidang_usaha || '-'}</ValueBox>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-SpacingLarge">
                        <div className="space-y-SpacingSmall">
                          <Label id="det-label-cust-tel">Telepon</Label>
                          <ValueBox>
                            <PhoneDisplay value={customer?.telepon} />
                          </ValueBox>
                        </div>
                        <div className="space-y-SpacingSmall">
                          <Label id="det-label-cust-email">Email</Label>
                          <ValueBox>{customer?.email || '-'}</ValueBox>
                        </div>
                      </div>

                      <div className="space-y-SpacingSmall">
                        <Label id="det-label-cust-alamat">Alamat Pengiriman</Label>
                        <ValueBox className="items-start py-SpacingBase leading-relaxed min-h-[6rem]">
                          {customer?.alamat || '-'}
                        </ValueBox>
                      </div>
                    </div>
                    <div className={cn(
                      "relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner",
                      isMobile ? "w-full h-[18rem]" : "w-2/3 h-[26rem]"
                    )}>
                      <MapViewer
                        id="det-customer-map"
                        latlong={customer?.latlong || '-6.2088,106.8456'}
                        label={customer?.name || 'Destinasi Pelanggan'}
                        height="100%"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-SpacingHuge bg-gray-50 border border-dashed border-gray-200 rounded-RadiusLarge text-TextColorMuted">
                    <Package size={48} className="opacity-20 mb-SpacingBase" />
                    <p className="font-semibold">Logistik Internal (Gudang)</p>
                    <p className="text-FontSizeNano text-center max-w-md mt-2">
                      Pesanan ini dialokasikan untuk stok gudang operasional perusahaan. Tidak ada detail customer terkait.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attachment' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid gap-SpacingLarge w-full grid-cols-1 lg:grid-cols-2">
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-additional-desc" className="flex items-center gap-1.5 text-TextColorBase">
                      <FileText size={14} className="text-ColorPrimary" />
                      DESKRIPSI DOKUMEN TRANSAKSI
                    </Label>
                    <div className="p-SpacingBase bg-white border border-ColorSidebarBorder/10 rounded-RadiusLarge min-h-[160px] text-FontSizeXs text-TextColorBase">
                      {data.additional_description || 'Tidak ada deskripsi.'}
                    </div>
                  </div>
                  <div className="space-y-SpacingSmall">
                    <Label id="det-label-proof-files" className="flex items-center gap-1.5 text-TextColorBase">
                      <Paperclip size={14} className="text-ColorPrimary" />
                      BERKAS PENDUKUNG DOKUMEN (*)
                    </Label>
                    <div className="p-SpacingBase bg-white border border-ColorSidebarBorder/10 rounded-RadiusLarge min-h-[160px]">
                      <AttachmentDisplay files={data.proof_fileurl} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Trail position: Bottom of content */}
        <AuditTrail 
          createdAt={data.created_at}
          createdBy={data.created_by}
          createdTimezone={data.created_timezone}
          updatedAt={data.updated_at}
          updatedBy={data.updated_by}
          updatedTimezone={data.updated_timezone}
        />
      </div>
      )}
    </DetailShell>
  );
};

export default PembelianDetailPage;

