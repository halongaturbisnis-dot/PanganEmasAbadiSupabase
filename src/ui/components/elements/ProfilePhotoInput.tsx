import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { Camera, Check, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { appAssets } from '../../styles/assets';
import { Modal } from '../common/Modal';
import { Button } from './Button';
import getCroppedImg from '../../../logic/utils/imageCrop';
import { picaInstance } from '../../../logic/libs/fileProcessor';

interface ProfilePhotoInputProps {
  value?: string | Blob;
  onChange?: (file: File | null) => void;
  className?: string;
  id?: string;
}

export const ProfilePhotoInput: React.FC<ProfilePhotoInputProps> = ({
  value,
  onChange,
  className,
  id = "profile-photo"
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : value instanceof Blob ? URL.createObjectURL(value) : null
  );

  // Sync preview with externally provided value (e.g. from async loading in parent)
  useEffect(() => {
    if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof Blob) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [value]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert("File yang dipilih harus berupa gambar.");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
        setIsModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCrop = async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (croppedBlob) {
          const img = new Image();
          const url = URL.createObjectURL(croppedBlob);
          img.src = url;
          
          await new Promise((resolve) => { img.onload = resolve; });

          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;

          await picaInstance.resize(img, canvas, {
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2
          });

          const compressedBlob = await picaInstance.toBlob(canvas, 'image/jpeg', 0.85);
          URL.revokeObjectURL(url);

          if (compressedBlob) {
            const file = new File([compressedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
            const previewUrl = URL.createObjectURL(compressedBlob);
            setPreview(previewUrl);
            if (onChange) onChange(file);
            setIsModalOpen(false);
            setImageSrc(null);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (onChange) onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div id="profile-photo-container" className="flex flex-col items-center gap-4">
      <input
        id="profile-photo-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div id="profile-photo-preview-wrapper" className={cn("relative group", className || "w-spacing-ContainerSmall h-spacing-ContainerSmall")}>
        <div id={`${id}-avatar-box`}
          className="w-full h-full rounded-full overflow-hidden bg-ColorPrimary/0 flex items-center justify-center transition-all shadow-ElevationLow relative"
        >
          <img 
            id="profile-photo-img" 
            src={preview || appAssets.AccountPlaceholder} 
            alt="Profile" 
            className="w-full h-full object-cover" 
          />
          <div 
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={28} className="text-white" />
          </div>
        </div>

        <div id="profile-photo-actions" className="absolute bottom-0 right-0 flex gap-SpacingNano z-20">
          {preview && (
            <>
              <button
                id="profile-photo-change-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-SpacingTiny rounded-full bg-ColorPrimary text-White shadow-ElevationMid hover:opacity-OpacityHover transition-all"
                title="Ganti Foto"
              >
                <Edit2 id="profile-photo-edit-icon" size={14} />
              </button>
              <button
                id="profile-photo-remove-btn"
                type="button"
                onClick={handleRemove}
                className="p-SpacingTiny rounded-full bg-FeedbackColorError text-White shadow-ElevationMid hover:opacity-OpacityHover transition-all"
                title="Hapus Foto"
              >
                <Trash2 id="profile-photo-remove-icon" size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* BERHASIL DIKOMBINASIKAN: 
          Menggunakan ukuran lebar dinamis bawaan Anda yang sudah fit-to-screen (max-w-[27.5rem]), 
          sementara keamanan z-index dihandle mutlak oleh perbaikan internal Modal di atas.
      */}
      {/* Ganti bagian <Modal> di dalam ProfilePhotoInput.tsx dengan blok ini */}
<Modal
  id="profile-crop-modal"
  isOpen={isModalOpen}
  onClose={() => {
    setIsModalOpen(false);
    setImageSrc(null);
  }}
  title="Sesuaikan Foto Profil"
  className={cn("mx-auto", isMobile ? "w-[92vw]" : "w-full max-w-[27.5rem]")}
>
  <div id="profile-crop-modal-content" className="flex flex-col gap-SpacingMedium">
    <div 
      id="profile-crop-container" 
      className={cn(
        "relative w-full aspect-square bg-[#111] rounded-RadiusSmall overflow-hidden ring-1 ring-ColorSidebarBorder/opacity-OpacityMuted mx-auto",
        isMobile ? "max-h-[40dvh]" : "max-h-[14rem]"
      )}
    >
      {imageSrc && (
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          classes={{
            containerClassName: "w-full h-full relative"
          }}
        />
      )}
    </div>
    
    <div id="profile-zoom-controls" className="flex flex-col gap-SpacingTiny mt-SpacingNano">
      <p id="profile-zoom-label" className="text-FontSizeXs text-TextColorMuted font-black">Perbesar</p>
      
      {/* PERBAIKAN SLIDER: Mengembalikan track horizontal menggunakan kombinasi bg-gray dan h-1 */}
      <input
        id="profile-zoom-slider"
        type="range"
        value={zoom}
        min={1}
        max={3}
        step={0.1}
        aria-labelledby="Zoom"
        onChange={(e) => setZoom(Number(e.target.value))}
        className="w-full accent-ColorPrimary cursor-pointer h-1 bg-gray-200 rounded-RadiusFull appearance-none"
      />
    </div>

    {/* PERBAIKAN FOOTER: Menghilangkan class 'border-t border-ColorSidebarBorder/...' */}
    <div className={cn("flex items-center justify-end gap-SpacingSmall pt-SpacingSmall", isMobile ? "pb-0" : "pb-SpacingNano")}>
      <Button 
        id="profile-modal-cancel"
        variant="ghost" 
        onClick={() => {
          setIsModalOpen(false);
          setImageSrc(null);
        }}
      >
        Batal
      </Button>
      <Button 
        id="profile-modal-confirm"
        onClick={handleSaveCrop}
        className="bg-ColorPrimary text-White font-black"
      >
        <Check id="profile-modal-check-icon" size={16} className="mr-SpacingTiny" /> Konfirmasi
      </Button>
    </div>
  </div>
</Modal>
    </div>
  );
};

export default ProfilePhotoInput;