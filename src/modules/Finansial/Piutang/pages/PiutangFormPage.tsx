import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { piutangService } from '../../../../logic/services/piutangService';
import { IPiutangPayload, TPiutangCategory, TPiutangStatus } from '../../../../logic/types/ITs_Piutang';
import { TextInput, PriceInput, LongTextInput } from '../../../../ui/components/elements/Inputs';
import { FixedDropdown, CustomValueDropdown } from '../../../../ui/components/elements/Dropdown';
import { DateInput } from '../../../../ui/components/elements/DateTimeInput';
import { Label } from '../../../../ui/components/elements/Label';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { formatDateLocal } from '../../../../logic/utils/date';

/**
 * PIUTANG FORM PAGE
 * Digunakan untuk input manual piutang (piutang) baru atau edit data lama.
 */
export const PiutangFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referrer = searchParams.get('referrer');
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<IPiutangPayload>({
    datetime: formatDateLocal(),
    name: '',
    description: '',
    category: TPiutangCategory.LAINNYA,
    sales_id: null,
    entity_name: '',
    principal_amount: 0,
    due_date: null,
    status: TPiutangStatus.ACTIVE,
    created_by: null,
    created_timezone: 'Asia/Jakarta',
    updated_by: null,
    updated_timezone: null
  });

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setIsLoading(true);
        const result = await piutangService.getById(id);
        if (result) {
          setFormData({
            datetime: result.datetime,
            name: result.name,
            description: result.description || '',
            category: result.category,
            sales_id: result.sales_id,
            entity_name: result.entity_name,
            principal_amount: result.principal_amount,
            due_date: result.due_date,
            status: result.status,
            created_by: result.created_by,
            created_timezone: result.created_timezone,
            updated_by: result.updated_by,
            updated_timezone: result.updated_timezone
          });
        }
        setIsLoading(false);
      };
      fetchData();
    }
  }, [id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let result;
    if (id) {
      result = await piutangService.update(id, formData);
    } else {
      result = await piutangService.create(formData);
    }

    if (result) {
      swalToast.fire({ icon: 'success', title: 'Data piutang berhasil disimpan' });
      navigate(referrer || `/finansial/piutang/detail/${result.id}`);
    } else {
      swalToast.fire({ icon: 'error', title: 'Gagal menyimpan data piutang' });
    }
    setIsSubmitting(false);
  };

  const isFormValid = formData.name.trim() !== '' && 
                      formData.entity_name.trim() !== '' && 
                      formData.principal_amount > 0 && 
                      formData.datetime !== '';

  return (
    <FormShell
      title={id ? 'Edit Piutang' : 'Tambah Piutang Manual'}
      onBack={() => navigate(-1)}
      onSave={handleSubmit}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      isSaveDisabled={!isFormValid || isSubmitting}
      id="piutang-form-shell"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium p-SpacingBase">
        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-datetime" required>Tanggal Piutang Muncul</Label>
          <DateInput 
            id="liab-datetime" 
            value={formData.datetime} 
            onChange={(e) => setFormData(p => ({ ...p, datetime: e.target.value }))} 
            required 
          />
        </div>
        
        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-category">Kategori</Label>
          <CustomValueDropdown 
            id="liab-category" 
            value={formData.category} 
            onChange={(val: any) => setFormData(p => ({ ...p, category: val }))}
            options={[
              { label: 'Penjualan (Piutang Dagang)', value: TPiutangCategory.PENJUALAN },
              { label: 'Pinjaman Modal/Bank', value: TPiutangCategory.PINJAMAN },
              { label: 'Biaya Operasional Tertunda', value: TPiutangCategory.OPERASIONAL },
              { label: 'Lain-lain', value: TPiutangCategory.LAINNYA },
            ]}
          />
        </div>

        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-name" required>Nama Piutang / Keterangan Singkat</Label>
          <TextInput 
            id="liab-name" 
            value={formData.name} 
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
            placeholder="Contoh: Piutang Penjualan, Pinjaman Karyawan, dll"
            required
          />
        </div>

        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-entity" required>Pihak Terkait (Customer / Karyawan / Individu)</Label>
          <TextInput 
            id="liab-entity" 
            value={formData.entity_name} 
            onChange={(e) => setFormData(p => ({ ...p, entity_name: e.target.value }))} 
            placeholder="Nama pihak yang dihutangi"
            required
          />
        </div>

        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-amount" required>Nominal Total Piutang (Pokok)</Label>
          <PriceInput 
            id="liab-amount" 
            value={formData.principal_amount} 
            onChange={(e) => setFormData(p => ({ ...p, principal_amount: Number(e.target.value) }))} 
            required
            disabled={!!id && formData.category === TPiutangCategory.PENJUALAN}
          />
        </div>

        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-due-date">Batas Waktu Pelunasan (Optional)</Label>
          <DateInput 
            id="liab-due-date" 
            value={formData.due_date || ''} 
            onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))} 
          />
        </div>

        <div className="md:col-span-2 space-y-SpacingSmall">
          <Label id="lbl-liab-description">Catatan / Detail Tambahan</Label>
          <LongTextInput 
            id="liab-description" 
            value={formData.description || ''} 
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} 
          />
        </div>

        {id && (
          <div className="space-y-SpacingSmall">
            <Label id="lbl-liab-status">Status</Label>
            <FixedDropdown 
              id="liab-status" 
              value={formData.status} 
              onChange={(val: any) => setFormData(p => ({ ...p, status: val }))}
              options={[
                { label: 'Active', value: TPiutangStatus.ACTIVE },
                { label: 'Settled (Lunas)', value: TPiutangStatus.SETTLED },
                { label: 'Cancelled', value: TPiutangStatus.CANCELLED },
              ]}
            />
          </div>
        )}
      </div>
    </FormShell>
  );
};

export default PiutangFormPage;
