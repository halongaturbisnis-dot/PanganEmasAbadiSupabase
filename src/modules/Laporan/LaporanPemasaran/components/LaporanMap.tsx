import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IPemasaranWithCustomer } from '../../../../logic/services/pemasaranService';
import { cn } from '../../../../logic/utils/cn';
import { MapPin, Clock, User, Briefcase, Maximize, Minimize } from 'lucide-react';
import { formatDateTimeWithPipe } from '../../../../logic/utils/date';

interface LaporanMapProps {
  data: IPemasaranWithCustomer[];
  id?: string;
  className?: string;
}

const createMarkerIcon = (type: string) => {
  let color = '#3B82F6'; // Default Blue-500 (Client Relation)
  if (type === 'selling') color = '#FF2D55'; // Red
  if (type === 'offering') color = '#30D158'; // Green
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-laporan-marker',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function FitBounds({ data }: { data: IPemasaranWithCustomer[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (data.length > 0) {
      const validPoints = data
        .map(p => {
          const coords = p.latlong_visiting.split(',').map(v => parseFloat(v.trim()));
          return [coords[0], coords[1]] as [number, number];
        })
        .filter(c => !isNaN(c[0]) && !isNaN(c[1]));

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

export const LaporanMap: React.FC<LaporanMapProps> = ({ data, id = "laporan-map", className }) => {
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
        "relative w-full h-[31.25rem] rounded-RadiusLarge overflow-hidden border border-ColorSidebarBorder/opacity-OpacitySubtle shadow-inner bg-ColorBg flex flex-col z-10",
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
          
          {data.map((visit) => {
            const coords = visit.latlong_visiting.split(',').map(v => parseFloat(v.trim()));
            if (isNaN(coords[0]) || isNaN(coords[1])) return null;

            return (
              <Marker 
                key={visit.id} 
                position={[coords[0], coords[1]]} 
                icon={createMarkerIcon(visit.activity_type)}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-sm mb-1">{visit.customer_name}</h3>
                    {visit.customer_company && (
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Briefcase size={12} /> {visit.customer_company}
                      </p>
                    )}
                    
                    <div className="space-y-1 mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs">
                        <User size={12} className="text-gray-400" />
                        <span className="font-semibold">{visit.sales_username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock size={12} className="text-gray-400" />
                        <span>{formatDateTimeWithPipe(visit.visit_date)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs mt-1">
                        <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="whitespace-normal break-words leading-relaxed">{visit.alamat}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        visit.activity_type === 'client relation' ? "bg-blue-100 text-[#3B82F6]" :
                        visit.activity_type === 'selling' ? "bg-red-100 text-[#FF2D55]" :
                        "bg-green-100 text-[#30D158]"
                      )}>
                        {visit.activity_type}
                      </span>
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
