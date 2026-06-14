import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormShell } from '../../ui/components/common/shells/FormShell';
import { 
  TextInput, 
  PhoneInput, 
  EmailInput, 
  LongTextInput 
} from '../../ui/components/elements/Inputs';
import { 
  CustomValueDropdown, 
  FixedDropdown 
} from '../../ui/components/elements/Dropdown';
import { 
  MultipleUploadInput 
} from '../../ui/components/elements/UploadInput';
import { Label } from '../../ui/components/elements/Label';
import { MapPicker } from '../../ui/components/elements/MapPicker';
import { MapViewer } from '../../ui/components/elements/MapViewer';
import { pemasaranService } from '../../logic/services/pemasaranService';
import { customerService } from '../../logic/services/customerService';
import { locationService } from '../../logic/services/locationService';
import { akunService } from '../../logic/services/akunService';
import { ICustomer } from '../../logic/types/ITs_Customer';
import { IPemasaranActivityType } from '../../logic/types/ITs_Pemasaran';
import { getActualTime, getTimezoneIdentifier } from '../../logic/utils/time';
import { toast } from 'react-hot-toast';
import { 
  Loader2, 
  CheckCircle, 
  ArrowRight
} from 'lucide-react';
import { useGlobalState } from '../../logic/context/GlobalContext';
import { cn } from '../../logic/utils/cn';

/**
 * PEMASARAN AKUN FORM PAGE (MULTI-Langkah Wizard)
 * Form harian kunjungan pemasaran sales yang terbagi menjadi 3 langkah / tahap:
 * - Tahap 1: Verifikasi Lokasi Lapangan (Terkunci GPS & Waktu)
 * - Tahap 2: Data Pelanggan (Replikasi CustomerFormPage)
 * - Tahap 3: Hasil & Bukti Kunjungan (Mendalam)
 */
export const PemasaranAkunFormPage: React.FC = () => {
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  // State Stepper ( Langkah 1 atau 2 )
  const [step, setStep] = useState<number>(1);

  // Loading global & geolocator
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Opsi Customer & Bidang Usaha
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedCustDetail, setSelectedCustDetail] = useState<ICustomer | null>(null);
  const [dynamicBidangOptions, setDynamicBidangOptions] = useState<{ label: string; value: string }[]>([]);
  
  // Local state for customer (Replicating PenjualanFormPage 100%!)
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
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // DATA FORM TAHAP 1 & 2
  const [visitDate, setVisitDate] = useState<string>(() => {
    const now = new Date(getActualTime());
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [salesUsername, setSalesUsername] = useState<string>('');
  const [activityType, setActivityType] = useState<IPemasaranActivityType>('selling');
  const [customerId, setCustomerId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [latlongVisiting, setLatlongVisiting] = useState<string>('-6.2088,106.8456'); // Default Jakarta
  const [alamat, setAlamat] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // Pilihan Kegiatan untuk drop-down
  const activityOptions = [
    { label: 'Client Relation (Hubungan Pelanggan)', value: 'client relation' },
    { label: 'Selling (Penjualan Langsung)', value: 'selling' },
    { label: 'Offering (Penawaran Produk)', value: 'offering' }
  ];

  // Efek Saat Mulai / Mount
  useEffect(() => {
    loadCustomers();
    loadDynamicOptions();
    
    // Tarik session aktif untuk penguncian Salesman
    const session = akunService.getCurrentSession();
    if (session?.username) {
      setSalesUsername(session.username);
    }
    
    // Auto detect GPS & Geocoding jika buat baru
    if (!isEdit) {
      initCurrentLocation();
    } else if (id) {
      loadData(id);
    }
  }, [isEdit, id]);

  // Muat data detail customer yang sedang dipilih jika ada
  useEffect(() => {
    if (customerId) {
      customerService.getById(customerId).then(res => {
        setSelectedCustDetail(res);
      });
    } else {
      setSelectedCustDetail(null);
    }
  }, [customerId]);

  const loadCustomers = async () => {
    try {
      const list = await customerService.getAll();
      setCustomers(list);
      setCustomerOptions(list.map(c => ({
        label: c.company ? `${c.name} (${c.company})` : c.name,
        value: c.id
      })));
    } catch (err) {
      toast.error('Gagal memuat daftar pelanggan');
    }
  };

  const loadDynamicOptions = async () => {
    try {
      const options = await customerService.getDistinctBidangUsaha();
      setDynamicBidangOptions(options);
    } catch (err) {
      console.error('Gagal memuat opsi bidang usaha', err);
    }
  };

  const initCurrentLocation = async () => {
    setIsGeocoding(true);
    try {
      const pos = await locationService.getCurrentPosition();
      const coords = `${pos.latitude},${pos.longitude}`;
      setLatlongVisiting(coords);
      // Synchronize with customer location ONLY if it is a new customer or empty
      setCustomerFormData(prev => ({ 
        ...prev, 
        latlong: prev.latlong || coords
      }));
      await reverseGeocode(pos.latitude, pos.longitude);
    } catch (error) {
      console.warn('Geolocation failed, fallback to default');
      toast.error('Gagal mendapatkan GPS. Pastikan izin lokasi aktif agar kunjungan valid.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setAlamat(data.display_name);
        setCustomerFormData(prev => ({ 
          ...prev, 
          alamat: prev.alamat || data.display_name 
        }));
      }
    } catch (err) {
      console.error('Reverse Geocode failed', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const loadData = async (visitId: string) => {
    setIsLoading(true);
    try {
      const data = await pemasaranService.getById(visitId);
      if (data) {
        if (data.visit_date) {
          const dateObj = new Date(data.visit_date);
          dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
          setVisitDate(dateObj.toISOString().slice(0, 16));
        } else {
          setVisitDate('');
        }
        setSalesUsername(data.sales_username || '');
        setActivityType(data.activity_type || 'selling');
        setCustomerId(data.customer_id || '');
        setDescription(data.description || '');
        setLatlongVisiting(data.latlong_visiting || '');
        setAlamat(data.alamat || '');
        setProofUrl(data.proof_url || '');
        
        // Sync default customer form state if it matches existing customer
        if (data.customer_id) {
           const matchedCustomer = await customerService.getById(data.customer_id);
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
      } else {
        toast.error('Data laporan tidak ditemukan');
        navigate('/pemasaran-akun');
      }
    } catch (err) {
      toast.error('Gagal mengambil detail pemasaran');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerChange = (val: string) => {
    const found = customers.find(c => c.id === val || c.name === val);
    if (found) {
      setCustomerId(found.id);
      setIsNewCustomer(false);
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
      setCustomerId('');
      setIsNewCustomer(!!val);
      setCustomerFormData({
        name: val,
        company: '',
        bidang_usaha: '',
        telepon: '',
        email: '',
        alamat: alamat || '',
        latlong: latlongVisiting || '-6.2088,106.8456'
      });
      setCustomerMode(val ? 'new' : 'locked');
    }
  };

  // Validasi Kelayakan per Langkah
  const isStep1Valid = customerMode === 'new'
    ? !!(customerFormData.name && customerFormData.telepon && customerFormData.alamat)
    : customerMode === 'existing' && !!customerId;
  const isStep2Valid = !!(latlongVisiting && alamat && salesUsername && activityType && (isEdit ? proofUrl || photoFiles.length > 0 : photoFiles.length > 0));

  // Simpan data (Submit Akhir)
  const handleSave = async () => {
    if (!isStep1Valid || !isStep2Valid) {
      toast.error('Mohon periksa kembali kelengkapan isian di tiap tahapan');
      return;
    }

    setIsLoading(true);
    try {
      const basePayload = {
        visit_date: new Date(visitDate).toISOString(),
        sales_username: salesUsername,
        activity_type: activityType,
        alamat: alamat,
        latlong_visiting: latlongVisiting,
        description: description,
        proof_url: proofUrl,
      };

      let result = null;
      const photoFile = photoFiles.length > 0 ? photoFiles[0] : undefined;

      if (isEdit && id) {
        if (customerMode === 'new') {
          toast.error('Pemberlakuan customer baru tidak didukung pada modus edit.');
          setIsLoading(false);
          return;
        }
        
        const payload = { ...basePayload, customer_id: customerId };
        result = await pemasaranService.update(id, payload, photoFile);
        if (result) {
          toast.success('Pembaruan laporan pemasaran harian berhasil disimpan!');
        } else {
          throw new Error('Gagal memperbarui data');
        }
      } else {
        if (customerMode === 'new') {
          const customerPayload: Omit<ICustomer, 'id' | 'created_at' | 'updated_at'> = {
            name: customerFormData.name!,
            company: customerFormData.company || null,
            telepon: customerFormData.telepon || '',
            alamat: customerFormData.alamat || alamat,
            latlong: customerFormData.latlong || latlongVisiting,
            email: customerFormData.email || null,
            bidang_usaha: customerFormData.bidang_usaha || 'Lain-lain'
          };

          result = await pemasaranService.create(basePayload, photoFile!, customerPayload);
        } else {
          const payload = { ...basePayload, customer_id: customerId };
          result = await pemasaranService.create(payload, photoFile!);
        }

        if (result) {
          toast.success('Laporan kunjungan pemasaran harian berhasil dipublikasikan!');
        } else {
          throw new Error('Gagal meluncurkan laporan');
        }
      }

      navigate('/pemasaran-akun');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal merekam kunjungan pemasaran');
    } finally {
      setIsLoading(false);
    }
  };

  // Logic Navigator Langkah
  const handleNext = () => {
    if (step === 1) {
      if (!isStep1Valid) {
        toast.error('Mohon isikan info profil pelanggan atau pilih kontestan terdaftar');
        return;
      }
      setStep(2);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/pemasaran-akun');
    }
  };

  // Setelan label dinamis berdasarkan step
  const getSaveLabel = () => {
    if (step === 1) return 'Lanjut';
    return 'Simpan';
  };

  const getCancelLabel = () => {
    if (step === 1) return 'Batal';
    return 'Kembali';
  };

  const getSaveButtonDisabledStatus = () => {
    if (step === 1) return !isStep1Valid || isLoading;
    return !isStep2Valid || isGeocoding || isLoading;
  };

  return (
    <FormShell
      id="pemasaran-akun-form-shell"
      title={isEdit ? 'Ubah Laporan Kunjunganku' : 'Lapor Kunjunganku Baru'}
      subtitle="Sistem Pendataan Kunjungan Pemasaran Multi-Tahap"
      onSave={step === 2 ? handleSave : handleNext}
      onCancel={handlePrev}
      saveLabel={getSaveLabel()}
      cancelLabel={getCancelLabel()}
      isLoading={isLoading || isGeocoding}
      isSaveDisabled={getSaveButtonDisabledStatus()}
    >
      <div className="w-full flex flex-col gap-6 pb-24">
        
        {/* ========================================================== */}
        {/* CHIP STEPPER INDICATOR */}
        {/* ========================================================== */}
        <div className="w-full bg-white px-3 sm:px-5 py-3 sm:py-4 rounded-xl border border-teal-500/10 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-6">
            {/* Step 1 */}
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity outline-none flex-1 sm:flex-none justify-center sm:justify-start"
            >
              <div className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0",
                step === 1 
                  ? "bg-teal-500 text-white ring-2 sm:ring-4 ring-teal-100" 
                  : step > 1 
                    ? "bg-teal-50 text-teal-600 border border-teal-250" 
                    : "bg-slate-100 text-slate-400"
              )}>
                {step > 1 ? <CheckCircle size={14} className="text-teal-600" /> : "1"}
              </div>
              <div className="text-left hidden xs:block sm:block">
                <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">Tahap 1</p>
                <p className={cn("text-xs font-bold whitespace-nowrap", step === 1 ? "text-slate-900" : "text-slate-500")}>
                  Data Customer
                </p>
              </div>
              <div className="text-left xs:hidden block">
                <p className={cn("text-[10px] font-bold leading-tight", step === 1 ? "text-slate-900" : "text-slate-500")}>
                  Customer
                </p>
              </div>
            </button>

            {/* Hubungan Antar Step */}
            <ArrowRight size={14} className="text-slate-300 shrink-0" />

            {/* Step 2 */}
            <button 
              type="button"
              onClick={() => isStep1Valid && setStep(2)}
              className={cn(
                "flex items-center gap-2 sm:gap-3 transition-opacity outline-none flex-1 sm:flex-none justify-center sm:justify-start",
                !isStep1Valid ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"
              )}
            >
              <div className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0",
                step === 2 
                  ? "bg-teal-500 text-white ring-2 sm:ring-4 ring-teal-100" 
                  : "bg-slate-100 text-slate-400"
              )}>
                2
              </div>
              <div className="text-left hidden xs:block sm:block">
                <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">Tahap 2</p>
                <p className={cn("text-xs font-bold whitespace-nowrap", step === 2 ? "text-slate-900" : "text-slate-500")}>
                  Kunjungan
                </p>
              </div>
              <div className="text-left xs:hidden block">
                <p className={cn("text-[10px] font-bold leading-tight", step === 2 ? "text-slate-900" : "text-slate-500")}>
                  Kunjungan
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* TAHAP 1: DATA PELANGGAN */}
        {/* ========================================================== */}
        {step === 1 && (
          <div className="bg-white p-6 rounded-xl border border-teal-500/10 shadow-sm space-y-6">
            <div className="flex border-b border-gray-100 pb-3 justify-between items-center text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                  Identifikasi Pelanggan (Customer)
                </h3>
              </div>
            </div>

            {/* Two-Column Grid Layout */}
            <div className={cn(
              "grid gap-6 w-full text-left",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
              {/* Kolom Kiri: Input Form */}
              <div className={cn(
                "flex flex-col gap-y-4",
                isMobile ? "w-full" : "col-span-1"
              )}>
                <div className={cn(
                  "grid gap-x-4 gap-y-3",
                  isMobile ? "grid-cols-1" : "grid-cols-2"
                )}>
                  {/* Nama Customer */}
                  <div className={cn("space-y-1.5", isMobile ? "col-span-1" : "col-span-2")}>
                    <Label id="label-customer-select" required>Nama Customer</Label>
                    <CustomValueDropdown
                      id="customer_select"
                      options={customerOptions}
                      placeholder="Pilih atau ketik nama customer baru..."
                      value={customerId || customerFormData.name || ''}
                      onChange={handleCustomerChange}
                    />
                  </div>
                  
                  {/* Perusahaan */}
                  <div className="space-y-1.5">
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

                  {/* Bidang Usaha */}
                  <div className="space-y-1.5">
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

                  {/* No. Telepon */}
                  <div className="space-y-1.5">
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

                  {/* Email */}
                  <div className="space-y-1.5">
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

                  {/* Alamat Customer */}
                  <div className={cn("space-y-1.5", isMobile ? "col-span-1" : "col-span-2")}>
                    <Label id="label-cust-alamat" required>Alamat Customer</Label>
                    <LongTextInput
                      id="cust_alamat"
                      placeholder={customerMode === 'locked' ? 'Pilih/ketik customer dahulu' : 'Masukkan alamat lengkap...'}
                      value={customerFormData.alamat || ''}
                      disabled={customerMode !== 'new'}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, alamat: e.target.value })}
                      className={cn("min-h-32", customerMode !== 'new' && "opacity-80 cursor-not-allowed bg-slate-50")}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Map Viewer/Picker */}
              <div className={cn(
                "relative rounded-xl overflow-hidden border border-slate-200 shadow-inner w-full",
                isMobile ? "h-72" : "h-[26rem]"
              )}>
                {customerMode === 'new' ? (
                  <MapPicker
                    id="pemasaran-akun-customer-map-picker"
                    value={customerFormData.latlong ? { lat: parseFloat(customerFormData.latlong.split(',')[0]), lng: parseFloat(customerFormData.latlong.split(',')[1]) } : { lat: -6.2088, lng: 106.8456 }}
                    onChange={(pos) => setCustomerFormData(prev => ({ ...prev, latlong: `${pos.lat},${pos.lng}` }))}
                    className="w-full h-full !border-none"
                  />
                ) : (
                  <MapViewer
                    id="pemasaran-akun-customer-map-viewer"
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

        {/* ========================================================== */}
        {/* TAHAP 2: DATA KUNJUNGAN */}
        {/* ========================================================== */}
        {step === 2 && (
          <div className={cn(
            "grid gap-6 w-full text-left",
            isMobile ? "grid-cols-1" : "grid-cols-2"
          )}>
            {/* Grid Kiri: Lokasi & Geotag */}
            <div className="bg-white p-6 rounded-xl border border-teal-500/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                  Lokasi Aktual & Geotag
                </h3>
                {isGeocoding && (
                   <div className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold animate-pulse">
                     <Loader2 size={14} className="animate-spin" />
                     Melacak GPS...
                   </div>
                )}
              </div>

              <div className="rounded-lg overflow-hidden border border-gray-200">
                <MapViewer
                  id="pemasaran-akun-visit-map-viewer"
                  latlong={latlongVisiting}
                  label="Titik Kunjungan Anda"
                  className="h-80 w-full !border-none"
                  height="20rem"
                />
              </div>

              <div className="space-y-1.5 mt-4">
                <Label id="label-address-locked">Alamat Geotage Reverse</Label>
                <LongTextInput
                  id="alamat_locked"
                  value={alamat || (isGeocoding ? "Sedang melacak alamat..." : "Alamat tidak terbaca")}
                  disabled
                  readOnly
                  rows={4}
                  className="bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            {/* Grid Kanan: Detail Kegiatan */}
            <div className="bg-white p-6 rounded-xl border border-teal-500/10 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                  Detail Kegiatan & Notulen
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label id="label-act-type" required>Tipe Kegiatan Pemasaran</Label>
                  <FixedDropdown
                    id="activity_type"
                    options={activityOptions}
                    placeholder="Pilih bentuk kegiatan..."
                    value={activityType}
                    onChange={(val) => setActivityType(val as IPemasaranActivityType)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label id="label-desc">Deskripsi Notulen Hasil Kunjungan</Label>
                  <LongTextInput
                    id="description"
                    placeholder="Tuliskan komitmen, penawaran, keluhan pelanggan, atau rencana follow-up secara komprehensif..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label id="label-photo" required={!isEdit}>Lampiran Bukti MultiUploadinput</Label>
                  <MultipleUploadInput
                    id="pemasaran-akun-multi-upload"
                    onFilesChange={(files) => setPhotoFiles(files)}
                    maxFiles={3}
                    initialUrls={proofUrl ? [proofUrl] : []}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </FormShell>
  );
};

export default PemasaranAkunFormPage;
