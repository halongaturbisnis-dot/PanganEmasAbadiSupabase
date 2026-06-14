import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { TextInput, PhoneInput, EmailInput, LongTextInput } from '../../../../ui/components/elements/Inputs';
import { MapPicker } from '../../../../ui/components/elements/MapPicker';
import { Label } from '../../../../ui/components/elements/Label';
import { suplierService } from '../../../../logic/services/suplierService';
import { ISuplier } from '../../../../logic/types/ITs_Suplier';
import { toast } from 'react-hot-toast';
import { useLocation } from '../../../../logic/hooks/useLocation';
import { reverseGeocode } from '../../../../logic/utils/map';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { cn } from '../../../../logic/utils/cn';

/**
 * SUPLIER FORM PAGE
 * Halaman form untuk Tambah/Edit data Suplier.
 * Mengikuti tata letak Split (Panel Input di Kiri, Map di Kanan).
 */
export const SuplierFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;
  const { getLocation } = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ISuplier>>({
    name: '',
    telepon: '',
    email: '',
    latlong: '', // Akan diisi oleh H-E-R-E jika tambah baru
    alamat: '',
  });

  // Load data or Detect current location for new entry
  useEffect(() => {
    if (isEdit && id) {
      loadData(id);
    } else {
      detectCurrentLocation();
    }
  }, [isEdit, id]);

  const detectCurrentLocation = async () => {
    const loc = await getLocation();
    if (loc) {
      const coords = `${loc.latitude},${loc.longitude}`;
      setFormData(prev => ({ ...prev, latlong: coords }));
      
      // Auto-populate address from current location
      const addr = await reverseGeocode(loc.latitude, loc.longitude);
      setFormData(prev => ({ ...prev, alamat: addr }));
    } else {
      // Default Jakarta if detection fails
      setFormData(prev => ({ ...prev, latlong: '-6.200000,106.816666' }));
    }
  };

  const loadData = async (suplierId: string) => {
    setIsLoading(true);
    try {
      const result = await suplierService.getById(suplierId);
      if (result) {
        setFormData(result);
      }
    } catch (error) {
      toast.error('Gagal memuat data suplier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapChange = async (pos: { lat: number, lng: number }) => {
    const coords = `${pos.lat},${pos.lng}`;
    setFormData(prev => ({ ...prev, latlong: coords }));
    
    // Auto-update address from position
    const addr = await reverseGeocode(pos.lat, pos.lng);
    if (addr) {
      setFormData(prev => ({ ...prev, alamat: addr }));
    }
  };

  const isFormValid = !!(
    formData.name &&
    formData.telepon &&
    formData.latlong &&
    formData.alamat
  );

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      if (isEdit && id) {
        await suplierService.update(id, formData);
        toast.success('Suplier berhasil diperbarui');
      } else {
        await suplierService.create(formData as Omit<ISuplier, 'id' | 'created_at' | 'updated_at'>);
        toast.success('Suplier berhasil ditambahkan');
      }
      navigate('/pengadaan/suplier');
    } catch (error) {
      toast.error('Gagal menyimpan data suplier');
    } finally {
      setIsLoading(false);
    }
  };

  const mapValue = formData.latlong ? {
    lat: parseFloat(formData.latlong.split(',')[0]),
    lng: parseFloat(formData.latlong.split(',')[1])
  } : undefined;

  return (
    <FormShell
      id="suplier-form-shell"
      title={isEdit ? 'Edit Suplier' : 'Tambah Suplier'}
      subtitle={isEdit ? 'Perbarui informasi mitra pengadaan.' : 'Daftarkan suplier baru ke dalam sistem.'}
      onSave={handleSave}
      onCancel={() => navigate('/pengadaan/suplier')}
      isLoading={isLoading}
      isSaveDisabled={!isFormValid || isLoading}
    >
      <div className={cn(
        "grid gap-SpacingLarge w-full h-full",
        isMobile ? "grid-cols-1" : "lg:grid-cols-12"
      )}>
        {/* Left Column: Form Inputs (4 columns) */}
        <div className={cn(
          "flex flex-col gap-y-SpacingMedium",
          !isMobile && "lg:col-span-6"
        )}>
          <div className="grid grid-cols-2 gap-x-SpacingBase gap-y-SpacingMedium">
            <div className="space-y-SpacingSmall col-span-1">
              <Label id="label-name" required>Nama Suplier</Label>
              <TextInput
                id="name"
                placeholder="Contoh: PT. Maju Bersama"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-ColorBg/OpacitySubtle "
              />
            </div>
            
            <div className="space-y-SpacingSmall col-span-1">
              <Label id="label-bank_name">Nama Bank</Label>
              <TextInput
                id="bank_name"
                placeholder="Contoh: BCA"
                value={formData.bank_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>

            <div className="space-y-SpacingSmall col-span-1">
              <Label id="label-telepon" required>Telepon</Label>
              <PhoneInput
                id="telepon"
                placeholder="+62 812..."
                value={formData.telepon || ''}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
              />
            </div>

            <div className="space-y-SpacingSmall col-span-1">
              <Label id="label-no_rekening">Nomor Rekening</Label>
              <TextInput
                id="no_rekening"
                placeholder="Contoh: 1234567890"
                value={formData.no_rekening || ''}
                onChange={(e) => setFormData({ ...formData, no_rekening: e.target.value.replace(/\D/g, '') })}
              />
            </div>

            <div className="space-y-SpacingSmall col-span-1">
              <Label id="label-email">Email</Label>
              <EmailInput
                id="email"
                placeholder="suplier@email.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-SpacingSmall col-span-1">
              <Label id="label-nama_pemilik_rekening">Nama Pemilik Rekening</Label>
              <TextInput
                id="nama_pemilik_rekening"
                placeholder="Contoh: Budi Santoso"
                value={formData.nama_pemilik_rekening || ''}
                onChange={(e) => setFormData({ ...formData, nama_pemilik_rekening: e.target.value })}
              />
            </div>

            <div className="space-y-SpacingSmall col-span-2">
              <Label id="label-alamat" required>Alamat</Label>
              <LongTextInput
                id="alamat"
                placeholder="Masukkan alamat lengkap..."
                value={formData.alamat || ''}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="min-h-[160px]"
              />
              <p className="text-FontSizeNano text-TextColorMuted italic mt-SpacingTiny">
                *Klik peta untuk update otomatis alamat.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Map Picker (8 columns) */}
        <div className={cn(
          "h-[60vh] lg:h-full relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner",
          !isMobile && "lg:col-span-6"
        )}>
          <MapPicker
            id="suplier-map-picker"
            value={mapValue}
            onChange={handleMapChange}
            className="w-full h-full !border-none"
          />
        </div>
      </div>
    </FormShell>
  );
};

export default SuplierFormPage;
