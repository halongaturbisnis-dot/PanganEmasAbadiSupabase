import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../ui/components/common/Modal';
import { TextInput } from '../../../../ui/components/elements/Inputs';
import { Label } from '../../../../ui/components/elements/Label';
import { MultipleUploadInput } from '../../../../ui/components/elements/UploadInput';
import { MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocation } from '../../../../logic/hooks/useLocation';
import { calculateDistance } from '../../../../logic/utils/location';
import { IPenyerahanPayload, IPenyerahanFile, TPenyerahanStatus } from '../../../../logic/types/ITs_Penyerahan';
import { penyerahanService } from '../../../../logic/services/penyerahanService';
import { storageService } from '../../../../logic/services/storage';
import { toast } from 'react-hot-toast';
import { cn } from '../../../../logic/utils/cn';

import { MapPicker } from '../../../../ui/components/elements/MapPicker';

interface PenyerahanHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IPenyerahanPayload;
  onSuccess: () => void;
}

export const PenyerahanHandoverModal: React.FC<PenyerahanHandoverModalProps> = ({ 
  isOpen, 
  onClose, 
  data,
  onSuccess 
}) => {
  const [recipientName, setRecipientName] = useState(data.recipient_name || '');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { location, getLocation, isLoading: isLocating, error: locError } = useLocation();
  const [distance, setDistance] = useState<number | null>(null);
  const [handoverAddress, setHandoverAddress] = useState<string>('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getLocation();
    }
  }, [isOpen, getLocation]);

  useEffect(() => {
    if (location && data.penjualan_data?.customer_latlong) {
      const customerCoords = data.penjualan_data.customer_latlong.split(',');
      if (customerCoords.length === 2) {
        const cLat = parseFloat(customerCoords[0]);
        const cLng = parseFloat(customerCoords[1]);
        const dist = calculateDistance(location.latitude, location.longitude, cLat, cLng);
        setDistance(dist);
      }
    }
  }, [location, data.penjualan_data]);

  const handleSubmit = async () => {
    if (!recipientName) {
        toast.error('Nama penerima wajib diisi');
        return;
    }
    if (proofFiles.length === 0) {
        toast.error('Wajib melampirkan minimal 1 foto bukti');
        return;
    }
    if (!location) {
        toast.error('Lokasi belum terdeteksi. Pastikan GPS aktif.');
        return;
    }

    setIsSubmitting(true);
    try {
        // 1. Upload Files
        const uploadedFiles: IPenyerahanFile[] = [];
        for (const file of proofFiles) {
            const res = await storageService.upload(file, 'penyerahan-proof');
            uploadedFiles.push({
                url: res.url,
                name: file.name,
                key: res.key
            });
        }

        // 2. Prepare Payload
        const handoverData: Partial<IPenyerahanPayload> = {
            status: TPenyerahanStatus.COMPLETED,
            handover_datetime: new Date().toISOString(),
            recipient_name: recipientName,
            handover_lat: location.latitude,
            handover_lng: location.longitude,
            handover_distance: distance,
            handover_address: handoverAddress,
            proof_fileurls: [...(data.proof_fileurls || []), ...uploadedFiles]
        };

        // 3. Update Service
        const result = await penyerahanService.update(data.id, handoverData);
        if (result) {
            toast.success('Bukti penyerahan berhasil disimpan');
            onSuccess();
            onClose();
        } else {
            throw new Error('Gagal menyimpan data ke database');
        }
    } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Gagal menyimpan bukti penyerahan');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Bukti Penyerahan"
      onSubmit={handleSubmit}
      submitLabel="Simpan & Selesai"
      cancelLabel="Batal"
      isSubmitDisabled={isSubmitting || !recipientName.trim() || proofFiles.length === 0 || !location}
      className="!max-w-[40rem]"
    >
      <div className="flex flex-col gap-[1rem]">
        <div className="bg-slate-50 p-4 rounded-RadiusMedium border border-slate-100">
           <div className="flex items-center gap-2 mb-3">
             <MapPin className="text-ColorPrimary" size={18} />
             <span className="text-[0.625rem] font-bold text-slate-800 uppercase tracking-widest">Geotagging Lokasi</span>
           </div>
           
           {isLocating ? (
              <div className="flex items-center gap-2 text-[0.625rem] text-TextColorMuted py-4 justify-center italic bg-white rounded border border-slate-100">
                <div className="w-4 h-4 border-2 border-ColorPrimary border-t-transparent rounded-full animate-spin"></div>
                Mendeteksi koordinat GPS...
              </div>
           ) : location ? (
              <div className="space-y-3">
                <div className="h-48 w-full rounded overflow-hidden border border-slate-200">
                    <MapPicker 
                        readonly 
                        value={{ lat: location.latitude, lng: location.longitude }} 
                        className="h-full w-full"
                        onAddressResolve={(addr) => {
                            setHandoverAddress(addr);
                            setIsResolvingAddress(false);
                        }}
                    />
                </div>
                <div className="text-[10px] bg-white p-2 rounded border border-slate-100 italic">
                    <span className="text-slate-700">{isResolvingAddress ? 'Menentukan alamat...' : handoverAddress || 'Alamat tidak ditemukan'}</span>
                </div>
                {distance !== null && (
                    <div className={cn(
                        "flex items-center gap-2 p-2 rounded text-[11px] font-bold",
                        distance > 200 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                    )}>
                        {distance > 200 ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                        Jarak dari titik customer: {distance > 1000 ? (distance / 1000).toFixed(2) + ' Km' : distance.toFixed(0) + ' Meter'}
                        {distance > 200 && <span className="ml-1 opacity-80">(Diluar jangkauan radar)</span>}
                    </div>
                )}
              </div>
           ) : (
              <div className="text-[0.625rem] text-red-500 bg-red-50 p-2 rounded flex items-center gap-2">
                <AlertCircle size={14} />
                {locError || 'Gagal mendapatkan lokasi. Harap izinkan akses GPS.'}
                <button onClick={() => getLocation()} className="underline font-bold ml-auto text-[10px]">Coba Lagi</button>
              </div>
           )}
        </div>

        <div className="flex flex-col gap-[1rem]">
            <div className="space-y-[0.375rem]">
                <Label required>Nama Penerima</Label>
                <TextInput 
                    placeholder="Masukkan nama orang yang menerima barang"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                />
            </div>

            <div className="space-y-[0.375rem]">
                <Label required>Bukti Foto</Label>
                <MultipleUploadInput 
                    onFilesChange={setProofFiles}
                    maxFiles={5}
                />
                <p className="text-[10px] text-TextColorMuted italic mt-1">* Bisa upload lebih dari 1 foto (foto barang & wajah penerima)</p>
            </div>
        </div>
      </div>
    </Modal>
  );
};
