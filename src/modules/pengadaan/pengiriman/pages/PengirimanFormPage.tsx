import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { TextInput, LongTextInput, PhoneInput } from '../../../../ui/components/elements/Inputs';
import { FixedDropdown, CustomValueDropdown } from '../../../../ui/components/elements/Dropdown';
import { DateTimeInput } from '../../../../ui/components/elements/DateTimeInput';
import { MultipleUploadInput as UploadInput } from '../../../../ui/components/elements/UploadInput';
import { Label } from '../../../../ui/components/elements/Label';
import { pengirimanService } from '../../../../logic/services/pengirimanService';
import { pembelianService } from '../../../../logic/services/pembelianService';
import { IPengirimanPayload, TPengirimanStatus, IPengirimanFile } from '../../../../logic/types/ITs_Pengiriman';
import { storageService } from '../../../../logic/services/storage';
import { toast } from 'react-hot-toast';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';

export const PengirimanFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  
  // Get purchase_id from query params if available
  const queryParams = new URLSearchParams(location.search);
  const initialPurchaseId = queryParams.get('purchase_id');
  
  const { state: { viewport } } = useGlobalState();
  const { isMobile } = viewport;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [purchasePoNumber, setPurchasePoNumber] = useState<string>('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const getLocalISOString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };
  
  const [formData, setFormData] = useState<Partial<IPengirimanPayload>>({
    purchase_id: initialPurchaseId || '',
    datetime: getLocalISOString(),
    shipping_type: '',
    description: '',
    vehicle_number: '',
    vehicle_type: '',
    driver_name: 'System Default', // Hidden but required by logic/types if any
    driver_phone: '',
    status: TPengirimanStatus.SHIPPED, // Default to Shipped since it's going out
    proof_fileurl: [],
  });

  useEffect(() => {
    if (initialPurchaseId) {
      loadPurchaseDetail(initialPurchaseId);
    }
    if (isEdit && id) {
      loadData(id);
    }
  }, [isEdit, id, initialPurchaseId]);

  const loadPurchaseDetail = async (purchaseId: string) => {
    try {
      const purchase = await pembelianService.getById(purchaseId);
      if (purchase) {
        setPurchasePoNumber(purchase.po_number);
        setFormData(prev => ({ ...prev, purchase_id: purchase.id }));
      }
    } catch (err) {
      console.error('Gagal memuat detail pembelian', err);
    }
  };

  const loadData = async (pengirimanId: string) => {
    setIsLoading(true);
    try {
      const data = await pengirimanService.getById(pengirimanId);
      if (data) {
        setFormData(data);
        if (data.purchase_id) {
          loadPurchaseDetail(data.purchase_id);
        }
      }
    } catch (error) {
      toast.error('Gagal memuat data pengiriman');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !!(
    formData.purchase_id &&
    formData.datetime &&
    formData.shipping_type
  );

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    
    try {
      let finalProofFileUrl = [...(formData.proof_fileurl || [])];
      
      // Upload pending files if any
      if (pendingFiles.length > 0) {
        setIsUploading(true);
        try {
          for (const file of pendingFiles) {
            const result = await storageService.upload(file, 'pengiriman');
            finalProofFileUrl.push({
              url: result.url,
              name: file.name
            });
          }
          toast.success(`${pendingFiles.length} file berhasil diunggah`);
        } catch (uploadError) {
          toast.error('Gagal mengunggah beberapa file');
          setIsUploading(false);
          setIsLoading(false);
          return; // Stop saving if upload fails
        }
        setIsUploading(false);
      }

      const payload = {
        ...formData,
        proof_fileurl: finalProofFileUrl
      } as IPengirimanPayload;

      if (isEdit && id) {
        await pengirimanService.update(id, payload);
        toast.success('Pengiriman berhasil diperbarui');
      } else {
        await pengirimanService.create(payload);
        toast.success('Pengiriman berhasil ditambahkan');
      }
      navigate('/pengadaan/pengiriman');
    } catch (error) {
      toast.error('Gagal menyimpan data pengiriman');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handlePendingFilesChange = (files: File[]) => {
    setPendingFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = async (url: string) => {
    // Optional: Delete from storage if key is known. 
    // Usually url needs to be mapped back to key or we just remove from state for now.
    setFormData(prev => ({
      ...prev,
      proof_fileurl: prev.proof_fileurl?.filter(f => f.url !== url) || []
    }));
  };

  const shippingTypeOptions = [
    { label: 'Internal / Mandiri', value: 'Internal' },
    { label: 'Ekspedisi Pihak Ketiga', value: 'Ekspedisi' },
    { label: 'Pickup Pelanggan', value: 'Pickup' },
  ];

  return (
    <FormShell
      id="pengiriman-form-shell"
      title={isEdit ? 'Edit Pengiriman' : 'Tambah Pengiriman'}
      subtitle={isEdit ? 'Perbarui informasi logistik pengiriman.' : 'Catat pengiriman baru dari pembelian barang.'}
      onSave={handleSave}
      onCancel={() => navigate('/pengadaan/pengiriman')}
      isLoading={isLoading || isUploading}
      isSaveDisabled={!isFormValid || isLoading || isUploading}
    >
      <div className="flex flex-col gap-SpacingLarge pb-[2rem] w-full">
        {/* TOP SECTION: 3 Columns */}
        <div className={cn(
          "grid gap-x-SpacingLarge gap-y-SpacingMedium",
          isMobile ? "grid-cols-1" : "grid-cols-3"
        )}>
          <div className="space-y-SpacingSmall">
            <Label id="label-purchase" required>No. PO</Label>
            <TextInput
              id="purchase_id_display"
              value={purchasePoNumber || 'Pilih PO dari daftar Belum Dikirim'}
              disabled={true}
              placeholder="PO Belum Terpilih"
              className="bg-Slate50 font-bold text-Slate900"
            />
          </div>
          
          <div className="space-y-SpacingSmall">
            <Label id="label-datetime" required>Waktu Pengiriman</Label>
            <DateTimeInput
              id="datetime"
              value={formData.datetime || ''}
              onChange={(e) => setFormData({ ...formData, datetime: (e.target as HTMLInputElement).value })}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-shipping-type" required>Jenis Pengiriman</Label>
            <CustomValueDropdown
              id="shipping_type"
              options={shippingTypeOptions}
              placeholder="Contoh: Kargo"
              value={formData.shipping_type || ''}
              onChange={(val) => setFormData({ ...formData, shipping_type: String(val) })}
            />
          </div>
        </div>

        {/* MIDDLE SECTION: 3 Columns */}
        <div className={cn(
          "grid gap-x-SpacingLarge gap-y-SpacingMedium",
          isMobile ? "grid-cols-1" : "grid-cols-3"
        )}>
          <div className="space-y-SpacingSmall">
            <Label id="label-vehicle-number">NoPol</Label>
            <TextInput
              id="vehicle_number"
              placeholder="e.g. B 1234 XYZ"
              value={formData.vehicle_number || ''}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-vehicle-type">Jenis Kendaraan</Label>
            <TextInput
              id="vehicle_type"
              placeholder="e.g. Truck Colt Diesel"
              value={formData.vehicle_type || ''}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            />
          </div>

          <div className="space-y-SpacingSmall">
            <Label id="label-driver-phone">No Telp Sopir</Label>
            <PhoneInput
              id="driver_phone"
              value={formData.driver_phone || ''}
              onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
            />
          </div>
        </div>

        {/* BOTTOM SECTION: 2 Large Boxes */}
        <div className={cn(
          "grid gap-SpacingLarge",
          isMobile ? "grid-cols-1" : "grid-cols-2"
        )}>
          <div className="space-y-SpacingSmall flex flex-col h-full">
            <Label id="label-description">Deskripsi</Label>
            <LongTextInput
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail rute, kondisi barang, dll..."
              className="flex-1 min-h-[150px]"
            />
          </div>

          <div className="space-y-SpacingSmall flex flex-col h-full text-FontSizeNano text-TextColorMuted">
            <Label id="label-proof">Lampiran Bukti Pengiriman</Label>
            <div className="flex-1 min-h-[150px] border border-ColorSidebarBorder/OpacitySubtle rounded-RadiusMedium p-SpacingSmall bg-ColorBgSecondary/OpacityMuted shadow-inner">
              <UploadInput
                id="proof_fileurl"
                onFilesChange={handlePendingFilesChange}
                initialUrls={formData.proof_fileurl?.map(f => f.url) || []}
                onRemoveInitialUrl={handleRemoveFile}
              />
            </div>
          </div>
        </div>
      </div>
    </FormShell>
  );
};

export default PengirimanFormPage;
