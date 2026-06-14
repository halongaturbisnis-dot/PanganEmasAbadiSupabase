import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { TextInput } from '../../../../ui/components/elements/Inputs';
import { Label } from '../../../../ui/components/elements/Label';
import { bankAndCashService } from '../../../../logic/services/bankAndCashService';
import { IBankAndCash, TBankAndCashType } from '../../../../logic/types/ITs_BankAndCash';
import { toast } from 'react-hot-toast';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { PrimaryButton } from '../../../../ui/components/elements/Button';
import { Checkbox } from '../../../../ui/components/elements/Inputs';

/**
 * BANK AND CASH FORM PAGE
 * Halaman tambah/edit data Kas & Bank.
 */
export const BankAndCashFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { state } = useGlobalState();
  const isCompact = state.viewport.isCompact;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<IBankAndCash>>({
    nama_akun: '',
    tipe: TBankAndCashType.BANK, // Default to Bank for new entries
    nama_bank: '',
    nomor_rekening: '',
    nama_pemilik: '',
    is_default: 0,
  });

  useEffect(() => {
    if (isEdit && id) {
      loadData(id);
    }
  }, [isEdit, id]);

  const loadData = async (targetId: string) => {
    setIsLoading(true);
    try {
      const data = await bankAndCashService.getById(targetId);
      if (data) {
        setFormData(data);
      } else {
        toast.error('Data tidak ditemukan');
        navigate('/finansial/kas-bank');
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !!(
    formData.nama_akun &&
    (formData.tipe === TBankAndCashType.KAS || (formData.nama_bank && formData.nomor_rekening && formData.nama_pemilik))
  );

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      if (isEdit && id) {
        await bankAndCashService.update(id, formData);
        toast.success('Data berhasil diperbarui');
      } else {
        // Enforce type Bank for new entries as per requirement
        const payload = { 
          ...formData, 
          tipe: TBankAndCashType.BANK 
        } as Omit<IBankAndCash, 'id' | 'created_at' | 'updated_at' | 'is_deletable'>;
        
        await bankAndCashService.create(payload);
        toast.success('Rekening bank berhasil ditambahkan');
      }
      navigate('/finansial/kas-bank');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormShell
      id="kas-bank-form-shell"
      title={isEdit ? 'Edit Kas & Bank' : 'Tambah Bank'}
      subtitle={isEdit ? 'Perbarui informasi rekening atau akun kas.' : 'Daftarkan rekening bank baru untuk transaksi.'}
      onSave={handleSave}
      onCancel={() => navigate('/finansial/kas-bank')}
      isLoading={isLoading}
      isSaveDisabled={!isFormValid || isLoading}
    >
      <div className="flex flex-col gap-SpacingLarge w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-SpacingLarge gap-y-SpacingMedium">
          
          {/* Kolom Kiri: Informasi Akun & Bank */}
          <div className="flex flex-col gap-SpacingMedium">
            <div className="space-y-SpacingSmall">
              <Label id="label-nama-akun" required>Nama Akun / Alias</Label>
              <TextInput
                id="nama_akun"
                placeholder="Contoh: Bank BCA Toko, Kas Kecil, dll"
                value={formData.nama_akun || ''}
                onChange={(e) => setFormData({ ...formData, nama_akun: e.target.value })}
                error={!formData.nama_akun ? "Nama akun wajib diisi" : ""}
              />
            </div>

            {formData.tipe === TBankAndCashType.BANK && (
              <div className="space-y-SpacingSmall">
                <Label id="label-nama-bank" required>Nama Bank</Label>
                <TextInput
                  id="nama_bank"
                  placeholder="e.g. BCA, Mandiri, BNI"
                  value={formData.nama_bank || ''}
                  onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
                  error={!formData.nama_bank ? "Nama bank wajib diisi" : ""}
                />
              </div>
            )}

            {formData.tipe === TBankAndCashType.KAS && (
              <div className="p-SpacingBase bg-ColorSecondary/5 rounded-RadiusMedium border border-ColorSecondary/20">
                <p className="text-FontSizeSm text-ColorSecondary font-medium">
                  Informasi: Akun bertipe Kas adalah akun operasional internal toko.
                </p>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Rekening & Default */}
          <div className="flex flex-col gap-SpacingMedium">
            {formData.tipe === TBankAndCashType.BANK ? (
              <>
                <div className="space-y-SpacingSmall">
                  <Label id="label-nomor-rekening" required>Nomor Rekening</Label>
                  <TextInput
                    id="nomor_rekening"
                    placeholder="Masukkan no rekening..."
                    value={formData.nomor_rekening || ''}
                    onChange={(e) => setFormData({ ...formData, nomor_rekening: e.target.value })}
                    error={!formData.nomor_rekening ? "Nomor rekening wajib diisi" : ""}
                  />
                </div>

                <div className="space-y-SpacingSmall">
                  <Label id="label-nama-pemilik" required>Nama Pemilik Rekening</Label>
                  <TextInput
                    id="nama_pemilik"
                    placeholder="Sesuai buku tabungan..."
                    value={formData.nama_pemilik || ''}
                    onChange={(e) => setFormData({ ...formData, nama_pemilik: e.target.value })}
                    error={!formData.nama_pemilik ? "Nama pemilik wajib diisi" : ""}
                  />
                </div>
              </>
            ) : (
              <div className="h-[12.5rem] flex items-center justify-center border border-dashed border-ColorSidebarBorder/OpacitySubtle rounded-RadiusMedium text-TextColorMuted/40 italic text-FontSizeSm">
                Informasi bank tidak diperlukan untuk tipe Kas
              </div>
            )}

          </div>
        </div>
      </div>
    </FormShell>
  );
};

export default BankAndCashFormPage;
