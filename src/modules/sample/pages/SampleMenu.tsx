import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Type, Layout, Palette, Settings, Bell, Shield, Cloud, Smartphone, MessageSquare, AlertCircle, Maximize2, PanelRight, MousePointerClick, QrCode, ScanLine, Barcode, Send, Trash, Activity, Edit, MoreHorizontal, MapPin, ChevronLeft, LayoutList, TableProperties, Layers } from 'lucide-react';
import { swalConfig, toast } from '../../../logic/utils/swalConfig';
import { Modal } from '../../../ui/components/common/Modal';
import { Tooltip } from '../../../ui/components/common/Tooltip';
import { QRCodeDisplay } from '../../../ui/components/common/QRCodeDisplay';
import { BarcodeDisplay } from '../../../ui/components/common/BarcodeDisplay';
import { ScannerWidget } from '../../../ui/components/common/ScannerWidget';
import { Button, PrimaryButton, SecondaryButton, TertiaryButton, DangerButton, InCommonButton, InlineButton } from '../../../ui/components/elements/Button';
import { formatCurrency } from '../../../logic/utils/data';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/components/common/Table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../ui/components/common/Card';
import { Deck, DeckContent, DeckHeader, DeckTitle } from '../../../ui/components/common/Deck';
import { Gallery, GalleryItem, GalleryImage, GalleryCaption } from '../../../ui/components/common/Gallery';
import { Breadcrumbs, BreadcrumbItem, BreadcrumbLink } from '../../../ui/components/common/Breadcrumbs';
import { Stepper } from '../../../ui/components/common/Steppers';
import { GlobalLoading } from '../../../ui/components/LoadingState/GlobalLoading';
import { PageLoading } from '../../../ui/components/LoadingState/PageLoading';
import { InlineLoading } from '../../../ui/components/LoadingState/InlineLoading';
import { Divider } from '../../../ui/components/elements/Divider';
import { Badge } from '../../../ui/components/elements/Badge';
import { ListFeed, ListFeedItem, ListFeedAvatar, ListFeedContent } from '../../../ui/components/common/ListFeed';
import { Accordion, AccordionItem } from '../../../ui/components/common/Accordion';

import { TextInput, EmailInput, PhoneInput, LongTextInput, NumberInput, DecimalInput, PercentageInput, PriceInput, XYInput, Checkbox, YoutubeInput, SearchInput, SwitchInput, PasswordInput, TagInput } from '../../../ui/components/elements/Inputs';
import { FixedDropdown, CustomDropdown, FixedMultiDropdown, CustomMultiDropdown } from '../../../ui/components/elements/Dropdown';
import { DateInput, TimeInput, DateTimeInput } from '../../../ui/components/elements/DateTimeInput';
import { ColorPickerInput } from '../../../ui/components/elements/ColorPicker';
import { SignatureInput } from '../../../ui/components/elements/AdvancedInputs';
import { RichTextInput } from '../../../ui/components/elements/RichTextInput';
import { UploadFileImageInput } from '../../../ui/components/elements/UploadInput';
import { MapPicker, MapRadiusPicker } from '../../../ui/components/elements/MapPicker';
import { NFCReader } from '../../../ui/components/elements/NFCReader';
import { VoiceInput, TextToSpeech } from '../../../ui/components/elements/VoiceControls';
import { ImageAnnotator } from '../../../ui/components/elements/ImageAnnotator';
import { getCurrentHighIntegrityLocation, HighIntegrityLocation } from '../../../logic/utils/location';
import { syncActualTime, getActualTime, isTimeSynced, getTimeSource, formatActualTime, getTimezoneInfo, getExpectedTimezone, getSyncMetadata } from '../../../logic/utils/time';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { printPdf, downloadPdf } from '../../../logic/utils/pdf';
import { generateExcel } from '../../../logic/utils/excel';
import { callPhone, sendSMS, sendWhatsApp, sendEmail } from '../../../logic/utils/communication';
import { LucideIcon, Map as MapIcon, Globe, Clock, CheckCircle, Smartphone as SmartphoneIcon, AlertTriangle, Search } from 'lucide-react';

const menuItems = [
  { id: 'fonts', title: 'Opsi Font', icon: Type, active: true, color: 'text-FeedbackColorInfo', path: '/sample/fonts', action: null },
  { id: 'icons', title: 'Visualisasi Ikon', icon: Layout, active: true, color: 'text-ColorPrimary', path: '/sample/icons', action: null },
  { id: 'shells', title: 'Shell & Layout', icon: Layout, active: true, color: 'text-FeedbackColorSuccess', path: '/sample/shells', action: null },
  { id: 'push', title: 'Logika Link', icon: Bell, active: true, color: 'text-FeedbackColorWarning', path: '/sample/push', action: null },
  { id: 'high-location', title: 'Lokasi Akurat', icon: MapIcon, active: true, color: 'text-ColorSecondary', path: null, action: 'high-location' },
  { id: 'actual-time', title: 'Waktu Aktual', icon: Clock, active: true, color: 'text-FeedbackColorInfo', path: null, action: 'actual-time' },
  { id: 'security', title: 'Keamanan', icon: Shield, active: false, color: 'text-TextColorMuted', path: '', action: null },
  { id: 'connection-test', title: 'Test Koneksi', icon: Globe, active: true, color: 'text-sky-500', path: '/sample/connection-test', action: null },
  { id: 'cloud', title: 'Cadangan', icon: Cloud, active: false, color: 'text-TextColorMuted', path: '', action: null },
  { id: 'mobile', title: 'Tampilan', icon: Smartphone, active: false, color: 'text-TextColorMuted', path: '', action: null },
  { id: 'pref', title: 'Preferensi', icon: Settings, active: false, color: 'text-TextColorMuted', path: '', action: null },
  
  // Interactive UI Simulations
  { id: 'swal', title: 'Sweet Alert', icon: AlertCircle, active: true, color: 'text-FeedbackColorError', path: null, action: 'swal' },
  { id: 'toast', title: 'Notifikasi Toast', icon: MessageSquare, active: true, color: 'text-FeedbackColorWarning', path: null, action: 'toast' },
  { id: 'modal-popup', title: 'Modal Popup', icon: Maximize2, active: true, color: 'text-ColorPrimary', path: null, action: 'modal-popup' },
  { id: 'modal-slide', title: 'Modal Slideside', icon: PanelRight, active: true, color: 'text-FeedbackColorError', path: null, action: 'modal-slide' },
  { id: 'tooltip', title: 'Contoh Tooltip', icon: MousePointerClick, active: true, color: 'text-FeedbackColorInfo', path: null, action: 'tooltip' },
  { id: 'qrcode', title: 'Kode QR', icon: QrCode, active: true, color: 'text-ColorPrimary', path: null, action: 'qrcode' },
  { id: 'barcode', title: 'Barcode', icon: Barcode, active: true, color: 'text-ColorSecondary', path: '/sample/barcode-display', action: null },
  { id: 'scanner', title: 'Pemindai', icon: ScanLine, active: true, color: 'text-FeedbackColorSuccess', path: null, action: 'scanner' },
  
  // Data Display & Elements
  { id: 'table', title: 'Tabel', icon: Layout, active: true, color: 'text-FeedbackColorInfo', path: null, action: 'table' },
  { id: 'card', title: 'Kartu', icon: Layout, active: true, color: 'text-ColorPrimary', path: '/sample/card', action: null },
  { id: 'deck', title: 'Deck', icon: Layout, active: true, color: 'text-FeedbackColorSuccess', path: null, action: 'deck' },
  { id: 'gallery', title: 'Galeri', icon: Layout, active: true, color: 'text-FeedbackColorWarning', path: null, action: 'gallery' },
  { id: 'list-feed', title: 'List Feed', icon: Layout, active: true, color: 'text-FeedbackColorWarning', path: null, action: 'list-feed' },
  { id: 'accordion', title: 'Accordion', icon: Layout, active: true, color: 'text-FeedbackColorInfo', path: '/sample/accordion', action: null },
  
  // Navigation & Loading
  { id: 'command-palette', title: 'Command', icon: Search, active: true, color: 'text-ColorPrimary', path: '/sample/command-palette', action: null },
  { id: 'confirm-dialog', title: 'Confirm Dialog', icon: AlertTriangle, active: true, color: 'text-FeedbackColorError', path: '/sample/confirm-dialog', action: null },
  { id: 'data-table-plus-sim', title: 'Tabel Data Plus (Sim)', icon: TableProperties, active: true, color: 'text-FeedbackColorSuccess', path: '/sample/data-table-plus-sim', action: null },
  { id: 'bottom-sheet', title: 'Bottom Sheet', icon: PanelRight, active: true, color: 'text-FeedbackColorInfo', path: '/sample/bottom-sheet', action: null },
  { id: 'breadcrumbs', title: 'Breadcrumbs', icon: PanelRight, active: true, color: 'text-ColorPrimary', path: '/sample/breadcrumbs', action: null },
  { id: 'steppers', title: 'Steppers', icon: PanelRight, active: true, color: 'text-FeedbackColorError', path: null, action: 'steppers' },
  { id: 'loading', title: 'Status Loading', icon: AlertCircle, active: true, color: 'text-FeedbackColorInfo', path: null, action: 'loading' },
  
  // Elements
  { id: 'custom-buttons', title: 'Tombol Kustom', icon: MousePointerClick, active: true, color: 'text-FeedbackColorError', path: null, action: 'custom-buttons' },
  { id: 'basic-inputs', title: 'Input Dasar', icon: Type, active: true, color: 'text-FeedbackColorInfo', path: null, action: 'basic-inputs' },
  { id: 'dropdowns', title: 'Dropdown', icon: Layout, active: true, color: 'text-ColorPrimary', path: null, action: 'dropdowns' },
  { id: 'datetime-inputs', title: 'Tanggal & Waktu', icon: Bell, active: true, color: 'text-FeedbackColorInfo', path: null, action: 'datetime-inputs' },
  { id: 'color-picker', title: 'Pemilih Warna', icon: Palette, active: true, color: 'text-FeedbackColorError', path: null, action: 'color-picker' },
  { id: 'advanced-inputs', title: 'Input Lanjutan', icon: ScanLine, active: true, color: 'text-FeedbackColorWarning', path: null, action: 'advanced-inputs' },
  { id: 'nfc-reader', title: 'Pembaca NFC', icon: Smartphone, active: true, color: 'text-FeedbackColorInfo', path: null, action: 'nfc-reader' },
  { id: 'voice-controls', title: 'Interaksi Suara', icon: MessageSquare, active: true, color: 'text-FeedbackColorError', path: null, action: 'voice-controls' },
  { id: 'image-annotator', title: 'Anotasi Gambar', icon: Palette, active: true, color: 'text-ColorPrimary', path: null, action: 'image-annotator' },
  { id: 'youtube-input', title: 'Input YouTube', icon: Maximize2, active: true, color: 'text-FeedbackColorError', path: null, action: 'youtube-input' },
  { id: 'map-picker', title: 'Pemilih Peta', icon: Cloud, active: true, color: 'text-FeedbackColorSuccess', path: null, action: 'map-picker' },
  { id: 'monitoring', title: 'Monitoring Kunjungan', icon: MapPin, active: true, color: 'text-FeedbackColorError', path: '/monitoring/visits', action: null },
  { id: 'pagination-sample', title: 'Pagina', icon: Smartphone, active: true, color: 'text-ColorPrimary', path: '/sample/pagination', action: null },
  { id: 'profile-photo-sample', title: 'Foto Profil', icon: Palette, active: true, color: 'text-FeedbackColorSuccess', path: '/sample/profile-photo', action: null },
  { id: 'advanced-ui-sample', title: 'Skeleton & EmptyState', icon: LayoutList, active: true, color: 'text-ColorSecondary', path: '/sample/advanced-ui', action: null },
  { id: 'data-table-plus-sample', title: 'Tabel Data Plus', icon: TableProperties, active: true, color: 'text-FeedbackColorWarning', path: '/sample/data-table-plus', action: null },
  { id: 'form-wizard-sample', title: 'Form Wizard', icon: Layers, active: true, color: 'text-rose-500', path: '/sample/form-wizard', action: null },
  { id: 'versatile-sample', title: 'Versatile UI', icon: PanelRight, active: true, color: 'text-ColorPrimary', path: '/sample/versatile', action: null },
  { id: 'divider-badge', title: 'Divider & Badge', icon: MousePointerClick, active: true, color: 'text-TextColorMuted', path: null, action: 'divider-badge' },
  { id: 'range-calendar', title: 'Kalender Rentang', icon: Clock, active: true, color: 'text-FeedbackColorInfo', path: '/sample/calendar', action: null },
  
  // Utils
  { id: 'pdf-maker', title: 'Pembuat PDF', icon: Type, active: true, color: 'text-FeedbackColorError', path: null, action: 'pdf-maker' },
  { id: 'excel-maker', title: 'Ekspor Excel', icon: Layout, active: true, color: 'text-FeedbackColorSuccess', path: null, action: 'excel-maker' },
  { id: 'comm-tools', title: 'Alat Komunikasi', icon: MessageSquare, active: true, color: 'text-ColorPrimary', path: null, action: 'comm-tools' },
];

const ActualTimeSample = () => {
  const { t } = useGlobalState();
  const [syncedTime, setSyncedTime] = useState<number | null>(null);
  const [location, setLocation] = useState<HighIntegrityLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const tzInfo = getTimezoneInfo();

  const handleSync = async () => {
    setLoading(true);
    try {
      const [time, loc] = await Promise.all([
        syncActualTime(),
        getCurrentHighIntegrityLocation().catch(() => null)
      ]);
      setSyncedTime(time);
      setLocation(loc);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const expectedTz = location ? getExpectedTimezone(location.latitude, location.longitude) : null;
  const syncMeta = getSyncMetadata();
  const deviceOffset = -(new Date().getTimezoneOffset() / 60);
  
  // Use either GPS expected TZ or IP-based sync metadata TZ
  const effectiveTz = syncMeta.timezone ? { zone: syncMeta.timezone, offset: syncMeta.offset || 0 } : expectedTz;
  
  const tzMismatch = effectiveTz ? Math.abs(effectiveTz.offset - deviceOffset) > 0.5 : false;
  const isSuspiciousDrift = syncedTime ? Math.abs(Date.now() - syncedTime) > 60000 || tzMismatch : false;

  return (
    <div className="space-y-4 py-4">
      <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-tertiary)]/10 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-500" />
            <h4 className="font-semibold">{t('time.actual')}</h4>
          </div>
          <Button size="sm" onClick={handleSync} disabled={loading}>
            {loading ? <span className="animate-spin mr-2">◌</span> : null}
            {t('common.processing')}
          </Button>
        </div>
        
        {loading && <p className="text-sm text-[var(--color-text-muted)] animate-pulse">{t('time.fetching')}</p>}
        
        {syncedTime && !loading && (
          <div className="space-y-3 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                <CheckCircle size="1rem" /> {t('time.syncSuccess')}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--font-size-nano)] font-bold uppercase text-[var(--color-text-muted)]">
                <Globe size="0.75rem" /> {tzInfo.gmtString}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1">
                  <Globe size="0.75rem" className="text-sky-200" />
                </div>
                <p className="text-[var(--font-size-nano)] text-[var(--color-text-muted)] uppercase font-bold tracking-wider">
                  {effectiveTz ? 'Waktu Aktual Lokasi' : 'Waktu UTC Absolut'}
                </p>
                <p className="text-base font-mono font-semibold text-sky-600">
                  {effectiveTz
                    ? formatActualTime(syncedTime, effectiveTz.zone)
                    : formatActualTime(syncedTime)
                  }
                </p>
                {effectiveTz && (
                  <p className="text-[9px] text-[var(--color-text-muted)] mt-1 italic flex items-center gap-1">
                    <MapPin size="0.5rem" /> 
                    {syncMeta.timezone ? 'Server IP' : 'GPS'}: {effectiveTz.zone} (GMT{effectiveTz.offset >= 0 ? '+' : ''}{effectiveTz.offset})
                  </p>
                )}
              </div>
              <div className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-sm">
                <p className="text-[var(--font-size-nano)] text-[var(--color-text-muted)] uppercase font-bold tracking-wider">{t('time.deviceTz')}</p>
                <p className="text-base font-mono font-semibold text-[var(--color-text-base)]">
                   {new Date(syncedTime).toLocaleTimeString([], { hour12: true })}
                </p>
                <p className="text-[9px] text-[var(--color-text-muted)] mt-1 italic truncate">
                  {tzInfo.zoneName} ({tzInfo.gmtString})
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)] font-medium">{t('time.drift')}</span>
                <span className={`font-mono ${Math.abs(Date.now() - syncedTime) > 60000 ? 'text-rose-500 font-bold' : 'text-[var(--color-text-base)]'}`}>
                  {Date.now() - syncedTime}ms
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)] font-medium">{t('time.integrity')}</span>
                <span className={`flex items-center gap-1 font-bold ${isSuspiciousDrift ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {isSuspiciousDrift ? (
                    <><AlertTriangle size="0.75rem" /> {t('time.integrityWarn')}</>
                  ) : (
                    <><CheckCircle size="0.75rem" /> {t('time.integrityOk')}</>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-[var(--font-size-nano)]">
                <span className="text-[var(--color-text-muted)] font-bold uppercase">Timezone</span>
                <span className="text-[var(--color-text-muted)] italic truncate ml-4">{tzInfo.full}</span>
              </div>
            </div>

            {isSuspiciousDrift && (
              <div className="p-2 bg-rose-500/10 text-rose-600 rounded text-[var(--font-size-nano)] font-medium leading-tight flex items-start gap-2 border border-rose-500/20">
                <AlertTriangle size="0.875rem" className="shrink-0" />
                <span>{tzMismatch ? 'Ketidakcocokan GPS dan zona waktu perangkat terdeteksi.' : t('time.mismatchDesc')}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[var(--font-size-nano)] text-[var(--color-text-muted)] font-bold uppercase mt-1">
              <span>Path: {getTimeSource()}</span>
              {location && <span className="text-emerald-500">GPS Locked</span>}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] italic">
        *This utility prevents users from bypassing time-based rules by changing their device clock or timezone settings.
      </p>
    </div>
  );
};


const HighLocationSample = () => {
  const { t } = useGlobalState();
  const [location, setLocation] = useState<HighIntegrityLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentHighIntegrityLocation();
      setLocation(loc);
    } catch (err: any) {
      setError(err.message || 'Error detecting location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-tertiary)]/10 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold">{t('location.highIntegrity')}</h4>
          </div>
          <Button size="sm" onClick={handleDetect} disabled={loading}>
            {loading ? <span className="animate-spin mr-2">◌</span> : null}
            {t('sample.detectLocation')}
          </Button>
        </div>

        {loading && <p className="text-sm text-[var(--color-text-muted)] animate-pulse">{t('location.detecting')}</p>}
        {error && <p className="text-sm text-rose-500 font-medium capitalize">{error}</p>}

        {location && !loading && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[var(--font-size-nano)] font-bold uppercase ${location.isFallback ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {location.isFallback ? t('location.signalFallback') : t('location.gpsActive')}
              </span>
              {location.isPotentiallyFake && (
                <span className="px-2 py-0.5 rounded-full text-[var(--font-size-nano)] font-bold uppercase bg-rose-100 text-rose-600">
                  {t('location.fakeDetected')}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <p className="text-[var(--font-size-nano)] text-[var(--color-text-muted)] font-bold uppercase">Latitude</p>
                 <p className="text-sm font-mono truncate">{location.latitude.toFixed(6)}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[var(--font-size-nano)] text-[var(--color-text-muted)] font-bold uppercase">Longitude</p>
                 <p className="text-sm font-mono truncate">{location.longitude.toFixed(6)}</p>
               </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
               <span>Accuracy: {location.accuracy.toFixed(1)}m</span>
               <span>Time: {new Date(location.timestamp).toLocaleTimeString()}</span>
            </div>

            {location.isPotentiallyFake && (
               <div className="p-2 bg-rose-50 text-rose-600 rounded text-[var(--font-size-nano)] font-medium leading-tight">
                 Warning: System detected high-risk location provider behavior.
               </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] italic">
        *Uses high-accuracy GNSS request and evaluates precision to verify authenticity.
      </p>
    </div>
  );
}

export const SampleMenu: React.FC = () => {
  const { t } = useGlobalState();
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<{ isOpen: boolean; variant: 'popup' | 'slideside'; type: string }>({
    isOpen: false,
    variant: 'popup',
    type: ''
  });
  
  const [globalLoadingSpinner, setGlobalLoadingSpinner] = useState(false);
  const [globalLoadingSkeleton, setGlobalLoadingSkeleton] = useState(false);

  const handleAction = (action: string | null) => {
    switch (action) {
      case 'swal':
        swalConfig.fire({
          title: t('sample.swal.success'),
          text: t('sample.swal.text'),
          icon: 'success',
          confirmButtonText: t('sample.swal.confirm')
        });
        break;
      case 'toast':
        toast.fire({
          icon: 'info',
          title: t('feedback.info')
        });
        break;
      case 'modal-popup':
        setModalState({ isOpen: true, variant: 'popup', type: 'general' });
        break;
      case 'modal-slide':
        setModalState({ isOpen: true, variant: 'slideside', type: 'general' });
        break;
      case 'qrcode':
        setModalState({ isOpen: true, variant: 'popup', type: 'qrcode' });
        break;
      case 'barcode':
        setModalState({ isOpen: true, variant: 'popup', type: 'barcode' });
        break;
      case 'scanner':
        setModalState({ isOpen: true, variant: 'popup', type: 'scanner' });
        break;
      case 'table':
      case 'deck':
      case 'gallery':
      case 'list-feed':
      case 'accordion':
      case 'steppers':
      case 'divider-badge':
      case 'loading':
      case 'custom-buttons':
      case 'basic-inputs':
      case 'dropdowns':
      case 'datetime-inputs':
      case 'color-picker':
      case 'advanced-inputs':
      case 'youtube-input':
      case 'map-picker':
      case 'nfc-reader':
      case 'voice-controls':
      case 'image-annotator':
      case 'high-location':
      case 'actual-time':
      case 'pdf-maker':
      case 'excel-maker':
      case 'comm-tools':
        setModalState({ isOpen: true, variant: 'popup', type: action });
        break;
      default:
        break;
    }
  };

  return (
    <div className="py-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <header className="mb-[var(--SpacingMedium)] sticky top-8">
            <h1 className="text-[var(--font-size-h1)] font-bold text-[var(--color-text-base)]">Sample Module</h1>
            <p className="text-[var(--color-text-muted)] mb-8">Simulation laboratory for various components. Click any tool below to simulate its behavior or view its page.</p>
            <div className="hidden md:block">
              <Tooltip content="Provides visual feedback with SweetAlert2!" direction="right">
                <div className="p-4 bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] rounded-xl inline-block mt-4 text-sm font-medium">
                  Hover to see Tooltip simulation
                </div>
              </Tooltip>
            </div>
            <div className="mt-8">
               <button 
                onClick={() => navigate('/')}
                className="text-[var(--font-size-sm)] text-[var(--ui-primary)] font-medium underline underline-offset-2"
              >
                ← Back to Home
              </button>
            </div>
          </header>
        </div>

        <div className="md:w-2/3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[var(--spacing-base)]">
            {menuItems.map((item) => (
              item.action === 'tooltip' ? (
                <Tooltip key={item.id} content="This is an animated tooltip!" direction="top">
                  <motion.button
                    whileHover={item.active ? { scale: 1.05 } : {}}
                    whileTap={item.active ? { scale: 0.95 } : {}}
                    onClick={() => item.active && item.path ? navigate(item.path) : handleAction(item.action)}
                    className={`w-full flex flex-col items-center text-center justify-center p-[var(--spacing-medium)] bg-[var(--ui-primary)]/5 border border-[var(--ui-primary)]/10 rounded-[var(--radius-base)] transition-all ${
                      item.active ? 'cursor-pointer hover:bg-[var(--ui-primary)]/10 hover:shadow-sm' : 'cursor-not-allowed opacity-50'
                    }`}
                    id={`menu-item-${item.id}`}
                  >
                    <item.icon className={`w-8 h-8 mb-[var(--spacing-small)] ${item.color}`} />
                    <span className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)]">{item.title}</span>
                  </motion.button>
                </Tooltip>
              ) : (
                <motion.button
                  key={item.id}
                  whileHover={item.active ? { scale: 1.05 } : {}}
                  whileTap={item.active ? { scale: 0.95 } : {}}
                  onClick={() => item.active && item.path ? navigate(item.path) : handleAction(item.action)}
                  className={`flex flex-col items-center text-center justify-center p-[var(--spacing-medium)] bg-[var(--ui-primary)]/5 border border-[var(--ui-primary)]/10 rounded-[var(--radius-base)] transition-all ${
                    item.active ? 'cursor-pointer hover:bg-[var(--ui-primary)]/10 hover:shadow-sm' : 'cursor-not-allowed opacity-50'
                  }`}
                  id={`menu-item-${item.id}`}
                >
                  <item.icon className={`w-8 h-8 mb-[var(--spacing-small)] ${item.color}`} />
                  <span className="text-[var(--font-size-sm)] font-medium text-[var(--text-base)]">{item.title}</span>
                </motion.button>
              )
            ))}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        variant={modalState.variant}
        title={
          modalState.type === 'qrcode' ? 'QR Code Display' : 
          modalState.type === 'barcode' ? 'Barcode Display' : 
          modalState.type === 'scanner' ? 'QR & Barcode Scanner' :
          modalState.type === 'table' ? 'Table Sample' :
          modalState.type === 'card' ? 'Card Sample' :
          modalState.type === 'deck' ? 'Deck Sample' :
          modalState.type === 'gallery' ? 'Gallery Sample' :
          modalState.type === 'list-feed' ? 'List Feed Sample' :
          modalState.type === 'accordion' ? 'Accordion Sample' :
          modalState.type === 'breadcrumbs' ? 'Breadcrumbs Sample' :
          modalState.type === 'steppers' ? 'Steppers Sample' :
          modalState.type === 'divider-badge' ? 'Divider & Badge Sample' :
          modalState.type === 'loading' ? 'Loading States Sample' :
          modalState.type === 'custom-buttons' ? 'Custom Buttons Sample' :
          modalState.type === 'basic-inputs' ? 'Basic Inputs Sample' :
          modalState.type === 'dropdowns' ? 'Dropdowns Sample' :
          modalState.type === 'datetime-inputs' ? 'Date & Time Sample' :
          modalState.type === 'color-picker' ? 'Color Picker Sample' :
          modalState.type === 'advanced-inputs' ? 'Advanced Inputs Sample' :
          modalState.type === 'nfc-reader' ? 'NFC Reader Sample' :
          modalState.type === 'voice-controls' ? 'Voice Interaction Sample' :
          modalState.type === 'image-annotator' ? 'Image Annotation Sample' :
          modalState.type === 'high-location' ? 'High Integrity Location Sample' :
          modalState.type === 'actual-time' ? 'Actual Time Logic Sample' :
          modalState.type === 'youtube-input' ? 'YouTube Embed Sample' :
          modalState.type === 'map-picker' ? 'Map Picker Sample' :
          modalState.type === 'pdf-maker' ? 'PDF Maker Sample' :
          modalState.type === 'excel-maker' ? 'Excel Export Sample' :
          modalState.type === 'comm-tools' ? 'Communication Tools Sample' :
          modalState.variant === 'popup' ? 'Popup Form Simulation' : 'Slideside Detail Simulation'
        }
      >
        <div className="space-y-4">
          {modalState.type === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[3rem] text-center"><div className="flex justify-center translate-y-1"><Checkbox id="selectAll" /></div></TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-center"><div className="flex justify-center"><Checkbox id="inv1" /></div></TableCell>
                  <TableCell className="font-medium">INV001</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell>{formatCurrency(250000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-center"><div className="flex justify-center"><Checkbox id="inv2" /></div></TableCell>
                  <TableCell className="font-medium">INV002</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell>PayPal</TableCell>
                  <TableCell>{formatCurrency(150000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-center"><div className="flex justify-center"><Checkbox id="inv3" /></div></TableCell>
                  <TableCell className="font-medium">INV003</TableCell>
                  <TableCell>Unpaid</TableCell>
                  <TableCell>Bank Transfer</TableCell>
                  <TableCell>{formatCurrency(350000)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {modalState.type === 'card' && (
            <Card className="max-w-sm mx-auto">
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>Update your project settings easily.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>The system is performing optimally. No issues detected in the background processes.</p>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline">Dismiss</Button>
                <Button>Continue</Button>
              </CardFooter>
            </Card>
          )}

          {modalState.type === 'deck' && (
            <div className="space-y-6">
              <Deck orientation="horizontal">
                <DeckHeader>
                  <DeckTitle>Horizontal Deck</DeckTitle>
                </DeckHeader>
                <DeckContent orientation="horizontal">
                  <Card className="min-w-[200px] flex-1">
                    <CardHeader><CardTitle>React 19</CardTitle></CardHeader>
                    <CardContent><p>New hooks and features explored.</p></CardContent>
                  </Card>
                  <Card className="min-w-[200px] flex-1">
                    <CardHeader><CardTitle>Tailwind 4</CardTitle></CardHeader>
                    <CardContent><p>What's next for CSS architecture.</p></CardContent>
                  </Card>
                </DeckContent>
              </Deck>

              <Deck orientation="vertical">
                <DeckHeader>
                  <DeckTitle>Vertical Deck</DeckTitle>
                </DeckHeader>
                <DeckContent orientation="vertical">
                  <Card className="w-full">
                    <CardHeader><CardTitle>Step 1</CardTitle></CardHeader>
                    <CardContent><p>Initial processing and validation.</p></CardContent>
                  </Card>
                  <Card className="w-full">
                    <CardHeader><CardTitle>Step 2</CardTitle></CardHeader>
                    <CardContent><p>Database integration and syncing.</p></CardContent>
                  </Card>
                </DeckContent>
              </Deck>
            </div>
          )}

          {modalState.type === 'gallery' && (
            <Gallery columns={3}>
              <GalleryItem>
                <div className="aspect-square bg-[var(--color-bg-secondary)] flex items-center justify-center font-bold text-[var(--color-text-muted)]">1</div>
                <GalleryCaption>Image 1</GalleryCaption>
              </GalleryItem>
              <GalleryItem>
                <div className="aspect-square bg-[var(--color-bg-secondary)] flex items-center justify-center font-bold text-[var(--color-text-muted)]">2</div>
                <GalleryCaption>Image 2</GalleryCaption>
              </GalleryItem>
              <GalleryItem>
                <div className="aspect-square bg-[var(--color-bg-secondary)] flex items-center justify-center font-bold text-[var(--color-text-muted)]">3</div>
                <GalleryCaption>Image 3</GalleryCaption>
              </GalleryItem>
            </Gallery>
          )}

          {modalState.type === 'list-feed' && (
            <ListFeed>
              <ListFeedItem>
                <ListFeedAvatar>AB</ListFeedAvatar>
                <ListFeedContent>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[var(--text-base)]">Alice Bob</span>
                    <span className="text-[var(--font-size-xs)] text-[var(--text-muted)]">2m ago</span>
                  </div>
                  <p className="text-[var(--font-size-sm)] text-[var(--text-muted)] mt-1">Uploaded a new document for review.</p>
                </ListFeedContent>
              </ListFeedItem>
              <ListFeedItem>
                <ListFeedAvatar>CD</ListFeedAvatar>
                <ListFeedContent>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[var(--text-base)]">Charlie Delta</span>
                    <span className="text-[var(--font-size-xs)] text-[var(--text-muted)]">1h ago</span>
                  </div>
                  <p className="text-[var(--font-size-sm)] text-[var(--text-muted)] mt-1">Commented on your recent post.</p>
                </ListFeedContent>
              </ListFeedItem>
            </ListFeed>
          )}

          {modalState.type === 'accordion' && (
            <Accordion>
              <AccordionItem title="What is this component?">
                <p>This is a custom accordion built with motion for smooth height animations.</p>
              </AccordionItem>
              <AccordionItem title="Can it have multiple open?">
                <p>Currently it acts individually per item. You can build a controlled wrapper to limit it to a single open item (accordion mode).</p>
              </AccordionItem>
              <AccordionItem title="Is it responsive?">
                <p>Yes, it's styled using our design tokens for a consistent mobile and desktop experience.</p>
              </AccordionItem>
            </Accordion>
          )}

          {modalState.type === 'breadcrumbs' && (
            <Breadcrumbs id="sample-breadcrumbs">
              <BreadcrumbItem id="breadcrumb-home"><BreadcrumbLink href="#" id="link-home">Beranda</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbItem id="breadcrumb-components"><BreadcrumbLink href="#" id="link-components">Komponen</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbItem id="breadcrumb-current" isCurrentPage>Breadcrumb</BreadcrumbItem>
            </Breadcrumbs>
          )}

          {modalState.type === 'steppers' && (
            <Stepper 
              currentStep={1}
              steps={[
                { title: 'Information', description: 'Enter details' },
                { title: 'Payment', description: 'Credit card Info' },
                { title: 'Review', description: 'Confirm' }
              ]} 
            />
          )}

          {modalState.type === 'divider-badge' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <Divider orientation="horizontal" />
              <div className="flex justify-between items-center h-10">
                <span>Left Side</span>
                <Divider orientation="vertical" />
                <span>Right Side</span>
              </div>
            </div>
          )}

          {modalState.type === 'loading' && (
            <div className="space-y-6">
              <div className="border border-[var(--color-border)] p-4 rounded bg-[var(--color-bg-secondary)]">
                <p className="mb-2 font-medium">Inline Spinner</p>
                <InlineLoading variant="spinner" />
              </div>
              <div className="border border-[var(--color-border)] p-4 rounded bg-[var(--color-bg-secondary)]">
                <p className="mb-2 font-medium">Inline Skeleton</p>
                <InlineLoading variant="skeleton" />
              </div>
              
              <div className="border border-[var(--color-border)] p-4 rounded bg-[var(--color-bg-secondary)] flex gap-4">
                  <Button onClick={() => {
                    setGlobalLoadingSpinner(true);
                    setTimeout(() => setGlobalLoadingSpinner(false), 2000);
                  }}>Trigger Global Spinner (2s)</Button>
                  
                  <Button onClick={() => {
                    setGlobalLoadingSkeleton(true);
                    setTimeout(() => setGlobalLoadingSkeleton(false), 2000);
                  }}>Trigger Global Skeleton (2s)</Button>
              </div>
              
              <div className="border border-dashed border-[var(--color-border)] p-4 relative h-64 rounded bg-[var(--color-surface)] overflow-hidden">
                 <p className="mb-2 font-medium absolute top-2 left-2 z-10 bg-[var(--color-surface)] px-2 shadow">Page Spinner Example</p>
                 <PageLoading variant="spinner" text="Fetching module data..." className="min-h-full" />
              </div>
            </div>
          )}

          {modalState.type === 'custom-buttons' && (
            <div className="space-y-6">
              <div className="border border-[var(--color-border)] p-4 rounded bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                <p className="font-medium">Primary Buttons (Standard: Create, Update, Back, CTA)</p>
                <div className="flex flex-wrap gap-4 items-center">
                  <PrimaryButton>Create New</PrimaryButton>
                  <PrimaryButton icon={<ChevronLeft className="w-4 h-4" />}>Back</PrimaryButton>
                  <PrimaryButton icon={<Activity className="w-4 h-4" />}>Update Data</PrimaryButton>
                  <PrimaryButton isLoading>Processing...</PrimaryButton>
                  <PrimaryButton disabled>Disabled (Incomplete Form)</PrimaryButton>
                </div>
              </div>

              <div className="border border-[var(--color-border)] p-4 rounded bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                <p className="font-medium">Secondary Buttons (Standard: Cancel, Reset, Export)</p>
                <div className="flex flex-wrap gap-4 items-center">
                  <SecondaryButton>Cancel</SecondaryButton>
                  <SecondaryButton icon={<Activity className="w-4 h-4" />}>Reset Filter</SecondaryButton>
                  <SecondaryButton variant="outline">Export Data</SecondaryButton>
                </div>
              </div>

              <div className="border border-[var(--color-border)] p-4 rounded bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                <p className="font-medium">Tertiary Buttons (Auxiliary Functions)</p>
                <div className="flex flex-wrap gap-4 items-center">
                  <TertiaryButton>View History</TertiaryButton>
                  <TertiaryButton variant="outline">More Options</TertiaryButton>
                </div>
              </div>

              <div className="border border-[var(--color-border)] p-4 rounded bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                <p className="font-medium">Danger Buttons (Standard: Delete / Irreversible)</p>
                <div className="flex flex-wrap gap-4 items-center">
                  <DangerButton icon={<Trash className="w-4 h-4" />}>Delete Permanently</DangerButton>
                  <DangerButton size="sm">Remove</DangerButton>
                </div>
              </div>

              <div className="border border-[var(--color-border)] p-4 rounded bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                <p className="font-medium">Inline Buttons (Inside Table Rows/Text)</p>
                <div className="flex gap-4 items-center border border-dashed border-[var(--color-border)] p-4 rounded">
                  <span>Row Action:</span>
                  <InlineButton icon={<Edit className="w-3 h-3" />}>Edit</InlineButton>
                  <InlineButton variant="destructive" icon={<Trash className="w-3 h-3" />}>Remove</InlineButton>
                  <InlineButton size="icon" icon={<MoreHorizontal className="w-3 h-3" />} />
                </div>
              </div>
            </div>
          )}

          {modalState.type === 'basic-inputs' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Text Input</label>
                <TextInput />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Long Text Input</label>
                <LongTextInput />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Email Input</label>
                  <EmailInput />
                </div>
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Phone Input</label>
                  <PhoneInput />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Number Input</label>
                  <NumberInput />
                </div>
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Decimal Input</label>
                  <DecimalInput />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Percentage Input</label>
                  <PercentageInput />
                </div>
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Price Input</label>
                  <PriceInput />
                </div>
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">XY Input</label>
                <XYInput />
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Search Input</label>
                  <SearchInput placeholder="Search items..." />
                </div>
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Password Input</label>
                  <PasswordInput />
                </div>
                <div>
                  <SwitchInput label="Enable notifications" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 inline-flex">
                <Checkbox id="sample-check" />
                <label htmlFor="sample-check" className="text-[var(--font-size-sm)] text-[var(--color-text-base)] cursor-pointer select-none">I agree to the terms and conditions</label>
              </div>
            </div>
          )}

          {modalState.type === 'dropdowns' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Fixed Dropdown (Native Select)</label>
                <FixedDropdown options={[
                  { label: "Option 1", value: "1" },
                  { label: "Option 2", value: "2" },
                  { label: "Option 3", value: "3" },
                ]} />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Custom Dropdown (Searchable)</label>
                <CustomDropdown options={[
                  { label: "Apple", value: "apple" },
                  { label: "Banana", value: "banana" },
                  { label: "Cherry", value: "cherry" },
                  { label: "Date", value: "date" },
                  { label: "Elderberry", value: "elderberry" },
                  { label: "Fig", value: "fig" },
                  { label: "Grape", value: "grape" },
                ]} />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Fixed Multi Dropdown</label>
                <FixedMultiDropdown options={[
                  { label: "Option A", value: "A" },
                  { label: "Option B", value: "B" },
                  { label: "Option C", value: "C" },
                  { label: "Option D", value: "D" },
                ]} value={["A", "C"]} />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Custom Multi Dropdown</label>
                <CustomMultiDropdown options={[
                  { label: "Red", value: "red" },
                  { label: "Green", value: "green" },
                  { label: "Blue", value: "blue" },
                  { label: "Yellow", value: "yellow" },
                  { label: "Purple", value: "purple" },
                ]} value={["green", "yellow"]} />
              </div>
            </div>
          )}

          {modalState.type === 'datetime-inputs' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Date Input</label>
                <DateInput />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Time Input</label>
                <TimeInput />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Date & Time Input</label>
                <DateTimeInput />
              </div>
            </div>
          )}

          {modalState.type === 'color-picker' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Color Picker</label>
                <ColorPickerInput />
              </div>
              <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">Pick a color or type Hex code directly.</p>
            </div>
          )}

          {modalState.type === 'advanced-inputs' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Rich Text Editor</label>
                <RichTextInput placeholder="Write something amazing..." />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Tag/Chip Input</label>
                <TagInput value={["React", "TypeScript"]} />
              </div>
              <Divider />
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Signature Area</label>
                <SignatureInput height={150} />
              </div>
              <Divider />
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">File/Image Upload</label>
                <UploadFileImageInput />
              </div>
            </div>
          )}

          {modalState.type === 'youtube-input' && (
            <div className="space-y-4">
              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">YouTube Link Embed</label>
              <YoutubeInput />
            </div>
          )}

          {modalState.type === 'nfc-reader' && (
            <div className="space-y-4 py-4">
              <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-4">Tap an NFC tag to see the read simulation (Requires NFC-capable device and browser support).</p>
              <NFCReader />
            </div>
          )}

          {modalState.type === 'voice-controls' && (
            <div className="space-y-8 py-4">
              <div className="p-4 border border-[var(--color-tertiary)]/20 rounded-xl bg-[var(--color-bg-secondary)]">
                <h4 className="text-sm font-semibold mb-2">Speech to Text (STT)</h4>
                <p className="text-xs text-[var(--color-text-muted)] mb-4">Hold the microphone icon and speak. The transcript will appear below.</p>
                <div className="flex flex-col gap-3">
                  <VoiceInput onTranscript={(text) => toast.fire({ title: 'Transcript', text })} />
                  <p className="text-sm italic p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded min-h-[60px] text-[var(--color-text-muted)]">
                    Your speech will be processed here...
                  </p>
                </div>
              </div>

              <div className="p-4 border border-[var(--color-tertiary)]/20 rounded-xl bg-[var(--color-bg-secondary)]">
                <h4 className="text-sm font-semibold mb-2">Text to Speech (TTS)</h4>
                <p className="text-xs text-[var(--color-text-muted)] mb-4">Click the volume icon to read this text aloud.</p>
                <div className="flex items-center gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded">
                  <span className="flex-1 text-sm">Selamat datang di sistem manajemen Vibe Boilerplate. Sistem ini dirancang untuk kecepatan dan kemudahan akses.</span>
                  <TextToSpeech text="Selamat datang di sistem manajemen Vibe Boilerplate. Sistem ini dirancang untuk kecepatan dan kemudahan akses." />
                </div>
              </div>
            </div>
          )}

          {modalState.type === 'image-annotator' && (
            <div className="space-y-4">
               <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-4">Upload an image (e.g. car damage photo) and draw annotations on it. Supports fullscreen mode.</p>
               <ImageAnnotator onSave={(data) => {
                 console.log('Saved Annotation:', data);
                 toast.fire({ icon: 'success', title: 'Annotation Saved' });
               }} />
            </div>
          )}

          {modalState.type === 'high-location' && (
            <HighLocationSample />
          )}

          {modalState.type === 'actual-time' && (
            <ActualTimeSample />
          )}

          {modalState.type === 'map-picker' && (
            <div className="space-y-4">
              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Map Position Picker</label>
              <MapPicker />
              <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-4">Click anywhere on the map to set dropping pin.</p>
              
              <Divider />

              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-base)] mb-1">Map Radius Picker</label>
              <MapRadiusPicker />
              <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">Set a location and adjust the radius interactively via handle or input.</p>
            </div>
          )}

          {modalState.type === 'pdf-maker' && (
            <div className="space-y-6">
              <div id="pdf-sample-content" className="p-10 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-text-base)] relative shadow-sm max-w-[800px] mx-auto">
                 <div className="flex justify-between items-start mb-8">
                   <div>
                     <h2 className="text-2xl font-bold text-[var(--color-text-base)]">INVOICE</h2>
                     <p className="text-sm text-[var(--color-text-muted)]">#INV-2024-001</p>
                   </div>
                   <div className="text-right">
                     <div className="w-12 h-12 bg-blue-600 rounded-lg ml-auto mb-2 flex items-center justify-center text-white font-bold text-xl">V</div>
                     <p className="text-xs font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Vibe Boilerplate</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                   <div>
                      <p className="font-bold text-[var(--color-text-muted)] uppercase text-[var(--font-size-nano)] mb-1">{t('invoice.billedTo')}</p>
                     <p className="font-semibold">Customer Name</p>
                     <p className="text-[var(--color-text-muted)] leading-relaxed">123 Business Street<br/>Jakarta, Indonesia 12345</p>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-[var(--color-text-muted)] uppercase text-[var(--font-size-nano)] mb-1">{t('invoice.dateIssued')}</p>
                     <p className="font-semibold">May 06, 2026</p>
                   </div>
                 </div>

                 <Table className="mb-6">
                  <TableHeader>
                    <TableRow className="border-b-2 border-[var(--color-border)]">
                      <TableHead className="font-bold py-3">{t('invoice.description')}</TableHead>
                      <TableHead className="text-right font-bold py-3 w-32">{t('invoice.price')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b border-[var(--color-border)]/50">
                      <TableCell className="py-4 font-medium">{t('invoice.items.consultation')}</TableCell>
                      <TableCell className="text-right py-4 font-semibold text-[var(--color-text-base)]">{formatCurrency(1250, 'en-US', 'USD')}</TableCell>
                    </TableRow>
                    <TableRow className="border-b border-[var(--color-border)]/50">
                      <TableCell className="py-4 font-medium">{t('invoice.items.devModule')}</TableCell>
                      <TableCell className="text-right py-4 font-semibold text-[var(--color-text-base)]">{formatCurrency(3500, 'en-US', 'USD')}</TableCell>
                    </TableRow>
                    <TableRow className="border-b border-[var(--color-border)]/50">
                      <TableCell className="py-4 font-medium">{t('invoice.items.infrastructure')}</TableCell>
                      <TableCell className="text-right py-4 font-semibold text-[var(--color-text-base)]">{formatCurrency(850, 'en-US', 'USD')}</TableCell>
                    </TableRow>
                  </TableBody>
                 </Table>

                 <div className="flex justify-end pt-4">
                   <div className="w-64 space-y-3">
                     <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                       <span>{t('invoice.subtotal')}</span>                       <span>{formatCurrency(5600, 'en-US', 'USD')}</span>                     </div>
                     <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                       <span>{t('invoice.tax')}</span>                       <span>{formatCurrency(560, 'en-US', 'USD')}</span>                     </div>
                     <div className="flex justify-between text-lg font-bold text-[var(--color-text-base)] border-t border-[var(--color-border)] pt-3">
                       <span>{t('invoice.totalAmount')}</span>                       <span>{formatCurrency(6160, 'en-US', 'USD')}</span>                     </div>
                   </div>
                 </div>

                 <div className="mt-12 pt-8 border-t border-[var(--color-border)]/50 text-[var(--font-size-nano)] text-[var(--color-text-muted)] leading-relaxed italic">
                    {t('invoice.notes')}
                 </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-6 justify-center">
                <PrimaryButton onClick={() => downloadPdf('pdf-sample-content', { filename: 'Invoice_Flexible.pdf', multiPage: false })} icon={<Layout className="w-4 h-4" />}>{t('invoice.downloadFlexible')}</PrimaryButton>
                <Button variant="outline" onClick={() => downloadPdf('pdf-sample-content', { filename: 'Invoice_A4.pdf', multiPage: true })} className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" /> {t('invoice.downloadA4')}
                </Button>
                <Button variant="outline" onClick={() => printPdf('pdf-sample-content', 'Vibe Invoice Preview')} className="flex items-center gap-2">
                  <Layout className="w-4 h-4" /> {t('invoice.printPreview')}
                </Button>
              </div>
            </div>
          )}

          {modalState.type === 'excel-maker' && (
            <div className="space-y-4">
              <p className="text-[var(--font-size-sm)] text-[var(--color-text-base)]">Click the button below to download the sample data as an Excel file.</p>
              <PrimaryButton onClick={() => {
                const sampleData = [
                  { Name: "John Doe", Role: "Developer", Salary: 5000 },
                  { Name: "Jane Smith", Role: "Designer", Salary: 4500 },
                  { Name: "Bob Johnson", Role: "Manager", Salary: 6500 }
                ];
                generateExcel(sampleData, "Sample_Employees.xlsx", "Employees");
              }}>Generate Excel Document</PrimaryButton>
            </div>
          )}

          {modalState.type === 'comm-tools' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--color-text-base)]">Communication Tools Simulator</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => callPhone('08123456789')} className="flex items-center gap-2">
                  Call Example
                </Button>
                <Button variant="outline" onClick={() => sendSMS('08123456789', 'Hello! This is purely a test.')} className="flex items-center gap-2">
                  SMS Example
                </Button>
                <Button variant="outline" onClick={() => sendWhatsApp('628123456789', 'Hi this is sent from the UI directly via WhatsApp link.')} className="flex items-center gap-2">
                  WhatsApp Example
                </Button>
                <Button variant="outline" onClick={() => sendEmail('admin@example.com', 'Support Request', 'Please help me with...')} className="flex items-center gap-2">
                  Email Example
                </Button>
              </div>
            </div>
          )}

          {modalState.type === 'qrcode' && (
            <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-bg-secondary)] rounded-xl">
              <QRCodeDisplay value="https://example.com" size={200} />
              <p className="mt-4 text-sm text-[var(--color-text-muted)] font-medium">Scan to visit example.com</p>
            </div>
          )}

          {modalState.type === 'barcode' && (
            <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-bg-secondary)] rounded-xl">
              <BarcodeDisplay value="PROD-12345" />
              <p className="mt-4 text-sm text-[var(--color-text-muted)] font-medium">Product Code format CODE128</p>
            </div>
          )}

          {modalState.type === 'scanner' && (
            <div className="flex flex-col items-center">
              <p className="text-sm text-[var(--color-text-muted)] mb-4 text-center">Allow camera access to scan QR or Barcodes. Results will appear via toast.</p>
              <ScannerWidget 
                onScanSuccess={(text) => {
                  setModalState(prev => ({ ...prev, isOpen: false }));
                  swalConfig.fire('Scanned Success!', text, 'success');
                }} 
              />
            </div>
          )}

          {modalState.type === 'general' && (
            <>
              <p className="text-[var(--color-text-muted)]">
                This is a simulated form/detail content inside the {modalState.variant} modal. You can place any form elements, charts, or text here.
              </p>
              <div className="flex flex-col gap-3 mt-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-base)] mb-1">Simulated Input</label>
                  <input type="text" className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-base)] focus:ring-2 focus:ring-[var(--ui-primary)]/20 outline-none" placeholder="Enter something..." />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                  <Button onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}>Save changes</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      <GlobalLoading isLoading={globalLoadingSpinner} variant="spinner" text="Global processing..." />
      <GlobalLoading isLoading={globalLoadingSkeleton} variant="skeleton" />
    </div>
  );
};

export default SampleMenu;
