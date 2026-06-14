import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { TextInput, LongTextInput, PhoneInput } from '../../../ui/components/elements/Inputs';
import { FixedDropdown, CustomValueDropdown } from '../../../ui/components/elements/Dropdown';
import { DateTimeInput } from '../../../ui/components/elements/DateTimeInput';
import { Label } from '../../../ui/components/elements/Label';
import { MultipleUploadInput } from '../../../ui/components/elements/UploadInput';
import { penyerahanService } from '../../../logic/services/penyerahanService';
import { akunService } from '../../../logic/services/akunService';
import { IAkun } from '../../../logic/types/ITs_Akun';
import { TPenyerahanType, TPenyerahanStatus, IPenyerahanPayload, IPenyerahanFile } from '../../../logic/types/ITs_Penyerahan';
import { storageService } from '../../../logic/services/storage';
import { errorService } from '../../../logic/services/errorService';
import { formatDateTimeLocal } from '../../../logic/utils/date';

interface PenyerahanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  penjualanId: string;
}

export const PenyerahanFormModal: React.FC<PenyerahanFormModalProps> = ({ isOpen, onClose, penjualanId }) => {
  const [type, setType] = useState<TPenyerahanType>(TPenyerahanType.LOCO);
  const [loading, setLoading] = useState(false);
  
  // States Modal Loco vs Franco
  const [datetime, setDatetime] = useState<string>(formatDateTimeLocal());
  const [recipientName, setRecipientName] = useState('');
  const [suratJalan, setSuratJalan] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverUserId, setDriverUserId] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [driverList, setDriverList] = useState<IAkun[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (type === TPenyerahanType.FRANCO) {
        penyerahanService.generateNextSuratJalanNumber().then(setSuratJalan);
      }
      akunService.getDrivers().then(setDriverList);
    }
  }, [isOpen, type]);

  const shippingTypeOptions = [
    { label: 'Internal / Mandiri', value: 'Internal' },
    { label: 'Ekspedisi Pihak Ketiga', value: 'Ekspedisi' },
    { label: 'Pickup Pelanggan', value: 'Pickup' },
  ];

  const driverOptions = driverList.map(d => ({
    label: d.username,
    value: d.username
  }));

  const handleDriverChange = (val: string) => {
    setDriverName(val);
    const selected = driverList.find(d => d.username === val);
    if (selected) {
      if (selected.telepon) {
        setDriverPhone(selected.telepon);
      }
      setDriverUserId(selected.id);
    } else {
      setDriverUserId(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload files first
      const uploadedFiles: IPenyerahanFile[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const res = await storageService.upload(file, 'penyerahan');
            uploadedFiles.push({ url: res.url, name: file.name, key: res.key });
          } catch (uploadErr) {
            console.error('Failed to upload file:', file.name, uploadErr);
          }
        }
      }

      const payload: IPenyerahanPayload = {
        id: '', // Generated on Service
        penjualan_id: penjualanId,
        penyerahan_type: type,
        status: type === TPenyerahanType.LOCO ? TPenyerahanStatus.COMPLETED : TPenyerahanStatus.ON_DELIVERY,
        datetime: datetime,
        handover_datetime: type === TPenyerahanType.LOCO ? datetime : null,
        recipient_name: recipientName || null,
        description: description || null,
        surat_jalan_number: type === TPenyerahanType.FRANCO ? suratJalan : null,
        driver_name: type === TPenyerahanType.FRANCO ? driverName : null,
        driver_phone: type === TPenyerahanType.FRANCO ? driverPhone : null,
        driver_user_id: type === TPenyerahanType.FRANCO ? driverUserId : null,
        vehicle_number: type === TPenyerahanType.FRANCO ? vehicleNumber : null,
        shipping_method: type === TPenyerahanType.FRANCO ? shippingMethod : null,
        proof_fileurls: uploadedFiles,
      };

      await penyerahanService.create(payload);
      onClose();
    } catch (e) {
      errorService.handle(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Proses Penyerahan / Pengiriman"
      onSubmit={handleSubmit}
      isSubmitDisabled={loading || (type === TPenyerahanType.FRANCO && !suratJalan) || (type === TPenyerahanType.LOCO && !recipientName)}
      submitLabel="Proses & Simpan"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Tipe Penyerahan</Label>
            <FixedDropdown
              value={type}
              onChange={(val) => setType(val as TPenyerahanType)}
              options={[
                { label: 'Loco', value: TPenyerahanType.LOCO },
                { label: 'Franco', value: TPenyerahanType.FRANCO },
              ]}
            />
          </div>
        
          <div className="space-y-1">
            <Label required>{type === TPenyerahanType.LOCO ? "Tanggal Diambil" : "Tanggal Kirim"}</Label>
            <DateTimeInput
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
            />
          </div>
        </div>

        {type === TPenyerahanType.LOCO && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <Label required>Nama Penerima (Siapa yang mengambil?)</Label>
              <TextInput
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Cth: Bapak Budi / Utusannya"
                required
              />
            </div>
          </div>
        )}

        {type === TPenyerahanType.FRANCO && (
          <div className="animate-in fade-in slide-in-from-top-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label required>No. Surat Jalan</Label>
              <TextInput
                value={suratJalan}
                onChange={(e) => setSuratJalan(e.target.value)}
                placeholder="Cth: SJ/24/05/X001"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Metode Pengiriman / Ekspedisi</Label>
              <CustomValueDropdown
                id="shipping-method-dropdown"
                value={shippingMethod}
                onChange={setShippingMethod}
                options={shippingTypeOptions}
                placeholder="Cth: Kurir Internal, JNE, Lalamove"
              />
            </div>
            <div className="space-y-1">
              <Label>Nama Supir / Kurir</Label>
              <CustomValueDropdown
                id="driver-name-dropdown"
                value={driverName}
                onChange={handleDriverChange}
                options={driverOptions}
                placeholder="Cari atau ketik nama supir..."
              />
            </div>
            <div className="space-y-1">
              <Label>No Telepon Supir</Label>
              <PhoneInput
                id="driver-phone-input"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="Cth: 08123456789"
              />
            </div>
            <div className="space-y-1">
              <Label>Plat Nomor Kendaraan</Label>
              <TextInput
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Lampiran Bukti (Foto/Dokumen)</Label>
            <MultipleUploadInput 
              onFilesChange={setFiles} 
              maxFiles={5}
            />
          </div>

          <div className="space-y-1">
            <Label>Catatan Tambahan</Label>
            <LongTextInput
              placeholder="Catatan Tambahan (Opsional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
