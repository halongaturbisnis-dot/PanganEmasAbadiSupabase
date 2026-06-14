import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormShell } from '../../../ui/components/common/shells/FormShell';
import { TextInput, PasswordInput, PhoneInput } from '../../../ui/components/elements/Inputs';
import { CustomValueDropdown, FixedDropdown, FixedMultiDropdown } from '../../../ui/components/elements/Dropdown';
import { ProfilePhotoInput } from '../../../ui/components/elements/ProfilePhotoInput';
import { MultiButtonSelection } from '../../../ui/components/elements/MultiButtonSelection';
import { ToggleButton } from '../../../ui/components/elements/ToggleButton';
import { Label } from '../../../ui/components/elements/Label';
import { akunService } from '../../../logic/services/akunService';
import { TPeran, TModul, IAkun } from '../../../logic/types/ITs_Akun';
import { toast } from 'react-hot-toast';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export const AkunFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { state } = useGlobalState();
  const isCompact = state.viewport.isCompact;

  const [isLoading, setIsLoading] = useState(false);
  const [dynamicJabatanOptions, setDynamicJabatanOptions] = useState<{ label: string; value: string }[]>([]);
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
  const [isKodeAksesTaken, setIsKodeAksesTaken] = useState(false);
  const [formData, setFormData] = useState<Partial<IAkun>>({
    kode_akses: '',
    username: '',
    password: '',
    telepon: '',
    jabatan: '',
    foto_profil: null,
    peran: TPeran.USER,
    akses_modul: ['Pemrosesan', 'Pengiriman', 'Marketing'], // Default modules for USER
    has_invoice_approval: false,
    is_active: true,
  });

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const getModulOptionsByPeran = (peran: TPeran): { label: string; value: TModul }[] => {
    switch (peran) {
      case TPeran.USER:
        return [
          { label: 'Pemrosesan', value: 'Pemrosesan' },
          { label: 'Pengiriman', value: 'Pengiriman' },
          { label: 'Marketing', value: 'Marketing' },
        ];
      case TPeran.ADMIN:
        return [
          { label: 'Data Akun', value: 'Data Akun' },
          { label: 'Pengadaan', value: 'Pengadaan' },
          { label: 'Gudang', value: 'Gudang' },
          { label: 'Stok Opname', value: 'Stok Opname' },
          { label: 'Penjualan', value: 'Penjualan' },
          { label: 'Finansial', value: 'Finansial' },
          { label: 'Marketing', value: 'Marketing' },
        ];
      case TPeran.GUEST:
        return [
          { label: 'Penjualan', value: 'Penjualan' },
          { label: 'Finansial', value: 'Finansial' },
          { label: 'Produk', value: 'Produk' },
          { label: 'Marketing', value: 'Marketing' },
          { label: 'Customer', value: 'Customer' },
        ];
      default:
        return [];
    }
  };

  const jabatanOptions = [
    { label: 'Manager Operasional', value: 'Manager Operasional' },
    { label: 'Staff Marketing', value: 'Staff Marketing' },
    { label: 'Supervisor Finansial', value: 'Supervisor Finansial' },
  ];

  const peranOptions = [
    { label: 'Admin', value: TPeran.ADMIN },
    { label: 'User', value: TPeran.USER },
    { label: 'Guest', value: TPeran.GUEST },
  ];

  const statusOptions = [
    { label: 'Aktif', value: 'aktif' },
    { label: 'Non-Aktif', value: 'nonaktif' },
  ];

  const [modulOptions, setModulOptions] = useState<{ label: string; value: TModul }[]>(getModulOptionsByPeran(formData.peran as TPeran));

  useEffect(() => {
    if (formData.peran) {
      setModulOptions(getModulOptionsByPeran(formData.peran as TPeran));
    }
  }, [formData.peran]);

  useEffect(() => {
    loadDynamicOptions();
    if (isEdit && id) {
      loadData(id);
    }
  }, [isEdit, id]);

  const loadDynamicOptions = async () => {
    try {
      const options = await akunService.getDistinctJabatan();
      setDynamicJabatanOptions(options);
    } catch (err) {
      console.error('Failed to load dynamic jabatan options', err);
    }
  };

  const loadData = async (akunId: string) => {
    setIsLoading(true);
    try {
      const data = await akunService.getById(akunId);
      if (data) {
        setFormData({
          ...data,
          telepon: data.telepon || '',
          password: '', // Clear password field for security/usability in edit mode
        });
        if (data.foto_profil) {
          setImagePreviewUrl(data.foto_profil);
        }
      }
    } catch (error) {
      toast.error('Gagal memuat data akun');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !!(
    formData.kode_akses &&
    formData.username &&
    formData.jabatan &&
    formData.peran &&
    (formData.akses_modul && formData.akses_modul.length > 0) &&
    (isEdit ? true : formData.password)
  );

  const handlePeranChange = (val: TPeran) => {
    const options = getModulOptionsByPeran(val);
    setFormData(prev => ({
      ...prev,
      peran: val,
      akses_modul: options.map(opt => opt.value)
    }));
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      // Uniqueness check before saving
      const usernameTaken = await akunService.isUsernameTaken(formData.username || '', id);
      const kodeAksesTaken = await akunService.isKodeAksesTaken(formData.kode_akses || '', id);

      if (usernameTaken) {
        setIsUsernameTaken(true);
        toast.error('Gagal: Username sudah digunakan oleh akun lain');
        setIsLoading(false);
        return;
      }

      if (kodeAksesTaken) {
        setIsKodeAksesTaken(true);
        toast.error('Gagal: Kode akses sudah digunakan oleh akun lain');
        setIsLoading(false);
        return;
      }

      const dbPayload = { ...formData };
      
      // Kosongkan password jika sedang diedit tapi string kosong (artinya tidak diubah)
      if (isEdit && !dbPayload.password) {
        delete dbPayload.password;
      }

      if (isEdit && id) {
        await akunService.update(id, dbPayload, fotoFile || undefined);
        toast.success('Akun berhasil diperbarui');
      } else {
        await akunService.create(dbPayload as IAkun, fotoFile || undefined);
        toast.success('Akun berhasil ditambahkan');
      }
      navigate('/akun');
    } catch (error) {
      toast.error('Gagal menyimpan data akun');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormShell
      id="akun-form-shell"
      title={isEdit ? 'Edit Akun' : 'Tambah Akun'}
      subtitle={isEdit ? 'Perbarui data akun yang sudah ada.' : 'Tambahkan akun baru ke dalam sistem.'}
      onSave={handleSave}
      onCancel={() => navigate('/akun')}
      isLoading={isLoading}
      isSaveDisabled={!isFormValid || isLoading}
    >
      <div className="flex flex-col md:flex-row gap-SpacingLarge items-start w-full">
        <div className="w-full md:w-1/3 flex flex-col items-center justify-start space-y-SpacingSmall">
          <Label id="label-foto" className="self-start pl-SpacingNano border-none opacity-70">
            Foto Profil
          </Label>
          <ProfilePhotoInput
            id="akun-foto-input"
            value={imagePreviewUrl || null}
            onChange={(file) => {
              if (file instanceof File) {
                setFotoFile(file);
                setImagePreviewUrl(URL.createObjectURL(file));
                // Clear the string reference when a new file is picked
                setFormData(prev => ({ ...prev, foto_profil: undefined }));
              } else if (typeof file === 'string') {
                setImagePreviewUrl(file);
                setFotoFile(null);
                setFormData(prev => ({ ...prev, foto_profil: file }));
              } else if (file === null) {
                setImagePreviewUrl(null);
                setFotoFile(null);
                setFormData(prev => ({ ...prev, foto_profil: null }));
              }
            }}
            className="w-48 h-48 rounded-RadiusMaximum"
          />

          
            {/* Row 4: Status */}
            <div className="w-full space-y-SpacingSmall">
              <Label id="label-status" required>Status</Label>
              <FixedDropdown
                id="is_active"
                options={statusOptions}
                placeholder="Pilih status..."
                value={formData.is_active ? 'aktif' : 'nonaktif'}
                onChange={(val) => setFormData({ ...formData, is_active: val === 'aktif' })}
              />
            </div>
        </div>

        <div className="w-full md:w-2/3 space-y-SpacingLarge flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-SpacingLarge gap-y-SpacingMedium">
            {/* Row 1: Username & Kode Akses */}
            <div className="space-y-SpacingSmall">
              <Label id="label-username" required>Username</Label>
              <TextInput
                id="username"
                placeholder="Masukkan username..."
                value={formData.username || ''}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setIsUsernameTaken(false);
                }}
                error={isUsernameTaken ? "Username sudah digunakan" : !formData.username ? "Username wajib diisi" : ""}
              />
            </div>
            
            <div className="space-y-SpacingSmall">
              <Label id="label-kode-akses" required>Kode Akses</Label>
              <TextInput
                id="kode_akses"
                placeholder="e.g. OPT-001"
                value={formData.kode_akses || ''}
                onChange={(e) => {
                  setFormData({ ...formData, kode_akses: e.target.value });
                  setIsKodeAksesTaken(false);
                }}
                error={isKodeAksesTaken ? "Kode akses sudah digunakan" : !formData.kode_akses ? "Kode akses wajib diisi" : ""}
              />
            </div>

            {/* Row 2: Phone & Password */}
            <div className="space-y-SpacingSmall">
              <Label id="label-telepon">Telepon</Label>
              <PhoneInput
                id="telepon"
                placeholder="+62 812..."
                value={formData.telepon || ''}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-password" required={!isEdit}>
                 Kata Sandi {isEdit && <span className="text-ColorWarning/80 lowercase italic font-medium">(kosongkan jika tidak diubah)</span>}
              </Label>
              <PasswordInput
                id="password"
                placeholder={isEdit ? "Kata sandi baru..." : "Buat kata sandi..."}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!isEdit && !formData.password ? "Kata sandi wajib diisi" : ""}
              />
            </div>

            {/* Row 3: Jabatan & Peran */}
            <div className="space-y-SpacingSmall">
              <Label id="label-jabatan" required>Jabatan</Label>
              <CustomValueDropdown
                id="jabatan"
                options={jabatanOptions}
                dynamicOptions={dynamicJabatanOptions}
                placeholder="Pilih jabatan..."
                value={formData.jabatan || ''}
                onChange={(val) => setFormData({ ...formData, jabatan: String(val) })}
                error={!formData.jabatan ? "Jabatan wajib diisi" : ""}
              />
            </div>

            <div className="space-y-SpacingSmall">
              <Label id="label-peran" required>Peran</Label>
              <FixedDropdown
                id="peran"
                options={peranOptions}
                placeholder="Pilih peran..."
                value={formData.peran || ''}
                onChange={(val) => handlePeranChange(val as TPeran)}
                error={!formData.peran ? "Peran wajib diisi" : ""}
              />
            </div>

            {/* Row 5: Modul Akses */}
            <div className="space-y-SpacingSmall md:col-span-2">
              <Label id="label-modul-akses" required>Modul Akses</Label>
              <MultiButtonSelection
                id="akses_modul"
                options={modulOptions}
                value={formData.akses_modul || []}
                onChange={(vals) => setFormData({ ...formData, akses_modul: vals as TModul[] })}
              />
              {!formData.akses_modul || formData.akses_modul.length === 0 ? (
                <p className="text-FontSizeNano text-FeedbackColorError mt-SpacingNano italic text-opacity-80">Minimal pilih satu modul akses</p>
              ) : null}

              {/* Special Permissions for Admin - Checkbox format below Modul Akses */}
              {formData.peran === TPeran.ADMIN && (
                <div className="mt-SpacingMedium">
                  <div className="flex items-center gap-4 py-1">
                    <input 
                      id="has_invoice_approval"
                      type="checkbox"
                      checked={!!formData.has_invoice_approval}
                      onChange={(e) => setFormData({ ...formData, has_invoice_approval: e.target.checked })}
                      className="w-5 h-5 accent-ColorPrimary cursor-pointer"
                    />
                    <label htmlFor="has_invoice_approval" className="text-FontSizeXs font-bold text-TextColorBase cursor-pointer select-none">
                      Persetujuan Invoice
                    </label>
                  </div>
                  <div className="mb-4" /> {/* Spacer statis 1rem */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormShell>
  );
};

