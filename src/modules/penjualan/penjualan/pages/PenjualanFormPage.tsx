import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { TextInput, PriceInput, LongTextInput, NumberInput, PhoneInput, EmailInput } from '../../../../ui/components/elements/Inputs';
import { DateTimeInput, DateInput } from '../../../../ui/components/elements/DateTimeInput';
import { MultipleUploadInput } from '../../../../ui/components/elements/UploadInput';
import { Label } from '../../../../ui/components/elements/Label';
import { FixedDropdown, CustomValueDropdown } from '../../../../ui/components/elements/Dropdown';
import { ToggleButton } from '../../../../ui/components/elements/ToggleButton';
import { 
  ITs_Penjualan, 
  ITs_PenjualanProduk, 
  ITs_PenjualanBiaya 
} from '../../../../logic/types/ITs_Penjualan';
import { ICustomer } from '../../../../logic/types/ITs_Customer';
import { IBankAndCash, TBankAndCashType } from '../../../../logic/types/ITs_BankAndCash';
import { penjualanService } from '../../../../logic/services/penjualanService';
import { customerService } from '../../../../logic/services/customerService';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { stokBerjalanService } from '../../../../logic/services/stokBerjalanService';
import { akunService } from '../../../../logic/services/akunService';
import { storageService } from '../../../../logic/services/storage';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { MapPicker } from '../../../../ui/components/elements/MapPicker';
import { MapViewer } from '../../../../ui/components/elements/MapViewer';
import { useLocation } from '../../../../logic/hooks/useLocation';
import { reverseGeocode } from '../../../../logic/utils/map';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { Modal } from '../../../../ui/components/common/Modal';
import { Tabs } from '../../../../ui/components/common/Tabs';
import { PrimaryButton, DangerButton, GhostButton, SecondaryButton } from '../../../../ui/components/elements/Button';
import { processFileBeforeUpload } from '../../../../logic/utils/fileProcessor';
import { formatCurrency } from '../../../../logic/utils/data';
import { daftarHargaService } from '../../../../logic/services/daftarHargaService';
import { IDaftarHarga, ITieredPrice } from '../../../../logic/types/ITs_DaftarHarga';
import { TPeran } from '../../../../logic/types/ITs_Akun';
import { 
  User as UserIcon, 
  Package, 
  DollarSign, 
  CreditCard, 
  Paperclip, 
  Calendar, 
  Hash, 
  Info,
  Plus,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';

type TActiveTab = 'customer' | 'products' | 'costs' | 'payment' | 'attachment';

export const PenjualanFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;
  const { getLocation } = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TActiveTab>('customer');

  // Master options
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<IBankAndCash[]>([]);
  const [salesOptions, setSalesOptions] = useState<{ label: string; value: string; id: string }[]>([]);
  const [approverOptions, setApproverOptions] = useState<{ label: string; value: string; id: string }[]>([]);
  const [availableStocks, setAvailableStocks] = useState<{ label: string; value: string; price: number; unit: string; sku: string }[]>([]);
  const [dynamicBidangOptions, setDynamicBidangOptions] = useState<{ label: string; value: string }[]>([]);

  // Local state for customer to replicate CustomerFormPage layout (Sync with PembelianFormPage behavior)
  const [customerFormData, setCustomerFormData] = useState<Partial<ICustomer>>({
    name: '',
    company: '',
    bidang_usaha: '',
    telepon: '',
    email: '',
    alamat: '',
    latlong: ''
  });
  
  // customerMode: 'locked' (initial state), 'existing', or 'new'
  const [customerMode, setCustomerMode] = useState<'locked' | 'existing' | 'new'>('locked');

  // Form State
  const [formData, setFormData] = useState<Partial<ITs_Penjualan>>({
    datetime: (() => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    })(),
    invoice_number: 'INV-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
    customer_id: '',
    sales_name: '',
    discount_type: 'price',
    discount_value: 0,
    discount_amount: 0,
    payment_type: 'Lunas',
    deposit: 0,
    outstanding: 0,
    payment_method: 'Tunai',
    bank_cash_source_id: '',
    payment_proof_fileurls: [],
    status: 'Draft',
    keterangan: '',
    items: [],
    costs: []
  });

  const [files, setFiles] = useState<File[]>([]);

  // Item Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [productModalTab, setProductModalTab] = useState<'reguler' | 'mixing' | 'dropship'>('reguler');
  const [itemFormData, setItemFormData] = useState<Partial<ITs_PenjualanProduk & { mixing_composition: any[]; kategori?: string; sub_kategori?: string }>>({
    sku: '',
    name: '',
    kategori: '',
    sub_kategori: '',
    unit: 'Unit',
    qty: 1,
    unit_selling_price: 0,
    unit_base_price: 0,
    is_mixing: false,
    mixing_composition: []
  });

  const [compositionFormData, setCompositionFormData] = useState({
    sku: '',
    qty: 1,
    base_price: 0,
    name: '',
    unit: ''
  });

  // Cost Modal States
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [editingCostIndex, setEditingCostIndex] = useState<number | null>(null);
  const [costFormData, setCostFormData] = useState<Partial<ITs_PenjualanBiaya>>({
    nama_biaya: '',
    nominal: 0,
    keterangan: ''
  });

  const [currentPriceTiers, setCurrentPriceTiers] = useState<ITieredPrice[]>([]);
  const [isCompSkuModalOpen, setIsCompSkuModalOpen] = useState(false);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  const calculateSellingPrice = (qty: number, tiers: ITieredPrice[], defaultPrice: number) => {
    if (!tiers || tiers.length === 0) return defaultPrice;
    const sortedTiers = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
    const applicableTier = sortedTiers.find(t => qty >= t.min_qty);
    return applicableTier ? applicableTier.price : defaultPrice;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [customersData, banksData, stocksData, bidangOptions, accountsData] = await Promise.all([
          customerService.getAll(),
          bankAndCashService.getAll(),
          stokBerjalanService.getAll(true),
          customerService.getDistinctBidangUsaha(),
          akunService.getAll()
        ]);
        setCustomers(customersData);
        setBankAccounts(banksData);
        setDynamicBidangOptions(bidangOptions);

        // Filter accounts: Admin or has Marketing module access
        const filteredSales = accountsData.filter(acc => 
          acc.peran === TPeran.ADMIN || 
          acc.akses_modul.includes('Marketing')
        ).map(acc => ({
          label: acc.username,
          value: acc.username,
          id: acc.id
        }));
        setSalesOptions(filteredSales);

        // Filter Approvers: Admin and has_invoice_approval === true
        const filteredApprovers = accountsData.filter(acc => 
          acc.peran === TPeran.ADMIN && 
          acc.has_invoice_approval
        ).map(acc => ({
          label: acc.username,
          value: acc.username,
          id: acc.id
        }));
        setApproverOptions(filteredApprovers);

        setAvailableStocks(stocksData.map(s => ({
          label: `${s.sku} - ${s.name}`,
          value: s.sku,
          price: s.price_per_unit_running || s.base_price,
          unit: s.unit,
          sku: s.sku,
          name: s.name
        } as any)));

        if (isEdit && id) {
          const detail = await penjualanService.getById(id);
          if (detail) {
            setFormData({
              ...detail,
              datetime: detail.datetime.slice(0, 16),
              sla_date: detail.sla_date ? detail.sla_date.slice(0, 10) : ''
            });

            if ((detail as any).is_dropship_locked) {
              setIsLocked(true);
            }

            // Sync customer info for the new UI tab
            if (detail.customer_id) {
               const matchedCustomer = customersData.find(c => c.id === detail.customer_id);
               if (matchedCustomer) {
                  setCustomerFormData({
                     name: matchedCustomer.name,
                     company: matchedCustomer.company || '',
                     bidang_usaha: matchedCustomer.bidang_usaha || '',
                     telepon: matchedCustomer.telepon,
                     email: matchedCustomer.email || '',
                     alamat: matchedCustomer.alamat,
                     latlong: matchedCustomer.latlong
                  });
                  setCustomerMode('existing');
               }
            }
          }
        } else if (banksData.length > 0) {
          setFormData(prev => ({ ...prev, bank_cash_source_id: banksData[0].id }));
        }
      } catch (error) {
        toast.error('Gagal memuat data master');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isEdit, id]);

  const calculateTotals = (
    items: ITs_PenjualanProduk[],
    costs: ITs_PenjualanBiaya[],
    discountType: 'price' | 'percent',
    discountValue: number
  ) => {
    const sum_product_price = items.reduce((acc, item) => acc + (item.unit_selling_price * item.qty), 0);
    const sum_added_cost = costs.reduce((acc, cost) => acc + cost.nominal, 0);
    
    let discount_amount = 0;
    if (discountType === 'percent') {
      discount_amount = (sum_product_price * discountValue) / 100;
    } else {
      discount_amount = discountValue;
    }

    const grand_total = (sum_product_price + sum_added_cost) - discount_amount;
    const outstanding = formData.payment_type === 'Tempo' ? grand_total - (formData.deposit || 0) : 0;

    setFormData(prev => ({
      ...prev,
      sum_product_price,
      sum_added_cost,
      discount_amount,
      grand_total,
      outstanding
    }));
  };

  const isProductFormValid = 
    itemFormData.name && 
    (itemFormData.qty || 0) > 0 && 
    (itemFormData.unit_selling_price || 0) >= 0 && 
    itemFormData.kategori && 
    itemFormData.sub_kategori &&                
    (productModalTab === 'reguler' ? itemFormData.sku : 
     productModalTab === 'mixing' ? (itemFormData.mixing_composition?.length || 0) > 0 : 
     true);

  const handleSaveItem = () => {
    if (!isProductFormValid) {
       toast.error('Mohon lengkapi data produk (Nama, Qty, Harga Jual, dan SKU/Komposisi)');
       return;
    }
    const newItems = [...(formData.items || [])];
    const item: ITs_PenjualanProduk = {
      ...(itemFormData as ITs_PenjualanProduk),
      id: itemFormData.id || Math.random().toString(36).substr(2, 9),
      total_selling_price: (itemFormData.unit_selling_price || 0) * (itemFormData.qty || 0),
      total_base_price: (itemFormData.unit_base_price || 0) * (itemFormData.qty || 0),
      margin_amount: ((itemFormData.unit_selling_price || 0) - (itemFormData.unit_base_price || 0)) * (itemFormData.qty || 0),
      margin_percentage: (itemFormData.unit_selling_price || 0) > 0 ? (((itemFormData.unit_selling_price || 0) - (itemFormData.unit_base_price || 0)) / (itemFormData.unit_selling_price || 0)) * 100 : 0,
      created_at: itemFormData.created_at || new Date().toISOString(),
      penjualan_id: id || '',
      created_timezone: 'Asia/Jakarta'
    };

    if (editingItemIndex !== null) {
      newItems[editingItemIndex] = item;
    } else {
      newItems.push(item);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
    calculateTotals(newItems, formData.costs || [], formData.discount_type || 'price', formData.discount_value || 0);
    setIsProductModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleSaveCost = () => {
    if (!costFormData.nama_biaya || (costFormData.nominal || 0) <= 0) {
      toast.error('Nama Biaya dan Nominal wajib diisi');
      return;
    }
    const newCosts = [...(formData.costs || [])];
    const cost: ITs_PenjualanBiaya = {
      ...(costFormData as ITs_PenjualanBiaya),
      id: costFormData.id || Math.random().toString(36).substr(2, 9),
      created_at: costFormData.created_at || new Date().toISOString(),
      penjualan_id: id || '',
      created_timezone: 'Asia/Jakarta'
    };

    if (editingCostIndex !== null) {
      newCosts[editingCostIndex] = cost;
    } else {
      newCosts.push(cost);
    }

    setFormData(prev => ({ ...prev, costs: newCosts }));
    calculateTotals(formData.items || [], newCosts, formData.discount_type || 'price', formData.discount_value || 0);
    setIsCostModalOpen(false);
    setEditingCostIndex(null);
  };

  const detectCustomerLocation = async () => {
    const loc = await getLocation();
    if (loc) {
      const coords = `${loc.latitude},${loc.longitude}`;
      setCustomerFormData(prev => ({ ...prev, latlong: coords }));
      
      const addr = await reverseGeocode(loc.latitude, loc.longitude);
      if (addr) {
        setCustomerFormData(prev => ({ ...prev, alamat: addr }));
      }
    } else {
      setCustomerFormData(prev => ({ ...prev, latlong: '-6.2088,106.8456' }));
    }
  };

  const handleCustomerMapChange = async (pos: { lat: number, lng: number }) => {
    if (customerMode !== 'new') return;
    const coords = `${pos.lat},${pos.lng}`;
    setCustomerFormData(prev => ({ ...prev, latlong: coords }));
    
    const addr = await reverseGeocode(pos.lat, pos.lng);
    if (addr) {
      setCustomerFormData(prev => ({ ...prev, alamat: addr }));
    }
  };

  const handleCustomerChange = (val: string) => {
    const found = customers.find(c => c.id === val || c.name === val);
    if (found) {
      setFormData(prev => ({ ...prev, customer_id: found.id }));
      setCustomerFormData({
        name: found.name,
        company: found.company || '',
        bidang_usaha: found.bidang_usaha || '',
        telepon: found.telepon,
        email: found.email || '',
        alamat: found.alamat,
        latlong: found.latlong
      });
      setCustomerMode('existing');
    } else {
      setFormData(prev => ({ ...prev, customer_id: '' }));
      setCustomerFormData({
        name: val,
        company: '',
        bidang_usaha: '',
        telepon: '',
        email: '',
        alamat: '',
        latlong: '-6.2088,106.8456'
      });
      setCustomerMode('new');
      detectCustomerLocation();
    }
  };

  const handleSave = async () => {
    if (customerMode === 'locked') {
      toast.error('Pilih customer terlebih dahulu');
      setActiveTab('customer');
      return;
    }

    setIsLoading(true);
    try {
      let finalCustomerId = formData.customer_id;
      
      // Auto-create customer if in 'new' mode (from Map Picker)
      if (customerMode === 'new') {
        if (!customerFormData.name || !customerFormData.telepon || !customerFormData.alamat || !customerFormData.latlong) {
          toast.error('Gagal menyimpan: Semua kolom wajib (*) pada Customer baru harus diisi lengkap');
          setActiveTab('customer');
          setIsLoading(false);
          return;
        }
        const createdCustomer = await customerService.create({
          name: customerFormData.name!,
          company: customerFormData.company || '',
          bidang_usaha: customerFormData.bidang_usaha || '',
          telepon: customerFormData.telepon!,
          email: customerFormData.email || '',
          alamat: customerFormData.alamat!,
          latlong: customerFormData.latlong || '-6.2088,106.8456'
        } as ICustomer);
        if (createdCustomer) {
          finalCustomerId = createdCustomer.id;
        } else {
          throw new Error('Gagal membuat customer baru');
        }
      }

      if (!finalCustomerId) {
        toast.error('Pilih customer terlebih dahulu');
        setActiveTab('customer');
        setIsLoading(false);
        return;
      }

      if ((formData.items?.length || 0) === 0) {
        toast.error('Daftar produk tidak boleh kosong');
        setActiveTab('products');
        setIsLoading(false);
        return;
      }

      let finalProofFiles = formData.payment_proof_fileurls || [];
      if (files.length > 0) {
         const uploadResults = await Promise.all(
           files.map(async f => {
             const processed = await processFileBeforeUpload(f);
             return storageService.upload(processed, 'sales');
           })
         );
         finalProofFiles = [...finalProofFiles, ...uploadResults.map(r => r.url)];
      }

      const payload = {
        ...formData,
        customer_id: finalCustomerId,
        payment_proof_fileurls: finalProofFiles
      };

      if (isEdit && id) {
        await penjualanService.update(id, payload, formData.items, formData.costs);
        toast.success('Penjualan berhasil diperbarui');
        navigate('/penjualan/penjualan');
      } else {
        await penjualanService.create(payload, formData.items || [], formData.costs || []);
        toast.success('Penjualan berhasil dicatat');
        navigate('/penjualan/penjualan');
      }
    } catch (error) {
      toast.error('Gagal menyimpan penjualan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompositionInline = async (sku: string) => {
    const stock = availableStocks.find(s => s.sku === sku);
    if (!stock) return;

    try {
      const priceData = await daftarHargaService.getBySku(sku);
      
      if (!priceData || !priceData.tiered_pricing || priceData.tiered_pricing.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Memilih Produk',
          text: 'Belum ada daftar harga untuk produk ini.',
          confirmButtonColor: 'var(--ColorPrimary)'
        });
        return;
      }

      const tiers = priceData.tiered_pricing;
      const suggestedPrice = calculateSellingPrice(1, tiers, stock.price);

      const newItem = {
        sku: stock.sku,
        name: stock.name,
        unit: stock.unit,
        qty_composition: 1,
        total_qty: 1 * (itemFormData.qty || 1),
        base_price_snapshot: stock.price,
        total_base_price: stock.price * 1,
        selling_price_snapshot: suggestedPrice
      };

      const next = [...(itemFormData.mixing_composition || []), newItem];
      
      const newBasePrice = next.reduce((acc, c) => acc + (c.base_price_snapshot * c.qty_composition), 0);
      const newSellingPrice = next.reduce((acc, c) => acc + (c.selling_price_snapshot * c.qty_composition), 0);
      const totalQty = next.reduce((acc, c) => acc + c.qty_composition, 0);

      setItemFormData(prev => ({
        ...prev,
        mixing_composition: next,
        unit_base_price: newBasePrice / (totalQty || 1),
        unit_selling_price: newSellingPrice / (totalQty || 1),
        qty: totalQty,
        unit: next[0]?.unit || prev.unit
      }));
    } catch (error) {
      toast.error('Gagal memuat harga komponen');
    }
  };

  const handleUpdateCompositionQty = async (index: number, newQty: number) => {
    const comps = [...(itemFormData.mixing_composition || [])];
    const item = comps[index];
    
    try {
      const priceData = await daftarHargaService.getBySku(item.sku);
      const tiers = priceData?.tiered_pricing || [];
      const tierPrice = calculateSellingPrice(newQty, tiers, item.base_price_snapshot);
      
      comps[index] = {
        ...item,
        qty_composition: newQty,
        total_qty: newQty * (itemFormData.qty || 1),
        total_base_price: item.base_price_snapshot * newQty,
        selling_price_snapshot: tierPrice
      };
      
      const sumBase = comps.reduce((acc, c) => acc + (c.base_price_snapshot * c.qty_composition), 0);
      const sumSelling = comps.reduce((acc, c) => acc + (c.selling_price_snapshot * c.qty_composition), 0);
      const totalQty = comps.reduce((acc, c) => acc + c.qty_composition, 0);
      
      setItemFormData(prev => ({
        ...prev,
        mixing_composition: comps,
        unit_base_price: sumBase / (totalQty || 1),
        unit_selling_price: sumSelling / (totalQty || 1),
        qty: totalQty
      }));
    } catch (err) {
      // Silent error
    }
  };

  const removeCompositionItem = (index: number) => {
    const next = [...(itemFormData.mixing_composition || [])];
    next.splice(index, 1);
    
    const sumBase = next.reduce((acc, cur) => acc + (cur.base_price_snapshot * cur.qty_composition), 0);
    const sumSelling = next.reduce((acc, cur) => acc + (cur.selling_price_snapshot * cur.qty_composition), 0);
    const totalQty = next.reduce((acc, c) => acc + c.qty_composition, 0);
    
    setItemFormData(prev => ({ 
      ...prev, 
      mixing_composition: next, 
      unit_base_price: sumBase / (totalQty || 1),
      unit_selling_price: sumSelling / (totalQty || 1),
      qty: totalQty,
      unit: next[0]?.unit || prev.unit
    }));
  };

  const tabs: { key: TActiveTab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'customer', label: 'Customer', icon: UserIcon },
    { key: 'products', label: 'Produk', icon: Package },
    { key: 'costs', label: 'Biaya', icon: DollarSign },
    { key: 'payment', label: 'Pembayaran', icon: CreditCard },
    { key: 'attachment', label: 'Lampiran', icon: FileText },
  ];

  const isCostFormValid = !!(costFormData.nama_biaya && (costFormData.nominal || 0) > 0);

  const filteredBankOptions = bankAccounts.filter(b => {
    if (formData.payment_method === 'Tunai') return b.tipe === TBankAndCashType.KAS;
    return b.tipe === TBankAndCashType.BANK;
  }).map(b => ({ label: b.nama_akun, value: b.id }));

  const isCustomerValid = !!(customerMode === 'existing' 
    ? formData.customer_id 
    : customerMode === 'new'
      ? (customerFormData.name && customerFormData.telepon && customerFormData.alamat && customerFormData.latlong)
      : false);

  const areProductsValid = (formData.items?.length || 0) > 0;

  const isPaymentDataComplete = !!(formData.bank_cash_source_id && filteredBankOptions.some(opt => opt.value === formData.bank_cash_source_id) && (
    formData.payment_type === 'Tempo' 
      ? (formData.deposit !== undefined && formData.sla_date) 
      : true
  ));

  const isPaymentValid = isPaymentDataComplete && !!formData.approver_id;

  const isFormValid = isCustomerValid && areProductsValid && !!formData.invoice_number && isPaymentValid;

  return (
    <FormShell
      id="penjualan-form-shell"
      title={isEdit ? 'Ubah Penjualan' : 'Tambah Penjualan'}
      subtitle={isLocked ? 'Transaksi ini TERKUNCI karena produk dropship sedang/sudah diproses di modul Pembelian.' : isEdit ? 'Edit transaksi penjualan terdaftar.' : 'Catat transaksi penjualan baru ke pelanggan.'}
      onSave={activeTab === 'attachment' && !isLocked ? handleSave : undefined}
      onCancel={() => navigate('/penjualan/penjualan')}
      onBack={() => navigate('/penjualan/penjualan')}
      isLoading={isLoading}
      isSaveDisabled={isLoading || !isFormValid || isLocked}
    >
      <div className="w-full space-y-6">
        {isLocked && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <Info size={20} className="text-red-500" />
            <p className="text-red-700 text-sm font-bold">
              PERINGATAN: Transaksi ini tidak dapat diubah atau dihapus karena sudah mulai diproses untuk pemenuhan dropship di modul Pengadaan.
            </p>
          </div>
        )}
        {/* ROW 1: Tanggal, Invoice No, and Summary Cards */}
        <div className={cn("grid gap-SpacingMedium bg-white p-SpacingMedium rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm items-stretch", isMobile ? "grid-cols-1" : "grid-cols-12")}>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 h-full", isMobile ? "col-span-1" : "col-span-5")}>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="label-datetime" required className="flex items-center gap-1.5 text-TextColorBase">
                <Calendar size={14} className="text-gray-500" />
                Tanggal Transaksi
              </Label>
              <DateTimeInput
                id="datetime"
                value={formData.datetime || ''}
                onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
              />
            </div>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="label-approver" required className="flex items-center gap-1.5 text-TextColorBase">
                <UserIcon size={14} className="text-gray-500" />
                Approver
              </Label>
              <FixedDropdown
                id="approver_id"
                options={approverOptions.map(o => ({ label: o.label, value: o.value }))}
                value={formData.approver_name || ''}
                onChange={(val) => {
                  const selected = approverOptions.find(o => o.value === val);
                  setFormData({ 
                    ...formData, 
                    approver_name: String(val), 
                    approver_id: selected?.id, 
                    approval_status: 'Pending' 
                  });
                }}
                placeholder="Pilih verifikator..."
              />
            </div>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="label-invoice-number" required className="flex items-center gap-1.5 text-TextColorBase">
                <Hash size={14} className="text-gray-500" />
                No. Invoice
              </Label>
              <TextInput
                id="invoice_number"
                value={formData.invoice_number || ''}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="bg-ColorBg/OpacitySubtle font-semibold"
              />
            </div>
            <div className="space-y-SpacingSmall flex-1 flex flex-col justify-center">
              <Label id="label-sales-name">Nama Sales</Label>
              <FixedDropdown
                id="sales_name"
                options={salesOptions}
                value={formData.sales_name || ''}
                onChange={(val) => {
                  const selected = salesOptions.find(o => o.value === val);
                  setFormData({ ...formData, sales_name: String(val), sales_id: selected?.id });
                }}
                placeholder="Pilih sales..."
              />
            </div>
          </div>

          <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-SpacingMedium items-stretch h-full", isMobile ? "col-span-1" : "col-span-7")}>
            <div className="bg-[linear-gradient(to_top,#93F9B9,#1D976C)] p-5 rounded-3xl justify-center flex flex-col shadow-sm h-32 md:h-full">
              <span className="text-Black text-[0.6875rem] font-bold uppercase opacity-60">Total Produk</span>
              <span className="text-Black text-[1.25rem] font-black tracking-tight leading-tight">
                {formatCurrency(formData.sum_product_price || 0)}
              </span>
            </div>
            <div className="bg-[linear-gradient(to_bottom,#f37335,#fdc830)] p-5 rounded-3xl flex flex-col justify-center shadow-sm h-32 md:h-full">
              <span className="text-Black text-[0.6875rem] font-bold uppercase opacity-60">Total Biaya</span>
              <span className="text-Black text-[1.25rem] font-black tracking-tight leading-tight">
                {formatCurrency(formData.sum_added_cost || 0)}
              </span>
            </div>
            <div className="bg-[linear-gradient(to_bottom,#155799,#159957)] text-white p-5 rounded-3xl flex flex-col justify-center shadow-md h-32 md:h-full">
              <span className="text-white text-[0.6875rem] font-bold uppercase opacity-80">GRAND TOTAL</span>
              <span className="text-white text-[1.25rem] font-black tracking-tight leading-none">
                {formatCurrency(formData.grand_total || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="w-full bg-white rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm overflow-hidden">
          <div className="flex justify-center border-b border-gray-100 overflow-x-auto bg-gray-50 w-full">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              
              // Validate tabs
              let isInvalid = false;
              if (tab.key === 'customer') isInvalid = !isCustomerValid;
              else if (tab.key === 'products') isInvalid = !areProductsValid;
              else if (tab.key === 'payment') isInvalid = !isPaymentDataComplete;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap relative",
                    isActive 
                      ? "border-ColorPrimary text-ColorPrimary bg-white" 
                      : "border-transparent text-TextColorBase opacity-60 hover:opacity-100 hover:bg-gray-100"
                  )}
                >
                  {tab.label}
                  {isInvalid && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-SpacingBase min-h-[16rem]">
            {activeTab === 'customer' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-start gap-3 bg-ColorPrimary/5 p-SpacingBase rounded-RadiusMedium border border-ColorPrimary/20">
                  <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                  <p className="text-FontSizeXs text-TextColorBase font-medium leading-relaxed">
                    Pilih pelanggan yang terdaftar dalam database, atau ketik nama baru untuk mendaftarkannya secara otomatis. Jika memilih pelanggan terdaftar, data detail akan dikunci secara otomatis.
                  </p>
                </div>

                <div className={cn(
                  "grid gap-SpacingLarge w-full",
                  isMobile ? "grid-cols-1" : "grid-cols-2"
                )}>
                  {/* Left Column: Form Inputs (1 part) */}
                  <div className={cn(
                    "flex flex-col gap-y-SpacingMedium",
                    !isMobile ? "col-span-1" : "w-full"
                  )}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-SpacingMedium gap-y-SpacingSmall">
                      <div className="space-y-SpacingTiny md:col-span-2">
                        <Label id="label-customer-select" required>Nama Customer</Label>
                        <CustomValueDropdown
                          id="customer_select"
                          options={customers.map(c => ({ label: c.name, value: c.id }))}
                          placeholder="Pilih atau ketik nama customer baru..."
                          value={formData.customer_id || customerFormData.name || ''}
                          onChange={handleCustomerChange}
                        />
                      </div>
                      
                      <div className="space-y-SpacingTiny">
                        <Label id="label-cust-company">Perusahaan</Label>
                        <TextInput
                          id="cust_company"
                          placeholder={customerMode === 'locked' ? 'Pilih/ketik customer dahulu' : 'Nama PT / CV...'}
                          value={customerFormData.company || ''}
                          disabled={customerMode !== 'new'}
                          onChange={(e) => setCustomerFormData({ ...customerFormData, company: e.target.value })}
                          className={cn(customerMode !== 'new' && "opacity-80 cursor-not-allowed bg-gray-50")}
                        />
                      </div>

                      <div className="space-y-SpacingTiny">
                        <Label id="label-cust-bidang">Bidang Usaha</Label>
                        <CustomValueDropdown
                          id="cust_bidang_usaha"
                          options={[]}
                          dynamicOptions={dynamicBidangOptions}
                          placeholder={customerMode === 'locked' ? 'Pilih/ketik customer dahulu' : 'e.g. Retail, Kuliner...'}
                          value={customerFormData.bidang_usaha || ''}
                          disabled={customerMode !== 'new'}
                          onChange={(val) => setCustomerFormData({ ...customerFormData, bidang_usaha: String(val) })}
                          className={cn(customerMode !== 'new' && "opacity-80 cursor-not-allowed bg-gray-50")}
                        />
                      </div>

                      <div className="space-y-SpacingTiny">
                        <Label id="label-cust-telepon" required>No. Telepon</Label>
                        <PhoneInput
                          id="cust_telepon"
                          placeholder={customerMode === 'locked' ? 'Pilih/ketik customer dahulu' : '+62 812...'}
                          value={customerFormData.telepon || ''}
                          disabled={customerMode !== 'new'}
                          onChange={(e) => setCustomerFormData({ ...customerFormData, telepon: e.target.value })}
                          className={cn(customerMode !== 'new' && "opacity-80 cursor-not-allowed bg-gray-50")}
                        />
                      </div>

                      <div className="space-y-SpacingTiny">
                        <Label id="label-cust-email">Email</Label>
                        <EmailInput
                          id="cust_email"
                          placeholder={customerMode === 'locked' ? 'Pilih/ketik customer dahulu' : 'customer@email.com'}
                          value={customerFormData.email || ''}
                          disabled={customerMode !== 'new'}
                          onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                          className={cn(customerMode !== 'new' && "opacity-80 cursor-not-allowed bg-gray-50")}
                        />
                      </div>

                      <div className="space-y-SpacingTiny md:col-span-2">
                        <Label id="label-cust-alamat" required>Alamat Pengiriman</Label>
                        <LongTextInput
                          id="cust_alamat"
                          placeholder={customerMode === 'locked' ? 'Pilih/ketik customer dahulu' : 'Masukkan alamat lengkap...'}
                          value={customerFormData.alamat || ''}
                          disabled={customerMode !== 'new'}
                          onChange={(e) => setCustomerFormData({ ...customerFormData, alamat: e.target.value })}
                          className={cn("min-h-[120px]", customerMode !== 'new' && "opacity-80 cursor-not-allowed bg-gray-50")}
                          rows={3}
                        />
                        {customerMode === 'new' && (
                          <p className="text-FontSizeNano text-TextColorMuted italic mt-SpacingTiny">
                            *Geser pin atau klik peta untuk meletakkan titik koordinat dan auto-update alamat lengkap.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Map Picker/Viewer (1 part) */}
                  <div className={cn(
                    "h-[18rem] md:h-[26rem] relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner",
                    !isMobile ? "col-span-1" : "w-full"
                  )}>
                    {customerMode === 'new' ? (
                      <MapPicker
                        id="penjualan-customer-map-picker"
                        value={customerFormData.latlong ? {
                          lat: parseFloat(customerFormData.latlong.split(',')[0]) || -6.2088,
                          lng: parseFloat(customerFormData.latlong.split(',')[1]) || 106.8456
                        } : undefined}
                        onChange={handleCustomerMapChange}
                        className="w-full h-full !border-none"
                      />
                    ) : (
                      <MapViewer
                        id="penjualan-customer-map-viewer"
                        key={customerFormData.latlong || 'default-map-viewer'}
                        latlong={customerFormData.latlong || '-6.2088,106.8456'}
                        label={customerFormData.name || 'Lokasi Customer'}
                        className="w-full h-full !border-none"
                        height="100%"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <PrimaryButton onClick={() => { 
                    setEditingItemIndex(null); 
                    setProductModalTab('reguler');
                    setItemFormData({ 
                      sku: '',
                      name: '', 
                      kategori: '',
                      sub_kategori: '',
                      unit: 'Unit', 
                      qty: 1, 
                      unit_selling_price: 0, 
                      unit_base_price: 0,
                      is_mixing: false,
                      is_dropship: false,
                      mixing_composition: []
                    }); 
                    setCurrentPriceTiers([]);
                    setPriceWarning(null);
                    setIsProductModalOpen(true); 
                  }} icon={<Plus size={18} />}>
                    Tambah Produk
                  </PrimaryButton>
                </div>
                <div className="overflow-x-auto w-full">
                  <Table id="products-table">
                    <TableHeader>
                      <TableRow isHeader>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Harga Jual</TableHead>
                        <TableHead>Sub Total</TableHead>
                        <TableHead className="w-24 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-TextColorMuted">Belum ada produk ditambahkan.</TableCell>
                        </TableRow>
                      ) : (
                        formData.items?.map((item, index) => (
                          <React.Fragment key={index}>
                            <TableRow key={index} className={cn(item.is_mixing && "bg-ColorPrimary/5")}>
                              <TableCell className="font-semibold">
                                <div className="flex items-center gap-2">
                                  {item.is_mixing && <Package size={14} className="text-ColorPrimary" />}
                                  {item.name}
                                  {item.is_mixing && <span className="text-[0.625rem] bg-ColorPrimary/20 text-ColorPrimary px-1.5 rounded-full font-bold uppercase">Mixing</span>}
                                  {item.is_dropship && <span className="text-[0.625rem] bg-ColorSecondary/20 text-ColorSecondary px-1.5 rounded-full font-bold uppercase">Dropship</span>}
                                </div>
                              </TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>{formatCurrency(item.unit_selling_price)}</TableCell>
                              <TableCell>{formatCurrency(item.total_selling_price)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                  <GhostButton size="sm" onClick={() => { setEditingItemIndex(index); setProductModalTab(item.is_mixing ? 'mixing' : item.is_dropship ? 'dropship' : 'reguler'); setItemFormData(item); setIsProductModalOpen(true); }}>
                                    <Edit size={14} className="text-ColorSecondary" />
                                  </GhostButton>
                                  <GhostButton size="sm" onClick={() => { const next = [...formData.items!]; next.splice(index, 1); setFormData({ ...formData, items: next }); calculateTotals(next, formData.costs || [], formData.discount_type || 'price', formData.discount_value || 0); }}>
                                    <Trash2 size={14} className="text-FeedbackColorError" />
                                  </GhostButton>
                                </div>
                              </TableCell>
                            </TableRow>
                            {item.is_mixing && item.mixing_composition && item.mixing_composition.length > 0 && (
                              <TableRow noBorder className="bg-ColorPrimary/[0.02]">
                                <TableCell colSpan={6} className="!py-0">
                                  <div className="pl-6 pr-4 py-3 space-y-1">
                                    {(item as any).mixing_composition.map((comp: any, cidx: number) => (
                                      <div key={cidx} className="text-[0.6875rem] text-left !font-bold text-TextColorBase">
                                        [{comp.sku}] - {comp.name} - {comp.qty_composition} {comp.unit}
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === 'costs' && (
               <div className="space-y-4">
                 <div className="flex justify-end">
                   <PrimaryButton onClick={() => { setEditingCostIndex(null); setCostFormData({ nama_biaya: '', nominal: 0, keterangan: '' }); setIsCostModalOpen(true); }} icon={<Plus size={18} />}>
                     Tambah Biaya
                   </PrimaryButton>
                 </div>
                 <div className="overflow-x-auto w-full">
                   <Table id="costs-table">
                     <TableHeader>
                       <TableRow isHeader>
                         <TableHead>Nama Biaya</TableHead>
                         <TableHead>Nominal</TableHead>
                         <TableHead>Keterangan</TableHead>
                         <TableHead className="w-24 text-center">Aksi</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {formData.costs?.length === 0 ? (
                         <TableRow>
                           <TableCell colSpan={4} className="text-center py-8 text-TextColorMuted">Belum ada biaya ditambahkan.</TableCell>
                         </TableRow>
                       ) : (
                         formData.costs?.map((cost, index) => (
                           <TableRow key={index}>
                             <TableCell className="font-semibold">{cost.nama_biaya}</TableCell>
                             <TableCell>{formatCurrency(cost.nominal)}</TableCell>
                             <TableCell>{cost.keterangan || '-'}</TableCell>
                             <TableCell>
                               <div className="flex items-center justify-center gap-2">
                                 <GhostButton size="sm" onClick={() => { setEditingCostIndex(index); setCostFormData(cost); setIsCostModalOpen(true); }}>
                                   <Edit size={14} className="text-ColorSecondary" />
                                 </GhostButton>
                                 <GhostButton size="sm" onClick={() => { const next = [...formData.costs!]; next.splice(index, 1); setFormData({ ...formData, costs: next }); calculateTotals(formData.items || [], next, formData.discount_type || 'price', formData.discount_value || 0); }}>
                                   <Trash2 size={14} className="text-FeedbackColorError" />
                                 </GhostButton>
                               </div>
                             </TableCell>
                           </TableRow>
                         ))
                       )}
                     </TableBody>
                   </Table>
                 </div>
               </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-start gap-3 bg-ColorPrimary/5 p-SpacingBase rounded-RadiusMedium border border-ColorPrimary/20 mb-2">
                  <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                  <p className="text-FontSizeXs text-TextColorBase font-medium leading-relaxed">
                    Kelola syarat cicilan tempo / lunas, deposit modal, batas penagihan, serta akun Bank Kas penampung transaksi di sub-tab ini.
                  </p>
                </div>

                <div className={cn("grid gap-SpacingMedium", isMobile ? "grid-cols-1" : "grid-cols-4")}>
                  {/* Row 1 / Col 1: Nominal Diskon */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-discount-value">Nominal Diskon (Rp)</Label>
                    <PriceInput
                      id="discount_value"
                      placeholder="0"
                      value={formData.discount_value || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, discount_value: val, discount_type: 'price' });
                        calculateTotals(formData.items || [], formData.costs || [], 'price', val);
                      }}
                    />
                  </div>

                  {/* Row 1 / Col 2: Jenis Payment */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-payment-type" required>Jenis Payment</Label>
                    <ToggleButton
                      id="payment_type"
                      options={[{ label: 'Lunas', value: 'Lunas' }, { label: 'Tempo', value: 'Tempo' }] as any}
                      labelClassName="!text-FontSizeXs"
                      value={formData.payment_type || 'Lunas'}
                      onChange={(val) => {
                        const nextType = val as any;
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            payment_type: nextType
                          };
                          if (nextType === 'Lunas') {
                            updated.deposit = 0;
                            updated.outstanding = 0;
                            updated.sla_date = '';
                          } else {
                            updated.outstanding = (prev.grand_total || 0) - (prev.deposit || 0);
                          }
                          return updated;
                        });
                      }}
                    />
                  </div>

                  {/* Row 1 / Col 3: Metode Payment */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-payment-method" required>Metode Payment</Label>
                    <ToggleButton
                      id="payment_method"
                      options={[{ label: 'Tunai', value: 'Tunai' }, { label: 'Non Tunai', value: 'Non Tunai' }] as any}
                      labelClassName="!text-FontSizeXs"
                      value={formData.payment_method || 'Tunai'}
                      onChange={(val) => {
                        const nextMethod = val as any;
                        setFormData(prev => {
                          const updated = { ...prev, payment_method: nextMethod };
                          
                          // Auto-reset bank account if no longer valid for new method
                          const stillValid = bankAccounts.some(b => 
                            b.id === prev.bank_cash_source_id && 
                            (nextMethod === 'Tunai' ? b.tipe === TBankAndCashType.KAS : b.tipe === TBankAndCashType.BANK)
                          );
                          
                          if (!stillValid) {
                            // Try to pick first valid option
                            const firstValid = bankAccounts.find(b => 
                              nextMethod === 'Tunai' ? b.tipe === TBankAndCashType.KAS : b.tipe === TBankAndCashType.BANK
                            );
                            updated.bank_cash_source_id = firstValid ? firstValid.id : '';
                          }
                          
                          return updated;
                        });
                      }}
                    />
                  </div>

                  {/* Row 1 / Col 4: Sumber Kas & Bank */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-bank-account-id" required>Sumber Kas & Bank</Label>
                    <FixedDropdown
                      id="bank_cash_source_id"
                      options={filteredBankOptions}
                      placeholder="Pilih aliran kas..."
                      value={formData.bank_cash_source_id || ''}
                      onChange={(val) => setFormData({ ...formData, bank_cash_source_id: String(val) })}
                    />
                  </div>

                  {/* Row 2 / Col 1: Deposit */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-deposit" required={formData.payment_type === 'Tempo'}>Deposit (Rp)</Label>
                    <PriceInput
                      id="deposit"
                      placeholder="0"
                      disabled={formData.payment_type !== 'Tempo'}
                      value={formData.payment_type === 'Tempo' ? (formData.deposit || 0) : 0}
                      className={cn(formData.payment_type !== 'Tempo' && "bg-gray-100 opacity-50")}
                      onChange={(e) => {
                        const dep = parseFloat(e.target.value) || 0;
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            deposit: dep,
                            outstanding: Math.max(0, (prev.grand_total || 0) - dep)
                          };
                          return updated;
                        });
                      }}
                    />
                  </div>

                  {/* Row 2 / Col 2: Outstanding */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-outstanding">Outstanding (Rp)</Label>
                    <PriceInput
                      id="outstanding"
                      disabled={true}
                      value={formData.payment_type === 'Tempo' ? (formData.outstanding || 0) : 0}
                      className={cn("font-medium", formData.payment_type !== 'Tempo' ? "bg-gray-100 opacity-50" : "bg-gray-50")}
                      onChange={() => {}}
                    />
                  </div>

                  {/* Row 2 / Col 3: SLA */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-sla-date" required={formData.payment_type === 'Tempo'}>SLA</Label>
                    <DateInput
                      id="sla_date"
                      disabled={formData.payment_type !== 'Tempo'}
                      value={formData.payment_type === 'Tempo' ? (formData.sla_date || '') : ''}
                      className={cn(formData.payment_type !== 'Tempo' && "bg-gray-100 opacity-50")}
                      onChange={(e) => setFormData({ ...formData, sla_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachment' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-start gap-3 bg-ColorPrimary/5 p-SpacingBase rounded-RadiusMedium border border-ColorPrimary/20 mb-2">
                  <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                  <p className="text-FontSizeXs text-TextColorBase font-medium leading-relaxed">
                    Catatan tambahan serta lampiran file pendukung untuk invoice ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-SpacingSmall">
                    <Label id="label-keterangan">Keterangan Penjualan</Label>
                    <LongTextInput
                      id="keterangan"
                      placeholder="Contoh: Barang dikirim via ekspedisi..."
                      value={formData.keterangan || ''}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      className="min-h-[120px]"
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-SpacingSmall">
                    <Label id="label-attachment">Lampiran Pendukung</Label>
                    <MultipleUploadInput
                      id="payment_proof"
                      onFilesChange={setFiles}
                      initialUrls={formData.payment_proof_fileurls || []}
                      onRemoveInitialUrl={(url) => setFormData({ 
                        ...formData, 
                        payment_proof_fileurls: formData.payment_proof_fileurls?.filter(u => u !== url) || [] 
                      })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Modal */}
      <Modal
         id="product-modal"
         isOpen={isProductModalOpen}
         onClose={() => setIsProductModalOpen(false)}
         title={editingItemIndex !== null ? 'Ubah Produk' : 'Tambah Produk'}
         className="!max-w-3xl"
         footer={
           <div className={cn("gap-3 p-4 bg-gray-50/50 border-t border-gray-100", isMobile ? "flex flex-col-reverse" : "flex justify-end")}>
             <SecondaryButton 
               className={cn("font-bold", isMobile ? "w-full" : "px-6")} 
               onClick={() => setIsProductModalOpen(false)}
             >
               Batal
             </SecondaryButton>
             <PrimaryButton 
               className={cn("font-bold", isMobile ? "w-full" : "px-8", !isProductFormValid && "opacity-50 cursor-not-allowed")} 
               onClick={handleSaveItem}
               disabled={!isProductFormValid}
             >
               Simpan Produk
             </PrimaryButton>
           </div>
         }
      >
        <div className={cn("pt-2", isMobile ? "space-y-SpacingBase" : "space-y-6")}>
           <div className={cn("flex justify-center border-b border-gray-100", isMobile ? "pb-SpacingSmall" : "pb-2")}>
              <Tabs
                id="product-modal-tabs"
                variant="underline"
                className={cn("!justify-center !w-auto", isMobile && "overflow-x-auto")}
                tabs={[
                  { id: 'reguler', label: isMobile ? 'Reguler' : 'Produk Reguler' },
                  { id: 'mixing', label: isMobile ? 'Mixing' : 'Produk Mixing' },
                  { id: 'dropship', label: 'Dropship' }
                ]}
                activeTab={productModalTab}
                onChange={(id) => {
                  const newTab = id as 'reguler' | 'mixing' | 'dropship';
                  setProductModalTab(newTab);
                  
                  // Auto-reset state when switching tabs
                  setItemFormData({
                    sku: '',
                    name: '',
                    kategori: newTab === 'mixing' ? 'Mixing' : '',
                    sub_kategori: newTab === 'mixing' ? 'Mixing' : '',
                    unit: 'Unit',
                    qty: 1,
                    unit_selling_price: 0,
                    unit_base_price: 0,
                    is_mixing: newTab === 'mixing',
                    is_dropship: newTab === 'dropship',
                    mixing_composition: newTab === 'mixing' ? [] : undefined
                  });
                  
                  // Clear temporary pricing states
                  setCurrentPriceTiers([]);
                  setPriceWarning(null);
                }}
              />
           </div>

           {productModalTab === 'reguler' ? (
             <div className={cn("animate-in fade-in slide-in-from-top-1 duration-300", isMobile ? "space-y-SpacingSmall" : "space-y-4")}>
                <div className={cn("grid gap-y-SpacingSmall", isMobile ? "grid-cols-1" : "grid-cols-2 gap-x-SpacingMedium")}>
                  {/* Row 1: SKU | Kategori */}
                  <div className="space-y-SpacingTiny">
                    <Label required>SKU</Label>
                    <FixedDropdown
                      id="item-sku"
                      options={availableStocks.map(s => ({ label: `${s.sku} - ${s.name}`, value: s.sku }))}
                      value={itemFormData.sku || ''}
                      onChange={async (val) => {
                        const stock = availableStocks.find(s => s.sku === val);
                        if (stock) {
                          const priceData = await daftarHargaService.getBySku(stock.sku);
                          
                          if (!priceData || !priceData.tiered_pricing || priceData.tiered_pricing.length === 0) {
                            Swal.fire({
                              icon: 'error',
                              title: 'Gagal Memilih Produk',
                              text: 'Belum ada daftar harga untuk produk ini.',
                              confirmButtonColor: 'var(--ColorPrimary)'
                            });
                            return;
                          }
                          
                          setPriceWarning(null);
                          const tiers = priceData.tiered_pricing;
                          setCurrentPriceTiers(tiers);
                          
                          const sellingPrice = calculateSellingPrice(itemFormData.qty || 1, tiers, stock.price);
                          
                          setItemFormData({
                            ...itemFormData,
                            sku: stock.sku,
                            name: (stock as any).name,
                            unit: stock.unit,
                            unit_base_price: stock.price,
                            unit_selling_price: sellingPrice,
                            kategori: priceData?.category || '',
                            sub_kategori: priceData?.sub_category || ''
                          });
                        } else {
                          setItemFormData({ ...itemFormData, sku: String(val) });
                          setCurrentPriceTiers([]);
                          setPriceWarning(null);
                        }
                      }}
                      placeholder="Pilih atau ketik SKU..."
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Kategori</Label>
                    <TextInput
                      id="item-kategori"
                      value={itemFormData.kategori || ''}
                      placeholder="Terisi otomatis setelah pilih SKU..."
                      disabled
                      className="bg-gray-50 opacity-80"
                    />
                  </div>

                   {/* Row 2: Sub Kategori | Nama Produk */}
                  <div className="space-y-SpacingTiny">
                    <Label required>Sub Kategori</Label>
                    <TextInput
                      id="item-sub-kategori"
                      value={itemFormData.sub_kategori || ''}
                      placeholder="Terisi otomatis setelah pilih SKU..."
                      disabled
                      className="bg-gray-50 opacity-80"
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Nama Produk</Label>
                    <TextInput
                      id="item-name"
                      value={itemFormData.name || ''}
                      placeholder="Pilih SKU dahulu"
                      disabled
                      className="bg-gray-50 opacity-80"
                    />
                  </div>

                  {/* Row 3: Unit | Qty Penjualan */}
                  <div className="space-y-SpacingTiny">
                    <Label required>Unit (Satuan)</Label>
                    <TextInput
                      id="item-unit"
                      value={itemFormData.unit || ''}
                      placeholder="Satuan..."
                      disabled
                      className="bg-gray-50 opacity-80"
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Qty Penjualan</Label>
                    <NumberInput
                      id="item-qty"
                      value={itemFormData.qty || 0}
                      onChange={(e) => {
                        const newQty = parseFloat(e.target.value) || 0;
                        const newPrice = calculateSellingPrice(newQty, currentPriceTiers, itemFormData.unit_base_price || 0);
                        setItemFormData({ 
                          ...itemFormData, 
                          qty: newQty,
                          unit_selling_price: newPrice
                        });
                      }}
                    />
                  </div>

                  {/* Row 4: Harga Jual per Unit | Total Harga Jual */}
                  <div className="space-y-SpacingTiny">
                    <Label required>Harga Jual per Unit</Label>
                    <PriceInput
                      id="item-selling-price"
                      value={itemFormData.unit_selling_price || 0}
                      disabled
                      className="bg-gray-50 opacity-80"
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label>Total Harga Jual</Label>
                    <PriceInput
                      id="item-total-selling-price"
                      value={(itemFormData.unit_selling_price || 0) * (itemFormData.qty || 0)}
                      disabled
                      className="bg-gray-50 opacity-80"
                    />
                  </div>
                </div>

                {priceWarning && (
                  <div className="p-3 bg-FeedbackColorError/10 border border-FeedbackColorError/20 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                    <Info size={16} className="text-FeedbackColorError mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-FeedbackColorError font-medium">{priceWarning}</p>
                  </div>
                )}
             </div>
            ) : productModalTab === 'mixing' ? (
             <div className={cn("animate-in fade-in slide-in-from-top-1 duration-300", isMobile ? "space-y-SpacingBase" : "space-y-4")}>
                <div className="space-y-SpacingTiny">
                  <Label required>Nama Produk</Label>
                  <TextInput 
                    id="item-name-mixing"
                    value={itemFormData.name} 
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })} 
                    placeholder="Ketik nama racikan..." 
                  />
                </div>
                
                <div className={cn("bg-white rounded-lg border border-gray-100 shadow-sm", isMobile ? "p-SpacingSmall" : "p-4")}>
                   {/* Label/Header for section */}
                   <div className="flex items-center gap-2 mb-SpacingSmall text-ColorPrimary">
                      <Package size={16} />
                      <span className="text-[0.7rem] uppercase font-bold tracking-wider">Komposisi Racikan</span>
                   </div>

                   {isMobile ? (
                     <div className="flex flex-col gap-2 mt-2">
                       {itemFormData.mixing_composition?.map((c, idx) => (
                         <div key={idx} className="flex flex-col bg-gray-50 border border-gray-100 p-2 rounded-lg gap-2">
                           <div className="flex justify-between items-start gap-2">
                             <div className="flex flex-col overflow-hidden">
                               <div className="font-semibold tracking-tight text-TextColorBase text-FontSizeSm truncate leading-tight">{c.name}</div>
                               <div className="text-[0.6rem] text-TextColorMuted uppercase font-medium">{c.sku}</div>
                             </div>
                             <GhostButton 
                               size="sm" 
                               className="h-7 w-7 p-0 flex-shrink-0"
                               onClick={() => removeCompositionItem(idx)}
                             >
                               <Trash2 size={14} className="text-FeedbackColorError"/>
                             </GhostButton>
                           </div>
                           <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-1">
                              <span className="text-FontSizeXs font-medium text-TextColorMuted">Qty / Unit</span>
                              <div className="flex items-center gap-2">
                                <NumberInput
                                  id={`comp-qty-${idx}`}
                                  value={c.qty_composition}
                                  onChange={(e) => handleUpdateCompositionQty(idx, parseFloat(e.target.value) || 0)}
                                  className="h-8 px-2 text-FontSizeSm text-center w-20"
                                />
                                <span className="text-FontSizeXs font-semibold text-TextColorBase/70 text-left min-w-[20px]">{c.unit}</span>
                              </div>
                           </div>
                         </div>
                       ))}
                       <div 
                         className="flex items-center justify-between bg-ColorPrimary/5 border border-dashed border-ColorPrimary/30 p-3 rounded-lg cursor-pointer hover:bg-ColorPrimary/10 transition-colors"
                         onClick={() => setIsCompSkuModalOpen(true)}
                       >
                         <div className="flex items-center gap-2 text-TextColorMuted italic text-FontSizeXs">
                           <Plus size={16} className="text-ColorPrimary opacity-80"/>
                           Tambah Produk...
                         </div>
                       </div>
                     </div>
                   ) : (
                     <Table id="mixing-comp-table" className="mt-2 text-FontSizeBase" wrapperClassName="!overflow-visible">
                        <TableHeader>
                          <TableRow isHeader className="bg-ColorPrimary/10">
                            <TableHead className="text-left pl-SpacingSmall">Produk</TableHead>
                            <TableHead className="text-center w-60">Qty / Unit</TableHead>
                            <TableHead className="w-8 text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itemFormData.mixing_composition?.map((c, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-2 text-left pl-SpacingSmall">
                                <div className="font-semibold tracking-tight text-TextColorBase text-FontSizeXs truncate max-w-none">{c.name}</div>
                                <div className="text-[0.6rem] text-TextColorMuted uppercase font-medium">{c.sku}</div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex items-center justify-center gap-SpacingTiny">
                                  <NumberInput
                                    id={`comp-qty-${idx}`}
                                    value={c.qty_composition}
                                    onChange={(e) => handleUpdateCompositionQty(idx, parseFloat(e.target.value) || 0)}
                                    className="h-SpacingHuge px-SpacingTiny text-FontSizeSm text-center w-24"
                                  />
                                  <span className="text-FontSizeNano font-semibold text-TextColorBase/70 min-w-max text-left">{c.unit}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <GhostButton 
                                  size="sm" 
                                  className="h-SpacingHuge w-SpacingHuge p-0"
                                  onClick={() => removeCompositionItem(idx)}
                                >
                                  <Trash2 size={14} className="text-FeedbackColorError"/>
                                </GhostButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Entry Row: Clicking opens modal */}
                          <TableRow className="bg-ColorPrimary/5 cursor-pointer hover:bg-ColorPrimary/10 transition-colors" onClick={() => setIsCompSkuModalOpen(true)}>
                             <TableCell className="py-SpacingSmall text-left pl-SpacingSmall">
                                <div className="flex items-center gap-1.5 text-TextColorMuted italic text-FontSizeXs">
                                  <Plus size={14} className="text-ColorPrimary opacity-60"/>
                                  Pilih Produk (Nama + SKU)...
                                </div>
                             </TableCell>
                             <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-SpacingTiny opacity-30 italic">
                                  <div className="h-SpacingHuge flex items-center justify-center border border-dashed border-gray-300 rounded text-FontSizeXs w-24">0</div>
                                  <span className="text-FontSizeNano min-w-max">-</span>
                                </div>
                             </TableCell>
                             <TableCell className="text-center">
                                <Plus size={16} className="text-ColorPrimary mx-auto opacity-30"/>
                             </TableCell>
                          </TableRow>
                        </TableBody>
                     </Table>
                   )}
                </div>

                <div className={cn("grid gap-y-SpacingSmall", isMobile ? "grid-cols-1" : "grid-cols-2 gap-x-SpacingMedium")}>
                  <div className="space-y-SpacingTiny">
                    <Label required>Unit</Label>
                    <CustomValueDropdown
                      id="item-unit-mixing"
                      options={[{ label: 'Pcs', value: 'Pcs' }, { label: 'Unit', value: 'Unit' }, { label: 'Box', value: 'Box' }, { label: 'Kg', value: 'Kg' }]}
                      value={itemFormData.unit || ''}
                      onChange={(val) => setItemFormData({ ...itemFormData, unit: String(val) })}
                      placeholder="Pilih/ketik satuan..."
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Qty Penjualan</Label>
                    <NumberInput 
                      id="item-qty-mixing"
                      value={itemFormData.qty} 
                      onChange={(e) => setItemFormData({ ...itemFormData, qty: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Harga Jual per Unit</Label>
                    <PriceInput 
                      id="item-selling-price-mixing"
                      value={itemFormData.unit_selling_price || 0} 
                      onChange={(e) => setItemFormData({ ...itemFormData, unit_selling_price: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label>Total Harga Jual</Label>
                    <PriceInput 
                      id="item-total-selling-price-mixing"
                      value={(itemFormData.unit_selling_price || 0) * (itemFormData.qty || 0)} 
                      disabled
                      className="bg-gray-50 opacity-80"
                    />
                  </div>
               </div>
             </div>
            ) : (
             <div className={cn("animate-in fade-in slide-in-from-top-1 duration-300", isMobile ? "space-y-SpacingBase" : "space-y-4")}>
                <div className={cn("flex items-start gap-3 bg-ColorSecondary/5 rounded-RadiusMedium border border-ColorSecondary/20 mb-2", isMobile ? "p-SpacingSmall" : "p-SpacingBase")}>
                  <Info size={18} className="text-ColorSecondary mt-0.5 flex-shrink-0" />
                  <p className="text-FontSizeXs text-TextColorBase font-medium leading-relaxed">
                    Produk Dropship akan segera dipesankan ke supplier dan dikirim langsung ke customer. Stok gudang (Stok Berjalan) tidak akan terpotong oleh produk ini.
                  </p>
                </div>
                <div className={cn("grid gap-y-SpacingSmall", isMobile ? "grid-cols-1" : "grid-cols-2 gap-x-SpacingMedium")}>
                  <div className={cn("space-y-SpacingTiny", !isMobile && "md:col-span-2")}>
                    <Label required>Nama Produk (Dropship)</Label>
                    <TextInput
                      id="item-name-dropship"
                      value={itemFormData.name || ''}
                      onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                      placeholder="Masukkan nama produk..."
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Kategori</Label>
                    <TextInput
                      id="item-kategori-dropship"
                      value={itemFormData.kategori || ''}
                      onChange={(e) => setItemFormData({ ...itemFormData, kategori: e.target.value })}
                      placeholder="Masukkan kategori"
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Sub Kategori</Label>
                    <TextInput
                      id="item-sub-kategori-dropship"
                      value={itemFormData.sub_kategori || ''}
                      onChange={(e) => setItemFormData({ ...itemFormData, sub_kategori: e.target.value })}
                      placeholder="Masukkan sub kategori"
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Unit (Satuan)</Label>
                    <CustomValueDropdown
                      id="item-unit-dropship"
                      options={[{ label: 'Pcs', value: 'Pcs' }, { label: 'Unit', value: 'Unit' }, { label: 'Box', value: 'Box' }, { label: 'Kg', value: 'Kg' }]}
                      value={itemFormData.unit || ''}
                      onChange={(val) => setItemFormData({ ...itemFormData, unit: String(val) })}
                      placeholder="Pilih/ketik satuan..."
                    />
                  </div>
                  <div className="space-y-SpacingTiny">
                    <Label required>Qty Penjualan</Label>
                    <NumberInput
                      id="item-qty-dropship"
                      value={itemFormData.qty || 0}
                      onChange={(e) => setItemFormData({ ...itemFormData, qty: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={cn("space-y-SpacingTiny", !isMobile && "md:col-span-2")}>
                    <Label required>Harga Jual per Unit</Label>
                    <PriceInput
                      id="item-selling-price-dropship"
                      value={itemFormData.unit_selling_price || 0}
                      onChange={(e) => setItemFormData({ ...itemFormData, unit_selling_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
             </div>
           )}
        </div>
      </Modal>

      {/* Composition SKU Selection Modal */}
      <Modal
        id="comp-sku-modal"
        isOpen={isCompSkuModalOpen}
        onClose={() => setIsCompSkuModalOpen(false)}
        title="Pilih Produk Komposisi"
        className="!max-w-md"
        variant="popup"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label required>Pilih Produk (SKU)</Label>
            <FixedDropdown
              id="mixing-sku-modal-select"
              options={availableStocks.map(s => ({ 
                label: `${s.sku} - ${s.name}`, 
                value: s.sku 
              }))}
              value=""
              onChange={(val) => {
                handleAddCompositionInline(String(val));
                setIsCompSkuModalOpen(false);
              }}
              placeholder="Cari SKU atau Nama Produk..."
              className="w-full"
            />
          </div>
          <p className="text-[0.7rem] text-TextColorMuted italic p-3 bg-gray-50 rounded-lg border border-gray-100">
            *Silakan pilih produk dari daftar di atas. Produk yang dipilih akan otomatis ditambahkan ke dalam tabel komposisi dengan kuantitas default 1.
          </p>
          <div className="flex justify-end pt-2">
            <SecondaryButton onClick={() => setIsCompSkuModalOpen(false)}>
              Tutup
            </SecondaryButton>
          </div>
        </div>
      </Modal>

      {/* Cost Modal */}
      <Modal
         id="cost-modal"
         isOpen={isCostModalOpen}
         onClose={() => setIsCostModalOpen(false)}
         title={editingCostIndex !== null ? 'Ubah Data Biaya Tambahan' : 'Tambah Data Biaya Tambahan'}
         variant="popup"
         className="max-w-2xl"
         footer={
           <div className="flex justify-end gap-3 p-4 bg-gray-50/50 border-t border-gray-100">
             <SecondaryButton 
               className="px-6 font-bold" 
               onClick={() => setIsCostModalOpen(false)}
             >
               Batal
             </SecondaryButton>
             <PrimaryButton 
               className={cn("px-8 font-bold", !isCostFormValid && "opacity-50 cursor-not-allowed")} 
               onClick={handleSaveCost}
               disabled={!isCostFormValid}
             >
               Simpan Biaya
             </PrimaryButton>
           </div>
         }
      >
        <div className="space-y-SpacingMedium">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
            <div className="space-y-SpacingSmall">
              <Label id="label-cost-type" required>JENIS / TIPE BIAYA</Label>
              <CustomValueDropdown
                id="cost-type"
                placeholder="Pilih atau ketik jenis biaya..."
                options={[]}
                value={costFormData.nama_biaya || ''}
                onChange={(val) => setCostFormData({ ...costFormData, nama_biaya: String(val) })}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-cost-amount" required>NOMINAL BIAYA (RP)</Label>
              <PriceInput
                id="cost-amount"
                placeholder="0"
                value={costFormData.nominal || 0}
                onChange={(e) => setCostFormData({ ...costFormData, nominal: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-SpacingSmall col-span-1 md:col-span-2">
              <Label id="label-cost-description">DESKRIPSI / KETERANGAN</Label>
              <TextInput
                id="cost-description"
                placeholder="Contoh: Pembayaran bongkar muat oleh Helper Gudang"
                value={costFormData.keterangan || ''}
                onChange={(e) => setCostFormData({ ...costFormData, keterangan: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </FormShell>
  );
};

export default PenjualanFormPage;
