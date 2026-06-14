import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FormShell } from '../../../../ui/components/common/shells/FormShell';
import { liabilitasService } from '../../../../logic/services/liabilitasService';
import { ILiabilitasPayload, TLiabilitasCategory, TLiabilitasStatus } from '../../../../logic/types/ITs_Liabilitas';
import { TextInput, PriceInput, LongTextInput } from '../../../../ui/components/elements/Inputs';
import { FixedDropdown, CustomValueDropdown } from '../../../../ui/components/elements/Dropdown';
import { DateInput } from '../../../../ui/components/elements/DateTimeInput';
import { Label } from '../../../../ui/components/elements/Label';
import { swalConfig, toast as swalToast } from '../../../../logic/utils/swalConfig';
import { useGlobalState } from '../../../../logic/context/GlobalContext';
import { formatDateLocal } from '../../../../logic/utils/date';

/**
 * LIABILITAS FORM PAGE
 * Digunakan untuk input manual liabilitas (hutang) baru atau edit data lama.
 */
export const LiabilitasFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referrer = searchParams.get('referrer');
  const { state } = useGlobalState();
  const { isMobile } = state.viewport;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ILiabilitasPayload>({
    datetime: formatDateLocal(),
    name: '',
    description: '',
    category: TLiabilitasCategory.LAINNYA,
    purchase_id: null,
    entity_name: '',
    principal_amount: 0,
    due_date: null,
    status: TLiabilitasStatus.ACTIVE,
    created_by: null,
    created_timezone: 'Asia/Jakarta',
    updated_by: null,
    updated_timezone: null
  });

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setIsLoading(true);
        const result = await liabilitasService.getById(id);
        if (result) {
          setFormData({
            datetime: result.datetime,
            name: result.name,
            description: result.description || '',
            category: result.category,
            purchase_id: result.purchase_id,
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
      result = await liabilitasService.update(id, formData);
    } else {
      result = await liabilitasService.create(formData);
    }

    if (result) {
      swalToast.fire({ icon: 'success', title: 'Data liabilitas berhasil disimpan' });
      navigate(referrer || `/finansial/liabilitas/detail/${result.id}`);
    } else {
      swalToast.fire({ icon: 'error', title: 'Gagal menyimpan data liabilitas' });
    }
    setIsSubmitting(false);
  };

  const isFormValid = formData.name.trim() !== '' && 
                      formData.entity_name.trim() !== '' && 
                      formData.principal_amount > 0 && 
                      formData.datetime !== '';

  return (
    <FormShell
      title={id ? 'Edit Liabilitas' : 'Tambah Liabilitas Manual'}
      onBack={() => navigate(-1)}
      onSave={handleSubmit}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      isSaveDisabled={!isFormValid || isSubmitting}
      id="liabilitas-form-shell"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-SpacingMedium p-SpacingBase">
        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-datetime" required>Tanggal Liabilitas Muncul</Label>
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
              { label: 'Pembelian (Hutang Dagang)', value: TLiabilitasCategory.PEMBELIAN },
              { label: 'Pinjaman Modal/Bank', value: TLiabilitasCategory.PINJAMAN },
              { label: 'Biaya Operasional Tertunda', value: TLiabilitasCategory.OPERASIONAL },
              { label: 'Lain-lain', value: TLiabilitasCategory.LAINNYA },
            ]}
          />
        </div>

        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-name" required>Nama Liabilitas / Keterangan Singkat</Label>
          <TextInput 
            id="liab-name" 
            value={formData.name} 
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
            placeholder="Contoh: Hutang Bahan Baku, Pinjaman KUR, dll"
            required
          />
        </div>

        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-entity" required>Pihak Terkait (Supplier / Bank / Individu)</Label>
          <TextInput 
            id="liab-entity" 
            value={formData.entity_name} 
            onChange={(e) => setFormData(p => ({ ...p, entity_name: e.target.value }))} 
            placeholder="Nama pihak yang memberi piutang"
            required
          />
        </div>

        <div className="space-y-SpacingSmall">
          <Label id="lbl-liab-amount" required>Nominal Total Hutang (Pokok)</Label>
          <PriceInput 
            id="liab-amount" 
            value={formData.principal_amount} 
            onChange={(e) => setFormData(p => ({ ...p, principal_amount: Number(e.target.value) }))} 
            required
            disabled={!!id && formData.category === TLiabilitasCategory.PEMBELIAN}
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
                { label: 'Active', value: TLiabilitasStatus.ACTIVE },
                { label: 'Settled (Lunas)', value: TLiabilitasStatus.SETTLED },
                { label: 'Cancelled', value: TLiabilitasStatus.CANCELLED },
              ]}
            />
          </div>
        )}
      </div>
    </FormShell>
  );
};

export default LiabilitasFormPage;
