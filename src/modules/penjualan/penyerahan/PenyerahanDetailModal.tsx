import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/components/common/Modal';
import { TextInput, LongTextInput, PhoneInput } from '../../../ui/components/elements/Inputs';
import { FixedDropdown, CustomValueDropdown } from '../../../ui/components/elements/Dropdown';
import { DateTimeInput } from '../../../ui/components/elements/DateTimeInput';
import { Label } from '../../../ui/components/elements/Label';
import { AttachmentDisplay } from '../../../ui/components/elements/AttachmentDisplay';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';
import { penyerahanService } from '../../../logic/services/penyerahanService';
import { IPenyerahanPayload, TPenyerahanStatus, TPenyerahanType } from '../../../logic/types/ITs_Penyerahan';
import { PrimaryButton, SecondaryButton } from '../../../ui/components/elements/Button';
import { Printer, MapPin } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { MapViewer } from '../../../ui/components/elements/MapViewer';
import { SuratJalanPreviewModal } from './components/PDFSuratJalan';
import { PenyerahanHandoverModal } from './components/PenyerahanHandoverModal';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface PenyerahanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  penyerahanId: string;
}

export const PenyerahanDetailModal: React.FC<PenyerahanDetailModalProps> = ({ isOpen, onClose, penyerahanId }) => {
  const [data, setData] = useState<IPenyerahanPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const fetchDetail = async () => {
    setLoading(true);
    const res = await penyerahanService.getById(penyerahanId);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    if (penyerahanId && isOpen) fetchDetail();
  }, [penyerahanId, isOpen]);

  const handleCompleteFranco = () => {
    setIsHandoverOpen(true);
  };

  if (loading || !data) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Detail Penyerahan Barang">
        <div className="flex justify-center p-SpacingLarge text-TextColorMuted">Memuat data...</div>
      </Modal>
    );
  }

  const customFooter = (
    <div className={cn("w-full flex gap-3", isMobile ? "flex-col" : "items-center justify-end")}>
      {data.penyerahan_type === TPenyerahanType.FRANCO && (
        <PrimaryButton 
          onClick={() => setIsPreviewOpen(true)}
          className={cn("bg-ColorSecondary text-White hover:opacity-90 border-none", isMobile && "w-full focus:outline-none")}
        >
          Surat Jalan
        </PrimaryButton>
      )}

      {data.status === TPenyerahanStatus.ON_DELIVERY && (
        <PrimaryButton 
          onClick={handleCompleteFranco}
          className={cn(isMobile && "w-full focus:outline-none")}
        >
          Sudah Diterima
        </PrimaryButton>
      )}

      <SecondaryButton
        onClick={onClose}
        className={cn(isMobile && "w-full focus:outline-none")}
      >
        Tutup
      </SecondaryButton>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Detail Penyerahan Barang"
      footer={customFooter}
    >
      <div className="space-y-6">
        {/* We use exactly the same layout as Form, but readonly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Tipe Penyerahan</Label>
            <FixedDropdown
              value={data.penyerahan_type}
              disabled
              options={[
                { label: 'Loco', value: TPenyerahanType.LOCO },
                { label: 'Franco', value: TPenyerahanType.FRANCO },
              ]}
            />
          </div>
        
          <div className="space-y-1">
            <Label required>{data.penyerahan_type === TPenyerahanType.LOCO ? "Tanggal Diambil" : "Tanggal Kirim"}</Label>
            <DateTimeInput
              value={data.datetime}
              disabled
              required
            />
          </div>
        </div>

        {data.penyerahan_type === TPenyerahanType.LOCO && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <Label required>Nama Penerima (Siapa yang mengambil?)</Label>
              <TextInput
                value={data.recipient_name || ''}
                disabled
                required
              />
            </div>
          </div>
        )}

        {data.penyerahan_type === TPenyerahanType.FRANCO && (
          <div className="animate-in fade-in slide-in-from-top-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label required>No. Surat Jalan</Label>
              <TextInput
                value={data.surat_jalan_number || ''}
                disabled
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Metode Pengiriman / Ekspedisi</Label>
              <CustomValueDropdown
                id="shipping-method-readonly"
                value={data.shipping_method || ''}
                disabled
                options={[]}
              />
            </div>
            <div className="space-y-1">
              <Label>Nama Supir / Kurir</Label>
              <CustomValueDropdown
                id="driver-name-readonly"
                value={data.driver_name || ''}
                disabled
                options={[]}
              />
            </div>
            <div className="space-y-1">
              <Label>No Telepon Supir</Label>
              <PhoneInput
                id="driver-phone-readonly"
                value={data.driver_phone || ''}
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label>Plat Nomor Kendaraan</Label>
              <TextInput
                value={data.vehicle_number || ''}
                disabled
              />
            </div>
            
            {(data.recipient_name || data.status === TPenyerahanStatus.COMPLETED) && (
              <div className="space-y-1">
                <Label>Penerima di Lokasi</Label>
                <TextInput
                  value={data.recipient_name || ''}
                  disabled
                />
              </div>
            )}

            {data.handover_lat && (
              <div className="md:col-span-2 bg-Slate50 p-3 rounded-RadiusMedium border border-Slate200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-ColorPrimary" />
                    <span className="text-FontSizeNano font-bold uppercase text-TextColorBase opacity-80">Audit Lokasi Diterima</span>
                  </div>
                  {data.handover_distance !== null && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-RadiusFull",
                      data.handover_distance > 200 ? "bg-FeedbackColorError/10 text-FeedbackColorError" : "bg-FeedbackColorSuccess/10 text-FeedbackColorSuccess"
                    )}>
                      Jarak: {data.handover_distance > 1000 ? (data.handover_distance / 1000).toFixed(2) + ' Km' : data.handover_distance.toFixed(0) + ' M'}
                    </span>
                  )}
                </div>

                <div className="h-40 w-full mb-2 rounded-RadiusSmall overflow-hidden border border-Slate200">
                    <MapViewer 
                        latlong={`${data.handover_lat}, ${data.handover_lng ?? 0}`} 
                        height="100%" 
                        label="Titik Handover"
                    />
                </div>

                <p className="text-FontSizeNano font-mono text-TextColorMuted">
                  Koordinat: {data.handover_lat.toFixed(6)}, {data.handover_lng?.toFixed(6)} 
                  {data.handover_distance && data.handover_distance > 200 && (
                    <span className="text-FeedbackColorError ml-2 font-sans font-bold">⚠️ Diluar jangkauan radar</span>
                  )}
                </p>
                {data.handover_address && (
                    <p className="text-FontSizeNano text-TextColorMuted mt-1 bg-White/50 p-1 rounded-RadiusTiny italic leading-relaxed">
                      {data.handover_address}
                    </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Lampiran Bukti (Foto/Dokumen)</Label>
            <AttachmentDisplay 
              files={data.proof_fileurls} 
              id="proof-attachments"
              emptyText="Tidak ada lampiran bukti"
            />
          </div>

          <div className="space-y-1">
            <Label>Catatan Tambahan</Label>
            <LongTextInput
              placeholder="Catatan Tambahan (Opsional)..."
              value={data.description || ''}
              disabled
              rows={3}
            />
          </div>
        </div>
        
        <AuditTrail 
          createdAt={data.created_at}
          updatedAt={data.updated_at}
          createdBy={data.created_by}
          updatedBy={data.updated_by}
          createdTimezone={data.created_timezone}
          updatedTimezone={data.updated_timezone}
        />
      </div>

      {isPreviewOpen && data && (
        <SuratJalanPreviewModal 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          data={data} 
        />
      )}

      {isHandoverOpen && data && (
        <PenyerahanHandoverModal 
          isOpen={isHandoverOpen} 
          onClose={() => setIsHandoverOpen(false)} 
          data={data} 
          onSuccess={() => {
            fetchDetail();
          }}
        />
      )}
    </Modal>
  );
};
