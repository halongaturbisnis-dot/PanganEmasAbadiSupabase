import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../../../logic/utils/cn';
import { Maximize, Minimize, Check, X, MapPinPen, Navigation, Loader2 } from 'lucide-react';
import { reverseGeocode, isValidCoordinate } from '../../../logic/utils/map';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { tokens } from '../../styles/tokens';
import { useLocation } from '../../../logic/hooks/useLocation';
import { Badge } from './Badge';

// Create a custom SVG icon using primary color
const createCustomIcon = (color: string) => {
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="2rem" height="2rem">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svgTemplate,
    iconSize: [32, 32],
    iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
    tooltipAnchor: [0, -32],
  });
};

interface MapPickerProps {
  className?: string;
  value?: { lat: number; lng: number };
  onChange?: (pos: { lat: number; lng: number }) => void;
  onAddressResolve?: (address: string) => void;
  defaultPosition?: { lat: number; lng: number };
  readonly?: boolean;
}

function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    // We need a series of invalidates to catch the DOM updates correctly
    const timer1 = setTimeout(() => map.invalidateSize(), 50);
    const timer2 = setTimeout(() => map.invalidateSize(), 250);
    const timer3 = setTimeout(() => map.invalidateSize(), 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isFullscreen, map]);

  return null;
}

function LocationMarker({ position, setPosition, icon, address, id = "marker", readonly = false }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void, icon: L.DivIcon, address: string, id?: string, readonly?: boolean }) {
  const markerRef = useRef<any>(null);

  const map = useMapEvents({
    click(e) {
      if (!readonly) {
        setPosition(e.latlng);
      }
    },
  });

  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        if (readonly) return;
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition, readonly],
  );

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { animate: true, duration: 0.5 });
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker 
      position={position} 
      icon={icon}
      draggable={!readonly}
      eventHandlers={eventHandlers}
      ref={markerRef}
    >
      <LeafletTooltip direction="top" offset={[0, -20]} className="shadow-ElevationLow rounded-RadiusSmall border border-ColorSidebarBorder/opacity-OpacitySubtle p-0 overflow-hidden bg-transparent">
        <div id={`${id}-tooltip`} className="w-64 whitespace-normal break-words text-FontSizeXs text-center p-SpacingTiny bg-ColorBg text-TextColorBase font-medium">
          {address ? address : "Sedang memuat alamat..."}
        </div>
      </LeafletTooltip>
    </Marker>
  );
}

export const MapPicker = React.forwardRef<HTMLDivElement, MapPickerProps>(({ 
  className, 
  value, 
  onChange, 
  onAddressResolve,
  defaultPosition = { lat: -6.200000, lng: 106.816666 },
  readonly = false,
  id = "map-picker",
  ...props
}, ref) => {
  const { state } = useGlobalState();
  const theme = state.theme;
  const isMobile = state.viewport.isMobile;
  const [position, setPosition] = useState<L.LatLng | null>(value ? L.latLng(value.lat, value.lng) : null);
  const [primaryColor, setPrimaryColor] = useState(tokens.colors[theme].ColorPrimary);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInputCard, setShowInputCard] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [address, setAddress] = useState('');
  const { getLocation: detect, isLoading: detecting, location: detectedLocation } = useLocation();

  const handleDetectLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    const loc = await detect();
    if (loc) {
      handlePositionChange(L.latLng(loc.latitude, loc.longitude));
    }
  };

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);
  
  useEffect(() => {
    setPrimaryColor(tokens.colors[theme].ColorPrimary);
  }, [theme]);

  const resolveAddress = useCallback(async (lat: number, lng: number) => {
    setAddress('');
    const newAddress = await reverseGeocode(lat, lng);
    setAddress(newAddress);
    if (onAddressResolve) onAddressResolve(newAddress);
  }, [onAddressResolve]);

  const handlePositionChange = useCallback(async (p: L.LatLng) => {
    setPosition(p);
    if (onChange) onChange({ lat: p.lat, lng: p.lng });
    resolveAddress(p.lat, p.lng);
  }, [onChange, resolveAddress]);

  useEffect(() => {
    if (value) {
      const p = L.latLng(value.lat, value.lng);
      if (!position || !p.equals(position)) {
        setPosition(p);
        resolveAddress(p.lat, p.lng);
      }
    }
  }, [value, resolveAddress]);

  useEffect(() => {
    if (value && !address) {
      resolveAddress(value.lat, value.lng);
    }
  }, []);

  const customIcon = createCustomIcon(primaryColor);

  const applyRawInput = () => {
    try {
      const parts = rawInput.split(',').map(p => p.trim());
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (isValidCoordinate(lat, lng)) {
          handlePositionChange(L.latLng(lat, lng));
          setShowInputCard(false);
          return;
        }
      }
      alert("Format tidak valid. Gunakan: lat, lng");
    } catch (err) {
      alert("Terjadi kesalahan saat memproses koordinat.");
    }
  };

  const mapContainerClasses = cn(
    "relative border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusSmall overflow-hidden bg-ColorBg flex flex-col",
    isFullscreen ? "fixed inset-0 z-[99999] rounded-none h-dvh w-screen" : "w-full h-spacing-ContainerBase z-10 transition-all",
    className
  );

  const content = (
    <div ref={ref} id={id} className={mapContainerClasses} {...props}>
      <div id={`${id}-map-area`} className="flex-1 relative overflow-hidden">
        <MapContainer 
          center={value || defaultPosition} 
          zoom={13} 
          scrollWheelZoom={true}
          className="w-full h-full absolute inset-0 z-0"
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapResizer isFullscreen={isFullscreen} />
          <LocationMarker id={`${id}-marker`} position={position} setPosition={handlePositionChange} icon={customIcon} address={address} readonly={readonly} />
        </MapContainer>

        <div id={`${id}-controls`} className={cn(
          "absolute right-2 flex flex-col gap-SpacingTiny z-ZTopmost",
          isFullscreen ? "top-SpacingSmall right-SpacingSmall" : (isMobile ? "top-SpacingTiny right-SpacingTiny" : "top-2")
        )}>
          <button 
            id={`${id}-fullscreen-btn`}
            type="button"
            onClick={(e) => { e.preventDefault(); setIsFullscreen(!isFullscreen); }}
            className="bg-ColorBg text-TextColorBase hover:text-ColorPrimary p-SpacingTiny rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/opacity-OpacitySubtle transition-all"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize id={`${id}-min-icon`} size={18} /> : <Maximize id={`${id}-max-icon`} size={18} />}
          </button>
          {!readonly && (
            <button 
              id={`${id}-manual-btn`}
              type="button"
              onClick={(e) => { 
                e.preventDefault(); 
                setShowInputCard(!showInputCard); 
                if (!showInputCard && position) {
                  setRawInput(`${position.lat}, ${position.lng}`);
                }
              }}
              className="bg-ColorBg text-TextColorBase hover:text-ColorPrimary p-SpacingTiny rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/opacity-OpacitySubtle transition-all"
              title="Input Manual"
            >
              <MapPinPen id={`${id}-pen-icon`} size={18} />
            </button>
          )}
          {!readonly && (
            <button 
              id={`${id}-detect-btn`}
              type="button"
              onClick={handleDetectLocation}
              disabled={detecting}
              className="bg-ColorBg text-TextColorBase hover:text-ColorPrimary p-SpacingTiny rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/opacity-OpacitySubtle transition-all disabled:opacity-OpacityMuted"
              title="Deteksi Lokasi Saya"
            >
              {detecting ? <Loader2 id={`${id}-loading-icon`} size={18} className="animate-spin" /> : <Navigation id={`${id}-nav-icon`} size={18} />}
            </button>
          )}
        </div>

        {detectedLocation && (
          <div id={`${id}-integrity`} className="absolute bottom-2 left-2 z-ZTopmost animate-in fade-in slide-in-from-bottom-2 duration-DurationSlow">
            <Badge id={`${id}-accuracy-badge`} variant={detectedLocation.accuracy <= 150 ? "success" : "warning"}>
              {detectedLocation.accuracy <= 150 ? "Akurasi Tinggi" : "Akurasi Rendah"}
              {` (${Math.round(detectedLocation.accuracy)}m)`}
            </Badge>
          </div>
        )}

        {showInputCard && (
          <div id={`${id}-input-card`} className={cn(
            "absolute z-ZTopmost bg-ColorBg rounded-RadiusSmall shadow-ElevationHigh border border-ColorSidebarBorder/opacity-OpacitySubtle p-SpacingSmall animate-in fade-in slide-in-from-top-2 duration-DurationMid",
            isFullscreen ? "top-SpacingSmall left-SpacingSmall" : (isMobile ? "top-SpacingTiny left-SpacingTiny right-SpacingTiny w-auto" : "top-2 left-2 w-64")
          )}>
            <div id={`${id}-card-header`} className="flex justify-between items-center mb-SpacingTiny">
              <h4 id={`${id}-card-title`} className="text-FontSizeXs font-black text-TextColorBase">Input Koordinat</h4>
              <button id={`${id}-card-close`} type="button" onClick={() => setShowInputCard(false)} className="text-TextColorMuted hover:text-FeedbackColorError transition-colors">
                <X id={`${id}-close-icon`} size={14} />
              </button>
            </div>
            <div id={`${id}-card-body`} className="flex flex-col gap-SpacingTiny">
              <input 
                id={`${id}-raw-input`}
                type="text" 
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="-6.200, 106.816"
                className="w-full text-FontSizeXs bg-ColorBg text-TextColorBase border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusSmall px-SpacingTiny py-2 focus:outline-none focus:ring-2 focus:ring-ColorPrimary/opacity-OpacitySubtle transition-all"
              />
              <button 
                id={`${id}-confirm-btn`}
                type="button"
                onClick={applyRawInput}
                className="flex items-center justify-center gap-SpacingNano bg-ColorPrimary text-White font-black text-FontSizeXs py-2 rounded-RadiusSmall hover:opacity-OpacityHover transition-all w-full"
              >
                <Check id={`${id}-check-icon`} size={14} /> Konfirmasi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(content, document.body);
  }

  return content;
});
MapPicker.displayName = "MapPicker";

// --- MapRadiusPicker ---
const calculateDestinationPoint = (lat: number, lng: number, distanceMeters: number, bearingDegrees: number) => {
  const R = 6371e3; 
  const brng = bearingDegrees * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lng1 = lng * Math.PI / 180;

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceMeters / R) +
              Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(brng));
  const lng2 = lng1 + Math.atan2(Math.sin(brng) * Math.sin(distanceMeters / R) * Math.cos(lat1),
                     Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2));

  return L.latLng(lat2 * 180 / Math.PI, lng2 * 180 / Math.PI);
};

export interface MapRadiusPickerProps {
  className?: string;
  position?: { lat: number; lng: number };
  radius?: number; // meters
  onChange?: (pos: { lat: number; lng: number }, radius: number) => void;
  defaultPosition?: { lat: number; lng: number };
}

export const MapRadiusPicker = React.forwardRef<HTMLDivElement, MapRadiusPickerProps>(({ 
  className, 
  position: initialPos, 
  radius: initialRadius = 100, 
  onChange, 
  defaultPosition = { lat: -6.200000, lng: 106.816666 },
  id = "map-radius-picker",
  ...props
}, ref) => {
  const { state } = useGlobalState();
  const theme = state.theme;
  const [position, setPosition] = useState<L.LatLng | null>(initialPos ? L.latLng(initialPos.lat, initialPos.lng) : L.latLng(defaultPosition.lat, defaultPosition.lng));
  const [radius, setRadius] = useState<number>(initialRadius);
  const [primaryColor, setPrimaryColor] = useState(tokens.colors[theme].ColorPrimary);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInputCard, setShowInputCard] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [address, setAddress] = useState('');
  const { getLocation: detect, isLoading: detecting, location: detectedLocation } = useLocation();

  const handleDetectLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    const loc = await detect();
    if (loc) {
      handlePositionChange(L.latLng(loc.latitude, loc.longitude));
    }
  };

  useEffect(() => {
    if (initialRadius !== radius) {
      setRadius(initialRadius);
    }
  }, [initialRadius]);

  useEffect(() => {
    if (initialPos) {
      const p = L.latLng(initialPos.lat, initialPos.lng);
      if (!position || !p.equals(position)) {
        setPosition(p);
      }
    }
  }, [initialPos]);

  useEffect(() => {
    setPrimaryColor(tokens.colors[theme].ColorPrimary);
    if (position) reverseGeocode(position.lat, position.lng).then(setAddress);
  }, [theme]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const handlePositionChange = useCallback((p: L.LatLng) => {
    setPosition(p);
    if (onChange) onChange({ lat: p.lat, lng: p.lng }, radius);
    setAddress('');
    reverseGeocode(p.lat, p.lng).then(setAddress);
  }, [onChange, radius]);

  const customIcon = createCustomIcon(primaryColor);

  const applyRawInput = () => {
    try {
      const parts = rawInput.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        const rad = parts[2] ? parseFloat(parts[2]) : radius;
        if (isValidCoordinate(lat, lng)) {
          const p = L.latLng(lat, lng);
          setPosition(p);
          const finalRad = !isNaN(rad) ? rad : radius;
          setRadius(finalRad);
          if (onChange) onChange({ lat: p.lat, lng: p.lng }, finalRad);
          setShowInputCard(false);
          return;
        }
      }
      alert("Format tidak valid. Gunakan: lat, lng, radius");
    } catch (err) {
      alert("Terjadi kesalahan saat memproses koordinat.");
    }
  };

  const mapContainerClasses = cn(
    "relative border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusSmall overflow-hidden bg-ColorBg flex flex-col",
    isFullscreen ? "fixed inset-0 z-[99999] rounded-none h-dvh w-screen" : "w-full h-spacing-ContainerSmall z-10 transition-all",
    className
  );

  const content = (
    <div ref={ref} id={id} className={mapContainerClasses} {...props}>
      <div id={`${id}-map-area`} className="flex-1 relative overflow-hidden">
        <MapContainer 
          center={position || defaultPosition} 
          zoom={14} 
          scrollWheelZoom={true}
          className="w-full h-full absolute inset-0 z-0"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapResizer isFullscreen={isFullscreen} />
          <LocationMarker id={`${id}-marker`} position={position} setPosition={handlePositionChange} icon={customIcon} address={address} />
          {position && (
            <Circle center={position} radius={radius} pathOptions={{ color: primaryColor, fillColor: primaryColor, fillOpacity: 0.2, weight: 2 }} />
          )}
        </MapContainer>

        <div id={`${id}-controls`} className={cn(
          "absolute right-2 flex flex-col gap-SpacingTiny z-ZTopmost",
          isFullscreen ? "top-SpacingSmall right-SpacingSmall" : "top-2"
        )}>
          <button 
            id={`${id}-fullscreen-btn`}
            type="button"
            onClick={(e) => { e.preventDefault(); setIsFullscreen(!isFullscreen); }}
            className="bg-ColorBg text-TextColorBase hover:text-ColorPrimary p-SpacingTiny rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/opacity-OpacitySubtle transition-all"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize id={`${id}-min-icon`} size={18} /> : <Maximize id={`${id}-max-icon`} size={18} />}
          </button>
          <button 
            id={`${id}-manual-btn`}
            type="button"
            onClick={(e) => { 
              e.preventDefault(); 
              setShowInputCard(!showInputCard); 
              if (!showInputCard && position) {
                setRawInput(`${position.lat}, ${position.lng}, ${radius}`);
              }
            }}
            className="bg-ColorBg text-TextColorBase hover:text-ColorPrimary p-SpacingTiny rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/opacity-OpacitySubtle transition-all"
            title="Input Manual"
          >
            <MapPinPen id={`${id}-pen-icon`} size={18} />
          </button>
          <button 
            id={`${id}-detect-btn`}
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="bg-ColorBg text-TextColorBase hover:text-ColorPrimary p-SpacingTiny rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/opacity-OpacitySubtle transition-all disabled:opacity-OpacityMuted"
            title="Deteksi Lokasi Saya"
          >
            {detecting ? <Loader2 id={`${id}-loading-icon`} size={18} className="animate-spin" /> : <Navigation id={`${id}-nav-icon`} size={18} />}
          </button>
        </div>

        {detectedLocation && (
          <div id={`${id}-integrity`} className="absolute bottom-2 left-2 z-ZTopmost animate-in fade-in slide-in-from-bottom-2 duration-DurationSlow">
            <Badge id={`${id}-accuracy-badge`} variant={detectedLocation.accuracy <= 150 ? "success" : "warning"}>
              {detectedLocation.accuracy <= 150 ? "Akurasi Tinggi" : "Akurasi Rendah"}
              {` (${Math.round(detectedLocation.accuracy)}m)`}
            </Badge>
          </div>
        )}

        {showInputCard && (
          <div id={`${id}-input-card`} className={cn(
            "absolute left-2 z-ZTopmost w-64 bg-ColorBg rounded-RadiusSmall shadow-ElevationHigh border border-ColorSidebarBorder/opacity-OpacitySubtle p-SpacingSmall animate-in fade-in slide-in-from-top-2 duration-DurationMid",
            isFullscreen ? "top-SpacingSmall left-SpacingSmall" : "top-2"
          )}>
            <div id={`${id}-card-header`} className="flex justify-between items-center mb-SpacingSmall">
              <h4 id={`${id}-card-title`} className="text-FontSizeXs font-black text-TextColorBase">Input Koordinat</h4>
              <button id={`${id}-card-close`} type="button" onClick={() => { setShowInputCard(false); }} className="text-TextColorMuted hover:text-FeedbackColorError transition-colors">
                <X id={`${id}-close-icon`} size={14} />
              </button>
            </div>
            
            <div id={`${id}-card-body`} className="flex flex-col gap-SpacingSmall">
              <div id={`${id}-coord-group`} className="flex flex-col gap-SpacingNano">
                <input 
                  id={`${id}-raw-input`}
                  type="text" 
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="-6.200, 106.816, 100"
                  className="w-full text-FontSizeXs bg-ColorBg text-TextColorBase border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusSmall px-SpacingTiny py-2 focus:outline-none focus:ring-2 focus:ring-ColorPrimary/opacity-OpacitySubtle transition-all"
                />
              </div>

              <div id={`${id}-radius-group`} className="flex flex-col gap-SpacingNano">
                <p id={`${id}-radius-label`} className="text-FontSizeNano text-TextColorMuted font-bold ml-1">Radius (Meter)</p>
                <input 
                  id={`${id}-radius-input`}
                  type="number" 
                  value={radius} 
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    const finalRad = r > 0 ? r : 10;
                    setRadius(finalRad);
                    if (onChange && position) onChange({ lat: position.lat, lng: position.lng }, finalRad);
                  }} 
                  className="w-full text-FontSizeXs bg-ColorBg text-TextColorBase border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusSmall px-SpacingTiny py-2 focus:outline-none focus:ring-2 focus:ring-ColorPrimary/opacity-OpacitySubtle transition-all"
                  min={5}
                />
              </div>

              <button 
                id={`${id}-confirm-btn`}
                type="button"
                onClick={applyRawInput}
                className="flex items-center justify-center gap-SpacingNano bg-ColorPrimary text-White font-black text-FontSizeXs py-2.5 rounded-RadiusSmall hover:opacity-OpacityHover transition-all w-full mt-SpacingTiny shadow-ElevationLow"
              >
                <Check id={`${id}-check-icon`} size={14} /> Konfirmasi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(content, document.body);
  }

  return content;
});
MapRadiusPicker.displayName = "MapRadiusPicker";

