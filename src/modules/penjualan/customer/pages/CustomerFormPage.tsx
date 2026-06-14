import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { TextInput, PhoneInput, EmailInput, LongTextInput } from '../../../../ui/components/elements/Inputs';
import { CustomValueDropdown } from '../../../../ui/components/elements/Dropdown';
import { Label } from '../../../../ui/components/elements/Label';
import { MapPicker } from '../../../../ui/components/elements/MapPicker';
import { customerService } from '../../../../logic/services/customerService';
import { locationService } from '../../../../logic/services/locationService';
import { ICustomer } from '../../../../logic/types/ITs_Customer';
import { toast } from 'react-hot-toast';
import { useGlobalState } from '../../../../logic/context/GlobalContext';

/**
 * CUSTOMER FORM PAGE
 * Halaman untuk tambah atau edit data Customer.
 * Mengikuti FormPageUIGuideline.md.
 */
export const CustomerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [dynamicBidangOptions, setDynamicBidangOptions] = useState<{ label: string; value: string }[]>([]);
  const [formData, setFormData] = useState<Partial<ICustomer>>({
    name: '',
    company: '',
    telepon: '',
    email: '',
    latlong: '-6.2088,106.8456', // Default Jakarta
    alamat: '',
    bidang_usaha: '',
  });

  // Init Current Location on Create
  useEffect(() => {
    loadDynamicOptions();
    if (!isEdit) {
      initCurrentLocation();
    }
  }, [isEdit]);

  const loadDynamicOptions = async () => {
    try {
      const options = await customerService.getDistinctBidangUsaha();
      setDynamicBidangOptions(options);
    } catch (err) {
      console.error('Failed to load dynamic bidang options', err);
    }
  };

  const initCurrentLocation = async () => {
    try {
      const pos = await locationService.getCurrentPosition();
      const latlong = `${pos.latitude},${pos.longitude}`;
      setFormData(prev => ({ ...prev, latlong }));
      reverseGeocode(pos.latitude, pos.longitude);
    } catch (error) {
      console.warn('Geolocation failed, using default');
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      loadData(id);
    }
  }, [isEdit, id]);

  const loadData = async (customerId: string) => {
    setIsLoading(true);
    try {
      const data = await customerService.getById(customerId);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      toast.error('Gagal memuat data customer');
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      // Menggunakan Nominatim OSM (Tanpa API Key, Free Tier)
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, alamat: data.display_name }));
      }
    } catch (err) {
      console.error('Reverse Geocode failed', err);
    } finally {
      setIsGeocoding(false);
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
        await customerService.update(id, formData);
        toast.success('Data customer berhasil diperbarui');
      } else {
        await customerService.create(formData as ICustomer);
        toast.success('Customer baru berhasil ditambahkan');
      }
      navigate('/penjualan/customer');
    } catch (error) {
      toast.error('Gagal menyimpan data customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (pos: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, latlong: `${pos.lat},${pos.lng}` }));
    reverseGeocode(pos.lat, pos.lng);
  };

  // Convert latlong string for MapPicker
  const coords = formData.latlong?.split(',').map(v => parseFloat(v.trim())) || [-6.2088, 106.8456];
  const mapValue = { lat: coords[0], lng: coords[1] };

  return (
    <FormShell
      id="customer-form-shell"
      title={isEdit ? 'Edit Customer' : 'Tambah Customer'}
      subtitle={isEdit ? 'Perbarui informasi detail pelanggan.' : 'Daftarkan pelanggan baru ke dalam sistem.'}
      onSave={handleSave}
      onCancel={() => navigate('/penjualan/customer')}
      isLoading={isLoading}
      isSaveDisabled={!isFormValid || isLoading || isGeocoding}
    >
      <div className="flex flex-col lg:flex-row gap-SpacingLarge items-start w-full">
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="w-full lg:w-1/2 space-y-SpacingMedium">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium">
            <div className="space-y-SpacingTiny md:col-span-2">
              <Label id="label-name" required>Nama Customer</Label>
              <TextInput
                id="name"
                placeholder="Masukkan nama lengkap..."
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-SpacingTiny">
              <Label id="label-company">Perusahaan</Label>
              <TextInput
                id="company"
                placeholder="Nama PT / CV..."
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="space-y-SpacingTiny">
              <Label id="label-bidang">Bidang Usaha</Label>
              <CustomValueDropdown
                id="bidang_usaha"
                options={[]}
                dynamicOptions={dynamicBidangOptions}
                placeholder="e.g. Retail, Kuliner..."
                value={formData.bidang_usaha || ''}
                onChange={(val) => setFormData({ ...formData, bidang_usaha: String(val) })}
              />
            </div>

            <div className="space-y-SpacingTiny">
              <Label id="label-telepon" required>No. Telepon</Label>
              <PhoneInput
                id="telepon"
                value={formData.telepon || ''}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
              />
            </div>

            <div className="space-y-SpacingTiny">
              <Label id="label-email">Email</Label>
              <EmailInput
                id="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-SpacingTiny md:col-span-2">
              <Label id="label-alamat" required>Alamat</Label>
              <LongTextInput
                id="alamat"
                placeholder={isGeocoding ? "Sedang melacak alamat..." : "Alamat penagihan atau pengiriman..."}
                value={formData.alamat || ''}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: MAP PICKER */}
        <div className="w-full lg:w-1/2 space-y-SpacingTiny">
          <div className="rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner bg-ColorBgSecondary/OpacitySubtle">
            <MapPicker
              id="customer-map-picker"
              value={mapValue}
              onChange={handleLocationChange}
              className="!h-[415px]" 
            />
          </div>
          <p className="text-FontSizeNano text-TextColorMuted italic mt-SpacingNano">
            * Geser pin atau klik pada peta untuk menentukan lokasi tepat. Alamat akan terupdate otomatis.
          </p>
        </div>
      </div>
    </FormShell>
  );
};

export default CustomerFormPage;
