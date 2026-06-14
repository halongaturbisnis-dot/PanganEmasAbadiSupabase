import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../../../logic/utils/cn';
import { tokens } from '../../styles/tokens';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { Navigation, Maximize, Minimize } from 'lucide-react';
import { openInMaps, isValidCoordinate } from '../../../logic/utils/map';

interface MapViewerProps {
  id?: string;
  latlong?: string; // Format: "lat, lng"
  label?: string;
  zoom?: number;
  className?: string;
  height?: string;
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

/**
 * MAP VIEWER
 * Komponen peta readonly dengan fitur navigasi ke aplikasi peta bawaan device.
 */
export const MapViewer: React.FC<MapViewerProps> = ({
  id = "map-viewer",
  latlong,
  label,
  zoom = 15,
  className,
  height = "400px",
}) => {
  const { state } = useGlobalState();
  const theme = state.theme;
  const { isMobile } = state.viewport;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Parse coordinates
  const coords = latlong?.split(',').map(v => parseFloat(v.trim())) || [0, 0];
  const lat = coords[0];
  const lng = coords[1];
  const position: [number, number] = [lat, lng];

  const isValid = isValidCoordinate(lat, lng);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  // Custom marker icon using Primary Color
  const customIcon = L.divIcon({
    className: 'custom-viewer-marker',
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${tokens.colors[theme].ColorPrimary}" width="32" height="32">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openInMaps(lat, lng);
  };

  if (!isValid) {
    return (
      <div className="w-full h-48 bg-ColorBgSecondary/OpacitySubtle flex items-center justify-center text-TextColorMuted italic rounded-RadiusMedium border border-dashed border-ColorSidebarBorder/OpacityMuted">
        Lokasi tidak tersedia
      </div>
    );
  }

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-[99999] bg-ColorBg w-screen h-dvh flex flex-col"
    : cn(
        "relative rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner bg-ColorBg w-full flex flex-col z-10",
        className
      );

  const content = (
    <div 
      id={id} 
      className={containerClasses}
      style={isFullscreen ? {} : { height }}
    >
      <div id={`${id}-map-area`} className="flex-1 relative overflow-hidden">
        <MapContainer 
          center={position} 
          zoom={zoom} 
          className="w-full h-full absolute inset-0 z-0"
          attributionControl={false}
          boxZoom={false}
          doubleClickZoom={!isMobile}
          scrollWheelZoom={!isMobile}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapResizer isFullscreen={isFullscreen} />
          <Marker position={position} icon={customIcon}>
            {label && (
              <Tooltip permanent direction="top" offset={[0, -20]}>
                <span className="font-semibold text-FontSizeXs">{label}</span>
              </Tooltip>
            )}
          </Marker>
        </MapContainer>

        {/* Controls Overlay */}
        <div id={`${id}-controls`} className={cn(
          "absolute right-2 flex flex-col gap-SpacingTiny z-ZTopmost transition-all",
          isFullscreen ? "top-SpacingSmall right-SpacingSmall" : (isMobile ? "top-SpacingTiny right-SpacingTiny" : "top-2")
        )}>
          <button
            id={`${id}-fullscreen-btn`}
            type="button"
            onClick={(e) => { e.preventDefault(); setIsFullscreen(!isFullscreen); }}
            className="flex items-center justify-center w-[2.25rem] h-[2.25rem] bg-ColorBg text-TextColorBase hover:text-ColorPrimary rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/OpacitySubtle active:scale-95 transition-all"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize id={`${id}-min-icon`} size={18} /> : <Maximize id={`${id}-max-icon`} size={18} />}
          </button>
          <button
            id={`${id}-navigate-btn`}
            type="button"
            onClick={handleNavigate}
            className="flex items-center justify-center w-[2.25rem] h-[2.25rem] bg-ColorBg text-TextColorBase hover:text-ColorPrimary rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/OpacitySubtle active:scale-95 transition-all"
            title="Buka Navigasi Map"
          >
            <Navigation id={`${id}-nav-icon`} size={18} className="fill-current" />
          </button>
        </div>
      </div>
    </div>
  );

  return isFullscreen ? createPortal(content, document.body) : content;
};
