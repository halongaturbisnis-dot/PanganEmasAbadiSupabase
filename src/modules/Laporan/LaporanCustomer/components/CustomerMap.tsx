import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ICustomer } from '../../../../logic/types/ITs_Customer';
import { cn } from '../../../../logic/utils/cn';
import { MapPin, Briefcase, Phone, Maximize, Minimize } from 'lucide-react';
import { tokens } from '../../../../ui/styles/tokens';

interface CustomerMapProps {
  data: ICustomer[];
  id?: string;
  className?: string;
  markerColor?: string;
}

const createMarkerIcon = (color: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-customer-marker',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function FitBounds({ data }: { data: ICustomer[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (data.length > 0) {
      const validPoints = data
        .map(p => {
          if (!p.latlong) return null;
          const coords = p.latlong.split(',').map(v => parseFloat(v.trim()));
          return [coords[0], coords[1]] as [number, number];
        })
        .filter((c): c is [number, number] => c !== null && !isNaN(c[0]) && !isNaN(c[1]));

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [data, map]);

  return null;
}

function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
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

export const CustomerMap: React.FC<CustomerMapProps> = ({ 
  data, 
  id = "customer-map", 
  className,
  markerColor = tokens.semantic.colors.light.ColorPrimary 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-[99999] bg-ColorBg w-screen h-dvh flex flex-col"
    : cn(
        "relative w-full h-full min-h-[300px] rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/OpacitySubtle shadow-inner bg-ColorBg flex flex-col z-10",
        className
      );

  const content = (
    <div id={id} className={containerClasses}>
      <div id={`${id}-map-area`} className="flex-1 relative overflow-hidden h-full w-full">
        <MapContainer 
          center={[-6.2, 106.81]} 
          zoom={11} 
          className="w-full h-full z-0 absolute inset-0"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <FitBounds data={data} />
          <MapResizer isFullscreen={isFullscreen} />
          
          {data.map((customer) => {
            if (!customer.latlong) return null;
            const coords = customer.latlong.split(',').map(v => parseFloat(v.trim()));
            if (isNaN(coords[0]) || isNaN(coords[1])) return null;

            return (
              <Marker 
                key={customer.id} 
                position={[coords[0], coords[1]]} 
                icon={createMarkerIcon(markerColor)}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-sm mb-1">{customer.name}</h3>
                    {customer.company && (
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Briefcase size={12} /> {customer.company}
                      </p>
                    )}
                    
                    <div className="space-y-1 mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs">
                        <Phone size={12} className="text-gray-400" />
                        <span className="font-semibold">{customer.telepon}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs mt-1">
                        <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="break-words">{customer.alamat}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Fullscreen control overlay */}
        <div id={`${id}-controls`} className="absolute right-2 top-2 z-[9999]">
          <button
            id={`${id}-fullscreen-btn`}
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFullscreen(!isFullscreen); }}
            className="flex items-center justify-center w-[2.25rem] h-[2.25rem] bg-ColorBg text-TextColorBase hover:text-ColorPrimary rounded-RadiusSmall shadow-ElevationLow border border-ColorSidebarBorder/OpacitySubtle active:scale-95 transition-all"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize id={`${id}-min-icon`} size={18} /> : <Maximize id={`${id}-max-icon`} size={18} />}
          </button>
        </div>
      </div>
    </div>
  );

  return isFullscreen ? createPortal(content, document.body) : content;
};
