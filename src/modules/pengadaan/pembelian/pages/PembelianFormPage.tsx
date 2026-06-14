import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { TextInput, PriceInput, LongTextInput, PhoneInput, EmailInput, NumberInput, PercentageInput } from '../../../../ui/components/elements/Inputs';
import { DateTimeInput, DateInput } from '../../../../ui/components/elements/DateTimeInput';
import { MultipleUploadInput } from '../../../../ui/components/elements/UploadInput';
import { Label } from '../../../../ui/components/elements/Label';
import { FixedDropdown, CustomValueDropdown } from '../../../../ui/components/elements/Dropdown';
import { ToggleButton } from '../../../../ui/components/elements/ToggleButton';
import {
  IPembelianPayload,
  IPembelianProduk,
  IPembelianBiaya,
  TPembelianStatus,
  TPembelianPaymentType,
  TPembelianPaymentMethod,
  TPembelianShippingType,
  IPembelianFile
} from '../../../../logic/types/ITs_Pembelian';
import { ISuplier } from '../../../../logic/types/ITs_Suplier';
import { ICustomer } from '../../../../logic/types/ITs_Customer';
import { IBankAndCash, TBankAndCashType } from '../../../../logic/types/ITs_BankAndCash';
import { pembelianService } from '../../../../logic/services/pembelianService';
import { suplierService } from '../../../../logic/services/suplierService';
import { customerService } from '../../../../logic/services/customerService';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { penjualanService } from '../../../../logic/services/penjualanService';
import { storageService } from '../../../../logic/services/storage';
import { toast } from 'react-hot-toast';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';
import { MapPicker } from '../../../../ui/components/elements/MapPicker';
import { MapViewer } from '../../../../ui/components/elements/MapViewer';
import { useLocation } from '../../../../logic/hooks/useLocation';
import { reverseGeocode } from '../../../../logic/utils/map';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../../ui/components/common/Table';
import { Modal } from '../../../../ui/components/common/Modal';
import { PrimaryButton, DangerButton, GhostButton, SecondaryButton } from '../../../../ui/components/elements/Button';
import { processFileBeforeUpload } from '../../../../logic/utils/fileProcessor';
import { 
  User, 
  Package, 
  DollarSign, 
  CreditCard, 
  Users, 
  Paperclip, 
  Calendar, 
  Hash, 
  FileText,
  Info,
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

type TActiveTab = 'supplier' | 'products' | 'costs' | 'payment' | 'customer' | 'attachment';

export const PembelianFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { state: { viewport } } = useGlobalState();
  const { isMobile, isTablet, isCompact, isWide } = viewport;
  const { getLocation } = useLocation();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TActiveTab>('supplier');

  // Master options
  const [suppliers, setSuppliers] = useState<ISuplier[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<IBankAndCash[]>([]);

  // Distinct Suggestion States
  const [suggestedProducts, setSuggestedProducts] = useState<{ label: string; value: string }[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<{ label: string; value: string }[]>([]);
  const [suggestedSubCategories, setSuggestedSubCategories] = useState<{ label: string; value: string }[]>([]);
  const [suggestedCostTypes, setSuggestedCostTypes] = useState<{ label: string; value: string }[]>([]);
  const [dynamicBidangOptions, setDynamicBidangOptions] = useState<{ label: string; value: string }[]>([]);

  // Local state for supplier to replicate SuplierFormPage layout
  const [supplierFormData, setSupplierFormData] = useState<Partial<ISuplier>>({
    name: '',
    telepon: '',
    email: '',
    alamat: '',
    latlong: '',
    bank_name: '',
    no_rekening: '',
    nama_pemilik_rekening: ''
  });
  
  // supplierMode: 'locked' (initial state), 'existing' (locked/uneditable but filled), 'new' (user creates raw)
  const [supplierMode, setSupplierMode] = useState<'locked' | 'existing' | 'new'>('locked');

  // Local state for customer to replicate CustomerFormPage layout and Supplier architecture
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

  // States for product subtab editing modal:
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null); // null means creating new
  const [productFormData, setProductFormData] = useState<Partial<IPembelianProduk>>({
    name: '',
    category: '',
    sub_category: '',
    unit: 'Kg', // default standard unit
    qty: 0,
    price_per_unit: 0,
    sum_price: 0,
    kadar_air: null
  });

  const [isDropshipModalOpen, setIsDropshipModalOpen] = useState(false);
  const [dropshipItems, setDropshipItems] = useState<any[]>([]);

  const fetchDropshipItems = async () => {
    try {
      const items = await penjualanService.getApprovedDropshipItems();
      setDropshipItems(items);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTarikDropship = () => {
    fetchDropshipItems();
    setIsDropshipModalOpen(true);
  };

  const applyDropshipItem = async (item: any) => {
    // Determine customer based on dropship item
    if (item.customer_id) {
       setFormData(prev => ({
          ...prev,
          shipping_type: TPembelianShippingType.CUSTOMER,
          customer_id: item.customer_id,
          penjualan_id: item.penjualan_id, // Fix: Record which sales order this fulfil
          additional_description: `Memenuhi Pesanan Dropship: ${item.invoice_number}`
       }));
    }

    const price_per_unit = item.unit_base_price > 0 ? item.unit_base_price : 0;
    const newProduct: IPembelianProduk = {
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      purchase_id: id || '',
      datetime: formData.datetime || new Date().toISOString(),
      po_number: formData.po_number || '',
      category: item.kategori || '',
      sub_category: item.sub_kategori || '',
      name: item.name,
      unit: item.unit,
      qty: item.qty,
      price_per_unit: price_per_unit,
      sum_price: price_per_unit * item.qty,
      kadar_air: null,
      penjualan_produk_id: item.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const list = [...(formData.products || []), newProduct];
    updateProductsList(list);
    setIsDropshipModalOpen(false);
    toast.success('Berhasil menarik item dropship!');
  };

  const handleAddProductClick = () => {
    setProductFormData({
      name: '',
      category: '',
      sub_category: '',
      unit: 'Kg',
      qty: 0,
      price_per_unit: 0,
      sum_price: 0,
      kadar_air: null
    });
    setEditingProductIndex(null);
    setIsProductModalOpen(true);
  };

  const handleEditProductClick = (index: number) => {
    const editItem = (formData.products || [])[index];
    if (editItem) {
      setProductFormData({
        ...editItem,
        kadar_air: editItem.kadar_air ?? null
      });
      setEditingProductIndex(index);
      setIsProductModalOpen(true);
    }
  };

  const updateProductsList = (newProducts: IPembelianProduk[]) => {
    const sumProducts = newProducts.reduce((acc, p) => acc + (p.sum_price || 0), 0);
    setFormData(prev => {
      const updated = {
        ...prev,
        products: newProducts,
        sum_product_price: sumProducts,
        grand_total_price: sumProducts + (prev.sum_added_cost || 0)
      };
      if (prev.payment_type === TPembelianPaymentType.TEMPO) {
        updated.outstanding = updated.grand_total_price - (prev.deposit || 0);
      } else {
        updated.outstanding = 0;
      }
      return updated;
    });
  };

  const handleDeleteProductClick = (index: number) => {
    const item = (formData.products || [])[index];
    if (item?.penjualan_produk_id) {
      toast.error('Item dropship tidak dapat dihapus');
      return;
    }
    const list = [...(formData.products || [])];
    list.splice(index, 1);
    updateProductsList(list);
  };

  const handleProductFieldChange = (field: keyof IPembelianProduk, val: any) => {
    setProductFormData(prev => {
      const updated = { ...prev };
      
      if (field === 'qty') {
        const qty = parseFloat(val) || 0;
        updated.qty = qty;
        const ppu = parseFloat(prev.price_per_unit as any) || 0;
        updated.sum_price = Math.round(qty * ppu * 100) / 100;
      } else if (field === 'price_per_unit') {
        const ppu = parseFloat(val) || 0;
        updated.price_per_unit = ppu;
        const qty = parseFloat(prev.qty as any) || 0;
        updated.sum_price = Math.round(qty * ppu * 100) / 100;
      } else if (field === 'sum_price') {
        const sumPrice = parseFloat(val) || 0;
        updated.sum_price = sumPrice;
        const qty = parseFloat(prev.qty as any) || 0;
        if (qty > 0) {
          updated.price_per_unit = Math.round((sumPrice / qty) * 100) / 100;
        }
      } else {
        (updated as any)[field] = val;
      }
      return updated;
    });
  };

  const handleSaveProduct = () => {
    if (!productFormData.name) {
      toast.error('Nama Produk wajib diisi');
      return;
    }
    if (!productFormData.unit) {
      toast.error('Satuan wajib diisi');
      return;
    }
    if ((productFormData.qty || 0) <= 0) {
      toast.error('Kuantitas harus lebih besar dari 0');
      return;
    }
    if ((productFormData.price_per_unit || 0) < 0) {
      toast.error('Harga Satuan tidak boleh negatif');
      return;
    }

    const item: IPembelianProduk = {
      id: productFormData.id || 'prod-' + Math.random().toString(36).substr(2, 9),
      purchase_id: id || '',
      datetime: formData.datetime || new Date().toISOString(),
      po_number: formData.po_number || '',
      category: productFormData.category || '',
      sub_category: productFormData.sub_category || '',
      name: productFormData.name!,
      unit: productFormData.unit!,
      qty: productFormData.qty || 0,
      price_per_unit: productFormData.price_per_unit || 0,
      sum_price: productFormData.sum_price || 0,
      kadar_air: productFormData.kadar_air === null || productFormData.kadar_air === undefined || String(productFormData.kadar_air) === '' ? null : parseFloat(productFormData.kadar_air as any),
      penjualan_produk_id: productFormData.penjualan_produk_id || null, // Fix: Preserve dropship relation
      created_at: productFormData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const list = [...(formData.products || [])];
    if (editingProductIndex !== null) {
      list[editingProductIndex] = item;
    } else {
      list.push(item);
    }

    updateProductsList(list);
    setIsProductModalOpen(false);
  };

  // States for cost subtab editing modal:
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [editingCostIndex, setEditingCostIndex] = useState<number | null>(null); // null means creating new
  const [costFormData, setCostFormData] = useState<Partial<IPembelianBiaya>>({
    type: '',
    cost: 0,
    description: ''
  });

  const handleAddCostClick = () => {
    setCostFormData({
      type: '',
      cost: 0,
      description: ''
    });
    setEditingCostIndex(null);
    setIsCostModalOpen(true);
  };

  const handleEditCostClick = (index: number) => {
    const editItem = (formData.additional_costs || [])[index];
    if (editItem) {
      setCostFormData({
        ...editItem
      });
      setEditingCostIndex(index);
      setIsCostModalOpen(true);
    }
  };

  const updateCostsList = (newCosts: IPembelianBiaya[]) => {
    const sumCosts = newCosts.reduce((acc, c) => acc + (c.cost || 0), 0);
    setFormData(prev => {
      const updated = {
        ...prev,
        additional_costs: newCosts,
        sum_added_cost: sumCosts,
        grand_total_price: (prev.sum_product_price || 0) + sumCosts
      };
      if (prev.payment_type === TPembelianPaymentType.TEMPO) {
        updated.outstanding = updated.grand_total_price - (prev.deposit || 0);
      } else {
        updated.outstanding = 0;
      }
      return updated;
    });
  };

  const handleDeleteCostClick = (index: number) => {
    const list = [...(formData.additional_costs || [])];
    list.splice(index, 1);
    updateCostsList(list);
  };

  const handleCostFieldChange = (field: keyof IPembelianBiaya, val: any) => {
    setCostFormData(prev => ({
      ...prev,
      [field]: field === 'cost' ? (parseFloat(val) || 0) : val
    }));
  };

  const handleSaveCost = () => {
    if (!costFormData.type) {
      toast.error('Tipe / Jenis Biaya wajib diisi');
      return;
    }
    if ((costFormData.cost || 0) <= 0) {
      toast.error('Nominal Biaya harus lebih besar dari 0');
      return;
    }

    const item: IPembelianBiaya = {
      id: costFormData.id || 'cost-' + Math.random().toString(36).substr(2, 9),
      purchase_id: id || '',
      datetime: formData.datetime || new Date().toISOString(),
      po_number: formData.po_number || '',
      type: costFormData.type!,
      cost: costFormData.cost || 0,
      description: costFormData.description || '',
      created_at: costFormData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const list = [...(formData.additional_costs || [])];
    if (editingCostIndex !== null) {
      list[editingCostIndex] = item;
    } else {
      list.push(item);
    }

    updateCostsList(list);
    setIsCostModalOpen(false);
  };

  // State Form
  const [formData, setFormData] = useState<Partial<IPembelianPayload>>({
    datetime: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    po_number: 'PO-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
    additional_description: '',
    supplier_id: '',
    sum_product_price: 0,
    sum_added_cost: 0,
    grand_total_price: 0,
    payment_type: TPembelianPaymentType.LUNAS,
    deposit: 0,
    outstanding: 0,
    sla_date: '',
    payment_method: TPembelianPaymentMethod.TUNAI,
    bank_and_cash_id: '',
    shipping_type: TPembelianShippingType.INTERNAL,
    customer_id: '',
    penjualan_id: null,
    proof_fileurl: [],
    status: TPembelianStatus.DRAFT,
    products: [],
    additional_costs: []
  });

  const detectCurrentLocation = async () => {
    const loc = await getLocation();
    if (loc) {
      const coords = `${loc.latitude},${loc.longitude}`;
      setSupplierFormData(prev => ({ ...prev, latlong: coords }));
      
      const addr = await reverseGeocode(loc.latitude, loc.longitude);
      if (addr) {
        setSupplierFormData(prev => ({ ...prev, alamat: addr }));
      }
    } else {
      setSupplierFormData(prev => ({ ...prev, latlong: '-6.200000,106.816666' }));
    }
  };

  const handleMapChange = async (pos: { lat: number, lng: number }) => {
    if (supplierMode !== 'new') return;
    const coords = `${pos.lat},${pos.lng}`;
    setSupplierFormData(prev => ({ ...prev, latlong: coords }));
    
    const addr = await reverseGeocode(pos.lat, pos.lng);
    if (addr) {
      setSupplierFormData(prev => ({ ...prev, alamat: addr }));
    }
  };

  const handleSupplierChange = (val: string) => {
    const found = suppliers.find(s => s.id === val || s.name === val);
    if (found) {
      setFormData(prev => ({ ...prev, supplier_id: found.id }));
      setSupplierFormData({
        name: found.name,
        telepon: found.telepon,
        email: found.email || '',
        alamat: found.alamat,
        latlong: found.latlong,
        bank_name: found.bank_name || '',
        no_rekening: found.no_rekening || '',
        nama_pemilik_rekening: found.nama_pemilik_rekening || ''
      });
      setSupplierMode('existing');
    } else {
      setFormData(prev => ({ ...prev, supplier_id: '' }));
      setSupplierFormData({
        name: val,
        telepon: '',
        email: '',
        alamat: '',
        latlong: '-6.200000,106.816666'
      });
      setSupplierMode('new');
      detectCurrentLocation();
    }
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
      setFormData(prev => ({ 
        ...prev, 
        customer_id: found.id,
        shipping_type: TPembelianShippingType.CUSTOMER 
      }));
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
      setFormData(prev => ({ 
        ...prev, 
        customer_id: '',
        shipping_type: TPembelianShippingType.CUSTOMER
      }));
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

  // Load master data & Edit data if needed
  useEffect(() => {
    const loadMasterAndData = async () => {
      setIsLoading(true);
      try {
        const [supliersRes, customersRes, banksRes, prodNames, prodCats, prodSubCats, costTypes, bidangOptions] = await Promise.all([
          suplierService.getAll(),
          customerService.getAll(),
          bankAndCashService.getAll(),
          pembelianService.getDistinctProductNames(),
          pembelianService.getDistinctProductCategories(),
          pembelianService.getDistinctProductSubCategories(),
          pembelianService.getDistinctCostTypes(),
          customerService.getDistinctBidangUsaha()
        ]);
        setSuppliers(supliersRes);
        setCustomers(customersRes);
        setBankAccounts(banksRes);
        setSuggestedProducts(prodNames);
        setSuggestedCategories(prodCats);
        setSuggestedSubCategories(prodSubCats);
        setSuggestedCostTypes(costTypes);
        setDynamicBidangOptions(bidangOptions);

        // Auto-select first bank if database is empty or available
        if (banksRes.length > 0 && !formData.bank_and_cash_id) {
          setFormData(prev => ({ ...prev, bank_and_cash_id: banksRes[0].id }));
        }

        if (isEdit && id) {
          const detail = await pembelianService.getById(id);
          if (detail) {
            setFormData({
              ...detail,
              datetime: detail.datetime ? detail.datetime.slice(0, 16) : '',
              sla_date: detail.sla_date ? detail.sla_date.slice(0, 10) : ''
            });

            // Populate supplier info
            const matchedSupplier = supliersRes.find(s => s.id === detail.supplier_id);
            if (matchedSupplier) {
              setSupplierFormData({
                name: matchedSupplier.name,
                telepon: matchedSupplier.telepon,
                email: matchedSupplier.email || '',
                alamat: matchedSupplier.alamat,
                latlong: matchedSupplier.latlong,
                bank_name: matchedSupplier.bank_name || '',
                no_rekening: matchedSupplier.no_rekening || '',
                nama_pemilik_rekening: matchedSupplier.nama_pemilik_rekening || ''
              });
              setSupplierMode('existing');
            }

            // Populate customer info
            if (detail.customer_id) {
              const matchedCustomer = customersRes.find(c => c.id === detail.customer_id);
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
        } else {
          // Handle source_invoice from dropship
          const queryParams = new URLSearchParams(window.location.search);
          const sourceInvoice = queryParams.get('source_invoice');
          const sourceId = queryParams.get('source_id');
          
          if (sourceInvoice) {
            const allDropship = await penjualanService.getApprovedDropshipItems();
            const invoiceItems = allDropship.filter(item => item.invoice_number === sourceInvoice);
            
            if (invoiceItems.length > 0) {
              const first = invoiceItems[0];
              
              // Auto fill customer
              if (first.customer_id) {
                 const matchedCustomer = customersRes.find(c => c.id === first.customer_id);
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
                   setFormData(prev => ({
                     ...prev,
                     customer_id: first.customer_id,
                     shipping_type: TPembelianShippingType.CUSTOMER,
                     additional_description: `Memenuhi Pesanan Dropship: ${sourceInvoice}`,
                     penjualan_id: sourceId || first.penjualan_id
                   }));
                 }
              }

              // Auto fill products
              const mappedProducts: IPembelianProduk[] = invoiceItems.map(item => ({
                id: 'prod-' + Math.random().toString(36).substr(2, 9),
                purchase_id: id || '',
                datetime: new Date().toISOString(),
                po_number: '', // will be set by PO synchronization or manual
                category: item.kategori || '',
                sub_category: item.sub_kategori || '',
                name: item.name,
                unit: item.unit,
                qty: item.qty,
                price_per_unit: 0, // MUST BE UPDATED
                sum_price: 0,
                kadar_air: null,
                penjualan_produk_id: item.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              
              setFormData(prev => ({
                 ...prev,
                 products: mappedProducts,
                 sum_product_price: 0,
                 grand_total_price: prev.sum_added_cost || 0
              }));
              
              toast.success(`Data dari Invoice ${sourceInvoice} berhasil dimuat. Harap perbarui harga beli untuk setiap produk.`);
            }
          }
        }
      } catch (error) {
        toast.error('Gagal memuat data master pembelian');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMasterAndData();
  }, [isEdit, id]);

  // Synchronize PO Number with Transaction Date
  useEffect(() => {
    if (!formData.datetime || isEdit) return;
    try {
      const date = new Date(formData.datetime);
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const datePart = `${year}${month}${day}`;
      
      const currentPo = formData.po_number || '';
      const parts = currentPo.split('-');
      // Assuming format PO-YYMMDD-RANDOM
      const suffix = parts.length === 3 ? parts[2] : Math.floor(1000 + Math.random() * 9000).toString();
      
      setFormData(prev => ({
        ...prev,
        po_number: `PO-${datePart}-${suffix}`
      }));
    } catch (e) {
      // ignore date errors
    }
  }, [formData.datetime, isEdit]);

  const handleSave = async () => {
    if (supplierMode === 'locked') {
      toast.error('Harap pilih atau daftarkan Suplier terlebih dahulu di Sub-Tab Supplier');
      setActiveTab('supplier');
      return;
    }
    if (supplierMode === 'new') {
      if (!supplierFormData.name || !supplierFormData.telepon || !supplierFormData.alamat || !supplierFormData.latlong) {
        toast.error('Gagal menyimpan: Semua kolom wajib (*) pada Suplier baru harus diisi lengkap');
        setActiveTab('supplier');
        return;
      }
    } else {
      if (!formData.supplier_id) {
        toast.error('Harap pilih Suplier terlebih dahulu di Sub-Tab Supplier');
        setActiveTab('supplier');
        return;
      }
    }

    if (!formData.bank_and_cash_id) {
      toast.error('Harap pilih Saluran Bank & Kas terlebih dahulu');
      setActiveTab('payment');
      return;
    }

    setIsLoading(true);
    let finalSupplierId = formData.supplier_id;
    let finalCustomerId = formData.customer_id;

    try {
      // 1. Process and Upload Files (Attachments) - Multi-upload with client-side compression
      let finalProofFiles: IPembelianFile[] = formData.proof_fileurl || [];
      
      // Filter out files that need upload (only if formData.files contains new File objects)
      if (formData.files && formData.files.length > 0) {
        const loadingToastId = toast.loading('Memproses dan mengunggah lampiran...');
        
        try {
          // Single atomic upload loop (prevents double upload and garbage data)
          const uploadResults = await Promise.all(
            formData.files.map(async (f) => {
              // OPTIMASI: Kompresi Client-Side sesuai StorageRule.md
              const processedFile = await processFileBeforeUpload(f);
              return storageService.upload(processedFile, 'procurement');
            })
          );

          const newFiles: IPembelianFile[] = uploadResults.map((res, i) => ({
            url: res.url,
            key: res.key,
            name: formData.files![i].name // Gunakan nama file asli
          }));
          
          // Merge existing with new (if any)
          finalProofFiles = [...finalProofFiles, ...newFiles];
          toast.success('Lampiran berhasil diunggah', { id: loadingToastId });
        } catch (uploadErr) {
          toast.error('Gagal mengunggah beberapa lampiran', { id: loadingToastId });
          throw uploadErr;
        }
      }

      // 2. Create new supplier on map picker on-the-fly if needed
      if (supplierMode === 'new') {
        const createdSupplier = await suplierService.create({
          name: supplierFormData.name!,
          telepon: supplierFormData.telepon!,
          email: supplierFormData.email || '',
          alamat: supplierFormData.alamat!,
          latlong: supplierFormData.latlong || '-6.200000,106.816666',
          bank_name: supplierFormData.bank_name || '',
          no_rekening: supplierFormData.no_rekening || '',
          nama_pemilik_rekening: supplierFormData.nama_pemilik_rekening || ''
        });
        if (createdSupplier) {
          finalSupplierId = createdSupplier.id;
        } else {
          throw new Error('Gagal membuat suplier baru');
        }
      }

      // 3. Create new customer on map picker on-the-fly if needed
      if (formData.shipping_type === TPembelianShippingType.CUSTOMER) {
        if (customerMode === 'locked') {
          toast.error('Harap pilih atau daftarkan Customer terlebih dahulu di Sub-Tab Customer');
          setActiveTab('customer');
          setIsLoading(false);
          return;
        }
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
        } else {
          if (!formData.customer_id) {
            toast.error('Harap pilih Customer terlebih dahulu di Sub-Tab Customer');
            setActiveTab('customer');
            setIsLoading(false);
            return;
          }
        }
      }

      const { files: _, ...payloadWithoutFiles } = formData;

      const payload: IPembelianPayload = {
        ...payloadWithoutFiles as IPembelianPayload,
        supplier_id: finalSupplierId!,
        customer_id: formData.shipping_type === TPembelianShippingType.CUSTOMER ? finalCustomerId! : '',
        sum_product_price: formData.sum_product_price || 0,
        sum_added_cost: formData.sum_added_cost || 0,
        grand_total_price: (formData.sum_product_price || 0) + (formData.sum_added_cost || 0),
        deposit: formData.payment_type === TPembelianPaymentType.TEMPO ? (formData.deposit || 0) : 0,
        outstanding: formData.payment_type === TPembelianPaymentType.TEMPO 
          ? ((formData.sum_product_price || 0) + (formData.sum_added_cost || 0) - (formData.deposit || 0)) 
          : 0,
        proof_fileurl: finalProofFiles
      };

      if (isEdit && id) {
        await pembelianService.update(id, payload);
        toast.success('Pembaruan transaksi pembelian berhasil disimpan');
      } else {
        await pembelianService.create(payload);
        toast.success('Transaksi pembelian berhasil ditambahkan');
      }
      navigate('/pengadaan/pembelian');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan transaksi pembelian');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { key: TActiveTab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'supplier', label: 'Supplier', icon: User },
    { key: 'products', label: 'Daftar Produk', icon: Package },
    { key: 'costs', label: 'Daftar Biaya', icon: DollarSign },
    { key: 'payment', label: 'Pembayaran', icon: CreditCard },
    { key: 'customer', label: 'Customer', icon: Users },
    { key: 'attachment', label: 'Lampiran', icon: Paperclip },
  ];

  const supplierOptions = suppliers.map(s => ({ label: s.name, value: s.id }));
  const customerOptions = customers.map(c => ({ label: c.name, value: c.id }));
  const bankOptions = bankAccounts.map(b => ({ label: b.nama_akun, value: b.id }));

  const paymentTypeOptions = [
    { label: 'Lunas', value: TPembelianPaymentType.LUNAS },
    { label: 'Tempo', value: TPembelianPaymentType.TEMPO },
  ];

  const paymentMethodOptions = [
    { label: 'Tunai', value: TPembelianPaymentMethod.TUNAI },
    { label: 'Non Tunai', value: TPembelianPaymentMethod.NON_TUNAI },
  ];

  const shippingTypeOptions = [
    { label: 'Internal (Gudang)', value: TPembelianShippingType.INTERNAL },
    { label: 'Customer (Langsung)', value: TPembelianShippingType.CUSTOMER },
  ];

  const filteredBankOptions = bankAccounts
    .filter(b => {
      if (formData.payment_method === TPembelianPaymentMethod.TUNAI) {
        return b.tipe === TBankAndCashType.KAS;
      } else {
        return b.tipe === TBankAndCashType.BANK;
      }
    })
    .map(b => ({ label: b.nama_akun, value: b.id }));

  const mapValue = supplierFormData.latlong ? {
    lat: parseFloat(supplierFormData.latlong.split(',')[0]) || -6.200000,
    lng: parseFloat(supplierFormData.latlong.split(',')[1]) || 106.816666
  } : undefined;

  const customerMapValue = customerFormData.latlong ? {
    lat: parseFloat(customerFormData.latlong.split(',')[0]) || -6.2088,
    lng: parseFloat(customerFormData.latlong.split(',')[1]) || 106.8456
  } : undefined;

  const isSupplierValid = supplierMode === 'existing' 
    ? !!formData.supplier_id 
    : supplierMode === 'new'
      ? !!(supplierFormData.name && supplierFormData.telepon && supplierFormData.alamat && supplierFormData.latlong)
      : false;

  const handleFilesChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      files: files
    }));
  };

  const isCustomerValid = formData.shipping_type !== TPembelianShippingType.CUSTOMER || (
    customerMode === 'existing' 
      ? !!formData.customer_id 
      : customerMode === 'new'
        ? !!(customerFormData.name && customerFormData.telepon && customerFormData.alamat && customerFormData.latlong)
        : false
  );

  const isPaymentValid = !!(formData.bank_and_cash_id && filteredBankOptions.some(opt => opt.value === formData.bank_and_cash_id) && (formData.payment_type === TPembelianPaymentType.TEMPO
    ? !!(formData.deposit !== undefined && formData.outstanding !== undefined && formData.sla_date)
    : true));

  const areProductsValid = (formData.products || []).length > 0 && (formData.products || []).every(p => (p.price_per_unit || 0) > 0 && p.category && p.sub_category);
  const hasZeroPriceProduct = (formData.products || []).some(p => (p.price_per_unit || 0) === 0 || !p.category || !p.sub_category);

  const queryParams = new URLSearchParams(window.location.search);
  const sourceInvoice = queryParams.get('source_invoice');

  const isFormValid = !!(formData.po_number && isSupplierValid && isCustomerValid && isPaymentValid && areProductsValid);
  const isProductFormValid = !!(productFormData.name && productFormData.category && productFormData.sub_category && productFormData.unit && (productFormData.qty || 0) > 0 && (productFormData.price_per_unit || 0) >= 0);
  const isCostFormValid = !!(costFormData.type && (costFormData.cost || 0) > 0);

  return (
    <FormShell
      id="pembelian-form-shell"
      title={isEdit ? 'Ubah Pembelian' : 'Tambah Pembelian'}
      subtitle={isEdit ? 'Edit transaksi pesanan pembelian (PO) terdaftar.' : 'Buat transaksi pesanan pembelian (PO) pengadaan bahan baku.'}
      onSave={activeTab === 'attachment' ? handleSave : undefined}
      onCancel={() => navigate('/pengadaan/pembelian')}
      onBack={() => navigate('/pengadaan/pembelian')}
      isLoading={isLoading}
      isSaveDisabled={isLoading || !isFormValid}
    >
      <div className="w-full flex flex-col gap-SpacingLarge">
        {/* ROW 1: Tanggal, No PO, dan Horizontal Elegant Summary Cards (2-Column Layout) */}
        <div className={cn(
          "grid gap-SpacingMedium bg-white p-SpacingMedium rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm items-stretch", 
          isWide ? "grid-cols-12" : "grid-cols-1"
        )}>
          {/* Kolom 1: Tanggal & No PO */}
          <div className={cn(
            isWide ? "col-span-3 flex flex-col justify-between h-full gap-y-SpacingMedium" : 
            isTablet ? "w-full grid grid-cols-2 gap-x-SpacingLarge gap-y-0" : 
            "w-full flex flex-col gap-y-SpacingSmall"
          )}>
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

            <div className={cn("space-y-SpacingSmall flex-1 flex flex-col justify-center", (isMobile || isTablet) ? "mt-0" : "mt-SpacingMedium")}>
              <Label id="label-po-number" required className="flex items-center gap-1.5 text-TextColorBase">
                <Hash size={14} className="text-gray-500" />
                No. PO (Purchase Order)
              </Label>
              <TextInput
                id="po_number"
                placeholder="Simbol / No. PO..."
                value={formData.po_number || ''}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                className="bg-ColorBg/OpacitySubtle ! font-semibold"
              />
            </div>
          </div>

          {/* Kolom 2: Horizontal row of 3 highly polished cards */}
          <div className={cn(
            "grid gap-SpacingMedium items-stretch h-full", 
            isMobile ? "grid-cols-1" : "grid-cols-3",
            isWide ? "col-span-9" : "w-full"
          )}>
            {/* Card 1: Total Harga Produk */}
            <div className={cn(
              "bg-[linear-gradient(to_top,#93F9B9,#1D976C)] p-5 rounded-3xl justify-center flex flex-col shadow-sm relative overflow-hidden transition-all hover:shadow-md min-h-[6rem]",
              isMobile ? "h-auto" : "h-full"
            )}>
              <div className="space-y-1">
                <span className="text-Black text-[0.6875rem] font-bold uppercase tracking-wider block opacity-60">Total Harga Produk</span>
                <span className="text-Black text-[1rem] font-black tracking-tight block break-all leading-tight">
                  {formatCurrency(formData.sum_product_price || 0)}
                </span>
              </div>
            </div>

            {/* Card 2: Total Biaya */}
            <div className={cn(
              "bg-[linear-gradient(to_bottom,#f37335,#fdc830)] p-5 rounded-3xl flex flex-col justify-center shadow-sm relative overflow-hidden transition-all hover:shadow-md min-h-[6rem]",
              isMobile ? "h-auto" : "h-full"
            )}>
              <div className="space-y-1">
                <span className="text-Black text-[0.6875rem] font-bold uppercase tracking-wider block opacity-60">Total Biaya Tambahan</span>
                <span className="text-Black text-[1rem] font-black  tracking-tight block break-all leading-tight">
                  {formatCurrency(formData.sum_added_cost || 0)}
                </span>
              </div>
            </div>

            {/* Card 3: Grand Total */}
            <div className={cn(
              "bg-[linear-gradient(to_bottom,#155799,#159957)]  text-white p-5 rounded-3xl flex flex-col justify-center shadow-md relative overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg min-h-[6rem]",
              isMobile ? "h-auto" : "h-full"
            )}>
              <div className="space-y-1">
                <span className="text-white text-[0.6875rem] font-bold uppercase tracking-wider block">GRAND TOTAL</span>
                <span className="text-white text-[1rem] font-black  tracking-tight block break-all leading-none">
                  {formatCurrency(formData.grand_total_price || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SUB TAB NAVIGATION: HORIZONTAL CONTAINER */}
        <div className="w-full bg-white rounded-RadiusLarge border border-ColorSidebarBorder/10 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none bg-gray-50 w-full">
            <div className={cn(
              "flex w-full min-w-max",
              !isMobile && !isTablet ? "justify-center" : "justify-start"
            )}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                
                // Validate tabs
                let isInvalid = false;
                if (tab.key === 'supplier') isInvalid = !isSupplierValid;
                else if (tab.key === 'products') isInvalid = !areProductsValid;
                else if (tab.key === 'payment') isInvalid = !isPaymentValid;
                else if (tab.key === 'customer' && formData.shipping_type === TPembelianShippingType.CUSTOMER) isInvalid = !isCustomerValid;
                else if (tab.key === 'attachment') isInvalid = (formData.proof_fileurl || []).length === 0 && (formData.files || []).length === 0;

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
          </div>

          {/* AREA KONTEN TIAP SUB NAVIGASI */}
          <div className="p-SpacingBase min-h-[16rem] pb-24">
            {activeTab === 'supplier' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-start gap-3 bg-ColorPrimary/5 p-SpacingBase rounded-RadiusMedium border border-ColorPrimary/20">
                  <Info size={18} className="text-ColorPrimary mt-0.5 flex-shrink-0" />
                  <p className="text-FontSizeXs text-TextColorBase font-medium leading-relaxed">
                    Pilih mitra suplier yang terdaftar dalam database, atau ketik nama baru untuk mendaftarkannya secara otomatis. Jika memilih suplier terdaftar, data detail akan dikunci secara otomatis.
                  </p>
                </div>

                <div className={cn(
                  "flex gap-SpacingLarge items-start",
                  isMobile ? "flex-col" : "flex-row"
                )}>
                  <div className={cn(
                    "grid gap-x-SpacingLarge gap-y-SpacingMedium",
                    isMobile ? "w-full grid-cols-1" : "w-1/2 grid-cols-2"
                  )}>
                    <div className="space-y-SpacingSmall">
                      <Label id="label-supplier-select" required>Nama Suplier</Label>
                      <CustomValueDropdown
                        id="supplier_select"
                        options={supplierOptions}
                        placeholder="Pilih atau ketik nama suplier baru..."
                        value={formData.supplier_id || supplierFormData.name || ''}
                        onChange={handleSupplierChange}
                      />
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="label-bank_name">Nama Bank</Label>
                      <TextInput
                        id="bank_name"
                        placeholder="Contoh: BCA"
                        disabled={supplierMode !== 'new'}
                        value={supplierFormData.bank_name || ''}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, bank_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="label-telepon" required>Telepon</Label>
                      <PhoneInput
                        id="telepon"
                        placeholder={supplierMode === 'locked' ? 'Pilih/ketik suplier dahulu' : '+62 812...'}
                        value={supplierFormData.telepon || ''}
                        disabled={supplierMode !== 'new'}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, telepon: e.target.value })}
                      />
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="label-no_rekening">Nomor Rekening</Label>
                      <TextInput
                        id="no_rekening"
                        placeholder="Contoh: 1234567890"
                        disabled={supplierMode !== 'new'}
                        value={supplierFormData.no_rekening || ''}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, no_rekening: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="label-email">Email</Label>
                      <EmailInput
                        id="email"
                        placeholder={supplierMode === 'locked' ? 'Pilih/ketik suplier dahulu' : 'suplier@email.com'}
                        value={supplierFormData.email || ''}
                        disabled={supplierMode !== 'new'}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-SpacingSmall">
                      <Label id="label-nama_pemilik_rekening">Nama Pemilik Rekening</Label>
                      <TextInput
                        id="nama_pemilik_rekening"
                        placeholder="Contoh: Budi Santoso"
                        disabled={supplierMode !== 'new'}
                        value={supplierFormData.nama_pemilik_rekening || ''}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, nama_pemilik_rekening: e.target.value })}
                      />
                    </div>
                    <div className={cn(
                      "space-y-SpacingSmall",
                      !isMobile && "col-span-2"
                    )}>
                      <Label id="label-alamat" required>Alamat</Label>
                      <LongTextInput
                        id="alamat"
                        disabled={supplierMode !== 'new'}
                        placeholder={supplierMode === 'locked' ? 'Pilih/ketik suplier dahulu' : 'Masukkan alamat lengkap...'}
                        value={supplierFormData.alamat || ''}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, alamat: e.target.value })}
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Map Picker/Viewer */}
                  <div className={cn(
                    "relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner",
                    isMobile ? "w-full h-[18rem]" : "w-1/2 h-[26rem]"
                  )}>
                    {supplierMode === 'new' ? (
                      <MapPicker
                        id="pembelian-supplier-map-picker"
                        value={mapValue}
                        onChange={handleMapChange}
                        className="w-full h-full !border-none"
                      />
                    ) : (
                      <MapViewer
                        id="pembelian-supplier-map-viewer"
                        key={supplierFormData.latlong || 'default-map-viewer'}
                        latlong={supplierFormData.latlong || '-6.200000,106.816666'}
                        label={supplierFormData.name || 'Lokasi Suplier'}
                        className="w-full h-full !border-none"
                        height="100%"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="gap-y-SpacingMedium flex flex-col animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row justify-end gap-SpacingSmall">
                  <PrimaryButton 
                    id="pembelian-add-product-btn"
                    onClick={handleAddProductClick}
                    className="h-spacing-SpacingHuge !rounded-RadiusMedium px-SpacingBase flex items-center justify-center gap-SpacingTiny shadow-sm"
                    icon={<Plus size={18} />}
                    disabled={!!sourceInvoice}
                  >
                    Tambah Produk
                  </PrimaryButton>
                </div>

                <div className="overflow-x-auto w-full">
                  <Table id="pembelian-products-table" noBorder={true}>
                    <TableHeader>
                      <TableRow noBorder={true} isHeader={true}>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead>Kuantitas</TableHead>
                        <TableHead>Harga Satuan</TableHead>
                        <TableHead>Total Harga</TableHead>
                        <TableHead>Kadar Air</TableHead>
                        <TableHead className="w-24 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.products || formData.products.length === 0) ? (
                        <TableRow noBorder={true}>
                          <TableCell colSpan={7} className="text-center py-SpacingLarge text-TextColorMuted text-FontSizeXs">
                            Belum ada produk ditambahkan. Klik 'Tambah Produk' untuk mulai memasukkan item.
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.products.map((row, index) => (
                          <TableRow key={row.id || index} noBorder={true}>
                            <TableCell noBorder={true} className="!text-left px-SpacingBase">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-FontSizeXs text-TextColorBase leading-tight">
                                    {row.name}
                                  </span>
                                  {(row.price_per_unit || 0) === 0 && (
                                    <AlertCircle size={14} className="text-FeedbackColorError animate-pulse" />
                                  )}
                                </div>
                                {(row.category || row.sub_category) && (
                                  <span className="text-TextColorMuted text-FontSizeNano leading-tight mt-0.5">
                                    {row.category} {row.sub_category ? `> ${row.sub_category}` : ''}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell noBorder={true}>{row.unit}</TableCell>
                            <TableCell noBorder={true}>{row.qty}</TableCell>
                            <TableCell noBorder={true}>
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.price_per_unit || 0)}
                            </TableCell>
                            <TableCell noBorder={true}>
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.sum_price || 0)}
                            </TableCell>
                            <TableCell noBorder={true}>
                              {row.kadar_air !== null && row.kadar_air !== undefined ? `${row.kadar_air}%` : '-'}
                            </TableCell>
                            <TableCell noBorder={true}>
                              <div className="flex items-center justify-center gap-SpacingTiny">
                                <GhostButton
                                  id={`edit-prod-btn-${index}`}
                                  onClick={() => handleEditProductClick(index)}
                                  size="sm"
                                  className="h-8 w-8 !p-0 flex items-center justify-center text-ColorPrimary rounded-RadiusSmall"
                                >
                                  <Edit size={16} />
                                </GhostButton>
                                {!row.penjualan_produk_id && (
                                  <GhostButton
                                    id={`delete-prod-btn-${index}`}
                                    onClick={() => handleDeleteProductClick(index)}
                                    size="sm"
                                    className="h-8 w-8 !p-0 flex items-center justify-center text-FeedbackColorError rounded-RadiusSmall"
                                  >
                                    <Trash2 size={16} />
                                  </GhostButton>
                                )}
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

            {activeTab === 'costs' && (
              <div className="gap-y-SpacingMedium flex flex-col animate-in fade-in duration-200">
                <div className="flex justify-end">
                  <PrimaryButton 
                    id="pembelian-add-cost-btn"
                    onClick={handleAddCostClick}
                    className="h-spacing-SpacingHuge !rounded-RadiusMedium px-SpacingBase flex items-center justify-center gap-SpacingTiny shadow-sm"
                    icon={<Plus size={18} />}
                  >
                    Tambah Biaya
                  </PrimaryButton>
                </div>

                <div className="overflow-x-auto w-full">
                  <Table id="pembelian-costs-table" noBorder={true}>
                    <TableHeader>
                      <TableRow noBorder={true} isHeader={true}>
                        <TableHead>Jenis / Tipe Biaya</TableHead>
                        <TableHead>Nominal Biaya</TableHead>
                        <TableHead>Deskripsi / Keterangan</TableHead>
                        <TableHead className="w-24 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.additional_costs || formData.additional_costs.length === 0) ? (
                        <TableRow noBorder={true}>
                          <TableCell colSpan={4} className="text-center py-SpacingLarge text-TextColorMuted text-FontSizeXs">
                            Belum ada biaya tambahan ditambahkan. Klik 'Tambah Biaya' untuk mulai memasukkan item.
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.additional_costs.map((row, index) => (
                          <TableRow key={row.id || index} noBorder={true}>
                            <TableCell noBorder={true} className="!text-left px-SpacingBase font-semibold !text-center !text-FontSizeXs text-TextColorBase leading-tight">
                              {row.type}
                            </TableCell>
                            <TableCell noBorder={true}>
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.cost || 0)}
                            </TableCell>
                            <TableCell noBorder={true} className="text-TextColorMuted !text-FontSizeXs">
                              {row.description || '-'}
                            </TableCell>
                            <TableCell noBorder={true}>
                              <div className="flex items-center justify-center gap-SpacingTiny">
                                <GhostButton
                                  id={`edit-cost-btn-${index}`}
                                  onClick={() => handleEditCostClick(index)}
                                  size="sm"
                                  className="h-8 w-8 !p-0 flex items-center justify-center text-ColorPrimary rounded-RadiusSmall"
                                >
                                  <Edit size={16} />
                                </GhostButton>
                                <GhostButton
                                  id={`delete-cost-btn-${index}`}
                                  onClick={() => handleDeleteCostClick(index)}
                                  size="sm"
                                  className="h-8 w-8 !p-0 flex items-center justify-center text-FeedbackColorError rounded-RadiusSmall"
                                >
                                  <Trash2 size={16} />
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

                <div className={cn("grid gap-y-SpacingMedium gap-x-SpacingLarge", isMobile ? "grid-cols-1" : "grid-cols-4")}>
                  {/* Row 1 / Col 1: Jenis Payment */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-payment-type" required>Jenis Payment</Label>
                    <ToggleButton
                      id="payment_type"
                      options={paymentTypeOptions as any}
                      labelClassName="!text-FontSizeXs"
                      value={formData.payment_type || TPembelianPaymentType.LUNAS}
                      onChange={(val) => {
                        const nextType = val as TPembelianPaymentType;
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            payment_type: nextType
                          };
                          if (nextType === TPembelianPaymentType.LUNAS) {
                            updated.deposit = 0;
                            updated.outstanding = 0;
                            updated.sla_date = '';
                          } else {
                            updated.outstanding = (prev.grand_total_price || 0) - (prev.deposit || 0);
                          }
                          return updated;
                        });
                      }}
                    />
                  </div>

                  {/* Row 1 / Col 2: Metode Payment */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-payment-method" required>Metode Payment</Label>
                    <ToggleButton
                      id="payment_method"
                      options={paymentMethodOptions as any}
                      labelClassName="!text-FontSizeXs"
                      value={formData.payment_method || TPembelianPaymentMethod.TUNAI}
                      onChange={(val) => {
                        const nextMethod = val as TPembelianPaymentMethod;
                        setFormData(prev => {
                          const updated = { ...prev, payment_method: nextMethod };
                          
                          // Auto-reset bank account if no longer valid for new method
                          const stillValid = bankAccounts.some(b => 
                            b.id === prev.bank_and_cash_id && 
                            (nextMethod === TPembelianPaymentMethod.TUNAI ? b.tipe === TBankAndCashType.KAS : b.tipe === TBankAndCashType.BANK)
                          );
                          
                          if (!stillValid) {
                            // Try to pick first valid option
                            const firstValid = bankAccounts.find(b => 
                              nextMethod === TPembelianPaymentMethod.TUNAI ? b.tipe === TBankAndCashType.KAS : b.tipe === TBankAndCashType.BANK
                            );
                            updated.bank_and_cash_id = firstValid ? firstValid.id : '';
                          }
                          
                          return updated;
                        });
                      }}
                    />
                  </div>

                  {/* Row 1 / Col 3: Data Sumber Kas & Bank */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-bank-account-id" required>Sumber Transaksi</Label>
                    <FixedDropdown
                      id="bank_and_cash_id"
                      options={filteredBankOptions}
                      placeholder="Pilih aliran kas..."
                      value={formData.bank_and_cash_id || ''}
                      onChange={(val) => setFormData({ ...formData, bank_and_cash_id: String(val) })}
                    />
                  </div>

                  {/* Row 1 / Col 4: Jenis Pengiriman */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-shipping-type" required>Jenis Pengiriman</Label>
                    <FixedDropdown
                      id="shipping_type"
                      options={shippingTypeOptions}
                      placeholder="Atur relasi logistik..."
                      value={formData.shipping_type || TPembelianShippingType.INTERNAL}
                      disabled={!!sourceInvoice || !!formData.penjualan_id}
                      onChange={(val) => {
                        const nextType = val as TPembelianShippingType;
                        setFormData(prev => ({
                          ...prev,
                          shipping_type: nextType,
                          customer_id: ''
                        }));
                        setCustomerFormData({
                          name: '',
                          company: '',
                          bidang_usaha: '',
                          telepon: '',
                          email: '',
                          alamat: '',
                          latlong: ''
                        });
                        setCustomerMode('locked');
                      }}
                    />
                  </div>

                  {/* Row 2 / Col 1: Deposit */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-deposit" required={formData.payment_type === TPembelianPaymentType.TEMPO}>Deposit (Rp)</Label>
                    <PriceInput
                      id="deposit"
                      placeholder="0"
                      disabled={formData.payment_type !== TPembelianPaymentType.TEMPO}
                      value={formData.payment_type === TPembelianPaymentType.TEMPO ? (formData.deposit || 0) : 0}
                      className={cn(formData.payment_type !== TPembelianPaymentType.TEMPO && "bg-Black/5 opacity-opacity-OpacityMid")}
                      onChange={(e) => {
                        const dep = parseFloat(e.target.value) || 0;
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            deposit: dep,
                            outstanding: Math.max(0, (prev.grand_total_price || 0) - dep)
                          };
                          return updated;
                        });
                      }}
                    />
                  </div>

                  {/* Row 2 / Col 2: Outstanding */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-outstanding" required={formData.payment_type === TPembelianPaymentType.TEMPO}>Outstanding (Rp)</Label>
                    <TextInput
                      id="outstanding"
                      type="text"
                      disabled={true}
                      value={formData.payment_type === TPembelianPaymentType.TEMPO ? formatCurrency(formData.outstanding || 0) : formatCurrency(0)}
                      className={cn(" font-medium", formData.payment_type !== TPembelianPaymentType.TEMPO ? "bg-Black/5 opacity-opacity-OpacityMid" : "bg-gray-100")}
                      onChange={() => {}}
                    />
                  </div>

                  {/* Row 2 / Col 3: SLA */}
                  <div className="space-y-SpacingSmall">
                    <Label id="label-sla-date" required={formData.payment_type === TPembelianPaymentType.TEMPO}>Service Level Agreement</Label>
                    <DateInput
                      id="sla_date"
                      disabled={formData.payment_type !== TPembelianPaymentType.TEMPO}
                      value={formData.payment_type === TPembelianPaymentType.TEMPO ? (formData.sla_date || '') : ''}
                      className={cn(formData.payment_type !== TPembelianPaymentType.TEMPO && "bg-Black/5 opacity-opacity-OpacityMid")}
                      onChange={(e) => setFormData({ ...formData, sla_date: e.target.value })}
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
                      Metode Pengiriman Logistik: {formData.shipping_type === TPembelianShippingType.INTERNAL ? 'Gudang Internal' : 'Customer (Langsung)'}
                    </p>
                    <p className="text-FontSizeXs text-TextColorBase leading-relaxed">
                      {formData.shipping_type === TPembelianShippingType.INTERNAL 
                        ? 'Pengiriman dialokasikan ke Gudang Operasional Internal. Jika Anda ingin mengirim langsung ke Customer, silakan ubah "Jenis Pengiriman" pada Sub-Tab Pembayaran.' 
                        : 'Pilih mitra customer yang terdaftar, atau ketik nama baru untuk mendaftarkannya secara otomatis. Jika memilih customer terdaftar, detail koordinat alamat akan terkunci secara otomatis.'}
                    </p>
                  </div>
                </div>

                {formData.shipping_type === TPembelianShippingType.CUSTOMER ? (
                  <div className={cn(
                    "flex gap-SpacingLarge items-start",
                    isMobile ? "flex-col" : "flex-row"
                  )}>
                    <div className={cn(
                      "grid gap-x-SpacingLarge gap-y-SpacingMedium",
                      isMobile ? "w-full grid-cols-1" : "w-1/2 grid-cols-2"
                    )}>
                      <div className={cn(
                        "space-y-SpacingSmall",
                        !isMobile && "col-span-2"
                      )}>
                        <Label id="label-customer-select" required>Nama Customer</Label>
                        <CustomValueDropdown
                          id="customer_select"
                          options={customerOptions}
                          placeholder="Pilih atau ketik nama customer baru..."
                          value={formData.customer_id || customerFormData.name || ''}
                          onChange={handleCustomerChange}
                          disabled={!!sourceInvoice || !!formData.penjualan_id}
                        />
                      </div>
                      
                      <div className="space-y-SpacingSmall">
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

                      <div className="space-y-SpacingSmall">
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

                      <div className="space-y-SpacingSmall">
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

                      <div className="space-y-SpacingSmall">
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

                      <div className={cn(
                        "space-y-SpacingSmall",
                        !isMobile && "col-span-2"
                      )}>
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

                    {/* Right Column: Map Picker/Viewer */}
                    <div className={cn(
                      "relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner",
                      isMobile ? "w-full h-[18rem]" : "w-1/2 h-[26rem]"
                    )}>
                      {customerMode === 'new' ? (
                        <MapPicker
                          id="pembelian-customer-map-picker"
                          value={customerMapValue}
                          onChange={handleCustomerMapChange}
                          className="w-full h-full !border-none"
                        />
                      ) : (
                        <MapViewer
                          id="pembelian-customer-map-viewer"
                          key={customerFormData.latlong || 'default-customer-map-viewer'}
                          latlong={customerFormData.latlong || '-6.2088,106.8456'}
                          label={customerFormData.name || 'Lokasi Customer'}
                          className="w-full h-full !border-none"
                          height="100%"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  null
                )}
              </div>
            )}

            {activeTab === 'attachment' && (
              <div className={cn(
                "grid gap-SpacingLarge animate-in fade-in duration-200",
                isMobile ? "grid-cols-1" : "grid-cols-2"
              )}>
                {/* Grid Kiri: Deskripsi */}
                <div className="space-y-SpacingSmall flex flex-col h-full bg-white p-SpacingBase rounded-RadiusMedium border border-ColorSidebarBorder/15 shadow-xs">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100 mb-SpacingSmall">
                    <FileText size={16} className="text-ColorPrimary" />
                    <Label id="label-attachment-description" className="font-bold text-TextColorBase text-FontSizeSmall">
                      Deskripsi Dokumen Transaksi
                    </Label>
                  </div>
                  <p className="text-FontSizeNano text-TextColorMuted leading-relaxed">
                    Silakan cantumkan catatan khusus terkait pembelian ini.
                  </p>
                  <div className="flex-1 min-h-[14rem] mt-SpacingSmall">
                    <LongTextInput
                      id="additional_description"
                      placeholder="Contoh: Pengadaan bahan baku jagung pipil untuk klaster pakan C-1. Pengiriman bertahap menggunakan armada dump truck..."
                      value={formData.additional_description || ''}
                      onChange={(e) => setFormData({ ...formData, additional_description: e.target.value })}
                      className="w-full h-full min-h-[14rem]"
                      rows={8}
                    />
                  </div>
                </div>

                {/* Grid Kanan: MultiUploadInput */}
                <div className="space-y-SpacingSmall flex flex-col h-full bg-white p-SpacingBase rounded-RadiusMedium border border-ColorSidebarBorder/15 shadow-xs">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100 mb-SpacingSmall">
                    <Paperclip size={16} className="text-ColorPrimary" />
                    <Label id="label-attachment-upload" className="font-bold text-TextColorBase text-FontSizeSmall">
                      Berkas Pendukung Dokumen (*)
                    </Label>
                  </div>
                  <p className="text-FontSizeNano text-TextColorMuted leading-relaxed">
                    Unggah bukti konfirmasi, nota penawaran, invoice atau dokumen fisik pendukung lainnya.
                  </p>
                  <div className="flex-1 mt-SpacingSmall">
                    <MultipleUploadInput
                      id="pembelian-multi-upload"
                      initialUrls={(formData.proof_fileurl || []).map(f => f.url)}
                      onFilesChange={handleFilesChange}
                      maxFiles={5}
                      onRemoveInitialUrl={(removedUrl) => {
                        setFormData(prev => ({
                          ...prev,
                          proof_fileurl: (prev.proof_fileurl || []).filter(f => f.url !== removedUrl)
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        id="pembelian-product-modal"
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProductIndex !== null ? 'Ubah Data Produk' : 'Tambah Data Produk'}
        variant="popup"
        className="max-w-2xl"
      >
        <div className="space-y-SpacingMedium">
          {/* 2-Column form layout */}
          <div className={cn(
            "grid gap-SpacingMedium",
            isMobile ? "grid-cols-1" : "grid-cols-2"
          )}>
            <div className={cn(
              "space-y-SpacingSmall",
              !isMobile && "col-span-2"
            )}>
              <Label id="label-prod-name" required>Nama Produk</Label>
              <CustomValueDropdown
                id="prod-name"
                placeholder="Pilih atau ketik Nama Produk..."
                options={suggestedProducts}
                value={productFormData.name || ''}
                onChange={(val) => handleProductFieldChange('name', val)}
                disabled={!!sourceInvoice || !!productFormData.penjualan_produk_id}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-prod-category" required>Kategori Utama</Label>
              <CustomValueDropdown
                id="prod-category"
                placeholder="Pilih atau ketik Kategori Utama..."
                options={suggestedCategories}
                value={productFormData.category || ''}
                onChange={(val) => handleProductFieldChange('category', val)}
                disabled={!!sourceInvoice || !!productFormData.penjualan_produk_id}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-prod-sub-category" required>Sub-Kategori</Label>
              <CustomValueDropdown
                id="prod-sub-category"
                placeholder="Pilih atau ketik Sub-Kategori..."
                options={suggestedSubCategories}
                value={productFormData.sub_category || ''}
                onChange={(val) => handleProductFieldChange('sub_category', val)}
                disabled={!!sourceInvoice || !!productFormData.penjualan_produk_id}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-prod-unit" required>Satuan / Unit</Label>
              <CustomValueDropdown
                id="prod-unit"
                placeholder="Contoh: Kg, Ton, Bal"
                options={[
                  { label: 'Kg', value: 'Kg' },
                  { label: 'Ton', value: 'Ton' },
                  { label: 'Gram', value: 'Gram' },
                  { label: 'Pcs', value: 'Pcs' },
                  { label: 'Unit', value: 'Unit' },
                  { label: 'Box', value: 'Box' },
                  { label: 'Karung', value: 'Karung' },
                  { label: 'Bal', value: 'Bal' },
                ]}
                value={productFormData.unit || ''}
                onChange={(val) => handleProductFieldChange('unit', val)}
                disabled={!!sourceInvoice || !!productFormData.penjualan_produk_id}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-prod-qty" required>Kuantitas (Qty)</Label>
              <NumberInput
                id="prod-qty"
                placeholder="0"
                value={productFormData.qty || 0}
                onChange={(e) => handleProductFieldChange('qty', e.target.value)}
                disabled={!!sourceInvoice || !!productFormData.penjualan_produk_id}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-prod-price" required>Harga Satuan (Rp)</Label>
              <PriceInput
                id="prod-price"
                placeholder="0"
                value={productFormData.price_per_unit || 0}
                onChange={(e) => handleProductFieldChange('price_per_unit', e.target.value)}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-prod-sum-price" required>Total Harga (Rp)</Label>
              <PriceInput
                id="prod-sum-price"
                placeholder="0"
                value={productFormData.sum_price || 0}
                onChange={(e) => handleProductFieldChange('sum_price', e.target.value)}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-prod-moisture">Kadar Air (%) <span className="text-gray-400 font-normal italic ml-1">(Opsional)</span></Label>
              <PercentageInput
                id="prod-moisture"
                placeholder="0"
                value={productFormData.kadar_air === null || productFormData.kadar_air === undefined ? '' : productFormData.kadar_air}
                onChange={(e) => handleProductFieldChange('kadar_air', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-SpacingSmall pt-SpacingMedium">
            <SecondaryButton
              id="cancel-save-product-btn"
              onClick={() => setIsProductModalOpen(false)}
            >
              Batal
            </SecondaryButton>
            <PrimaryButton
              id="save-product-btn"
              onClick={handleSaveProduct}
              disabled={!isProductFormValid}
            >
              Simpan Item
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal
        id="pembelian-cost-modal"
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        title={editingCostIndex !== null ? 'Ubah Data Biaya Tambahan' : 'Tambah Data Biaya Tambahan'}
        variant="popup"
        className="max-w-2xl"
      >
        <div className="space-y-SpacingMedium">
          <div className={cn(
            "grid gap-SpacingMedium",
            isMobile ? "grid-cols-1" : "grid-cols-2"
          )}>
            <div className="space-y-SpacingSmall">
              <Label id="label-cost-type" required>Jenis / Tipe Biaya</Label>
              <CustomValueDropdown
                id="cost-type"
                placeholder="Pilih atau ketik jenis biaya..."
                options={suggestedCostTypes}
                value={costFormData.type || ''}
                onChange={(val) => handleCostFieldChange('type', val)}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-cost-amount" required>Nominal Biaya (Rp)</Label>
              <PriceInput
                id="cost-amount"
                placeholder="0"
                value={costFormData.cost || 0}
                onChange={(e) => handleCostFieldChange('cost', e.target.value)}
              />
            </div>

            <div className={cn(
              "space-y-SpacingSmall",
              !isMobile && "col-span-2"
            )}>
              <Label id="label-cost-description">Deskripsi / Keterangan</Label>
              <TextInput
                id="cost-description"
                placeholder="Contoh: Pembayaran bongkar muat oleh Helper Gudang"
                value={costFormData.description || ''}
                onChange={(e) => handleCostFieldChange('description', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-SpacingSmall pt-SpacingMedium">
            <SecondaryButton
              id="cancel-save-cost-btn"
              onClick={() => setIsCostModalOpen(false)}
            >
              Batal
            </SecondaryButton>
            <PrimaryButton
              id="save-cost-btn"
              onClick={handleSaveCost}
              disabled={!isCostFormValid}
            >
              Simpan Biaya
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal
        id="pembelian-dropship-modal"
        isOpen={isDropshipModalOpen}
        onClose={() => setIsDropshipModalOpen(false)}
        title="Pilih Pesanan Dropship (Belum Terproses)"
        variant="drawer"
        className="max-w-4xl"
      >
        <div className="space-y-SpacingMedium">
          {dropshipItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-ColorBackground rounded-RadiusLarge border border-ColorBorder/50">
              <Package size={48} className="text-ColorSecondary/30 mb-4" />
              <p className="text-TextColorBase font-medium">Belum ada item pesanan dropship.</p>
              <p className="text-TextColorMuted text-FontSizeSm mt-1">Pastikan ada penjualan berstatus 'Approved' dengan menandai produk sebagai Dropship.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full border border-ColorBorder/30 rounded-RadiusMedium">
              <Table id="pembelian-dropship-table" noBorder={true}>
                <TableHeader>
                  <TableRow noBorder={true} isHeader={true}>
                    <TableHead>Invoice / Customer</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Modal Ideal (Estimasi)</TableHead>
                    <TableHead className="w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dropshipItems.map((item, idx) => (
                    <TableRow key={idx} noBorder={true} className="border-b border-ColorBorder/30 last:border-0 hover:bg-slate-50">
                      <TableCell>
                        <div className="font-semibold text-ColorPrimary">{item.invoice_number}</div>
                        <div className="text-FontSizeXs text-TextColorMuted">{item.customer_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-TextColorBase">{item.name}</div>
                        <div className="text-FontSizeXs text-TextColorMuted">{item.kategori} {item.sub_kategori ? `- ${item.sub_kategori}` : ''}</div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.qty} {item.unit}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.unit_base_price || 0)}
                      </TableCell>
                      <TableCell>
                        <PrimaryButton
                          size="sm"
                          onClick={() => applyDropshipItem(item)}
                          className="w-full text-FontSizeXs py-1"
                        >
                          Pilih
                        </PrimaryButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Modal>
    </FormShell>
  );
};

export default PembelianFormPage;
