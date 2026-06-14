import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPoint } from '../../../logic/types/map';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { tokens } from '../../styles/tokens';
import { cn } from '../../../logic/utils/cn';
import { Clock, MapPin, Maximize, Minimize } from 'lucide-react';

// Custom icons for start, mid, and end points
const createMarkerIcon = (color: string, isStart: boolean, isEnd: boolean) => {
  const size = isStart || isEnd ? 36 : 28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size / 16}rem" height="${size / 16}rem">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'route-marker-icon',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);

  return null;
}

interface RouteMapProps {
  points: MapPoint[];
  className?: string;
  onPointClick?: (point: MapPoint) => void;
  accentColor?: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({ 
  points, 
  className, 
  onPointClick,
  accentColor,
  id = "route-map",
  ...props
}) => {
  const { state } = useGlobalState();
  const theme = state.theme;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(tokens.colors[theme].ColorPrimary);

  useEffect(() => {
    setPrimaryColor(tokens.colors[theme].ColorPrimary);
  }, [theme]);

  const color = accentColor || primaryColor;
  
  // Sort points by timestamp to ensure correct line drawing
  const sortedPoints = [...points].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const polylinePositions = sortedPoints.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <div id={id} className={cn(
      "relative overflow-hidden border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusMedium bg-ColorBg shadow-ElevationLow",
      isFullscreen ? "fixed inset-0 z-ZTopmost rounded-none h-dvh w-screen" : "w-full h-spacing-ContainerBase",
      className
    )} {...props}>
      <MapContainer 
        id={`${id}-leaflet-container`}
        center={sortedPoints[0] ? [sortedPoints[0].lat, sortedPoints[0].lng] : [-6.2, 106.81]} 
        zoom={13} 
        className="w-full h-full z-0"
        attributionControl={false}
      >
        <TileLayer
          id={`${id}-tile-layer`}
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <FitBounds points={sortedPoints} />

        {sortedPoints.length > 1 && (
          <Polyline 
            id={`${id}-polyline`}
            positions={polylinePositions} 
            pathOptions={{ 
              color, 
              weight: 4, 
              opacity: 0.8,
              lineJoin: 'round'
            }} 
          />
        )}

        {sortedPoints.map((point, index) => {
          const isStart = index === 0;
          const isEnd = index === sortedPoints.length - 1;
          const startColor = tokens.feedbackColors[theme].FeedbackColorSuccess;
          const endColor = tokens.feedbackColors[theme].FeedbackColorError;
          const markerColor = isStart ? startColor : isEnd ? endColor : color;
          
          return (
            <Marker 
              id={`${id}-marker-${index}`}
              key={point.id} 
              position={[point.lat, point.lng]} 
              icon={createMarkerIcon(markerColor, isStart, isEnd)}
              eventHandlers={{
                click: () => onPointClick?.(point)
              }}
            >
              <Popup id={`${id}-popup-${index}`} className="custom-popup">
                <div id={`${id}-popup-content-${index}`} className="p-SpacingNano min-w-spacing-ContainerSmall">
                  <div id={`${id}-popup-header-${index}`} className="flex items-center gap-SpacingTiny mb-SpacingTiny pb-2 border-b border-ColorSidebarBorder/opacity-OpacitySubtle">
                    <div id={`${id}-popup-icon-box-${index}`} className="p-SpacingTiny rounded-RadiusFull bg-ColorBgSecondary">
                      <MapPin id={`${id}-popup-pin-${index}`} size={14} className="text-TextColorMuted" />
                    </div>
                    <div>
                      <h3 id={`${id}-popup-title-${index}`} className="text-FontSizeXs font-black text-TextColorBase leading-tight">
                        {point.title}
                      </h3>
                      <p id={`${id}-popup-subtitle-${index}`} className="text-FontSizeNano text-TextColorMuted font-bold">
                        Lokasi {index + 1}
                      </p>
                    </div>
                  </div>
                  
                  <div id={`${id}-popup-time-row-${index}`} className="flex items-center gap-SpacingTiny text-TextColorBase mb-SpacingTiny">
                    <Clock id={`${id}-popup-clock-${index}`} size={12} />
                    <span id={`${id}-popup-time-${index}`} className="text-FontSizeNano font-bold">
                      {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {point.description && (
                    <p id={`${id}-popup-desc-${index}`} className="text-FontSizeNano text-TextColorMuted italic bg-FeedbackColorWarning/opacity-OpacitySubtle p-SpacingTiny rounded-RadiusSmall leading-relaxed border-l-2 border-FeedbackColorWarning/opacity-OpacityMuted font-medium">
                      "{point.description}"
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Controls */}
      <button 
        id={`${id}-fullscreen-btn`}
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-SpacingSmall right-SpacingSmall z-ZTopmost p-SpacingTiny bg-ColorBg/opacity-OpacityHover backdrop-blur-sm border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusMedium shadow-ElevationHigh hover:bg-ColorBg transition-all text-TextColorBase"
        title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
      >
        {isFullscreen ? <Minimize id={`${id}-min-icon`} size={20} /> : <Maximize id={`${id}-max-icon`} size={20} />}
      </button>

      {/* Legend */}
      <div id={`${id}-legend`} className="absolute bottom-SpacingSmall left-SpacingSmall z-ZTopmost p-SpacingSmall bg-ColorBg/opacity-OpacityHover backdrop-blur-sm border border-ColorSidebarBorder/opacity-OpacitySubtle rounded-RadiusMedium shadow-ElevationHigh">
        <div id={`${id}-legend-items`} className="space-y-2">
          <div id={`${id}-legend-start`} className="flex items-center gap-SpacingTiny text-FontSizeNano font-black text-TextColorBase">
            <div id={`${id}-legend-start-dot`} className="w-spacing-SpacingTiny h-spacing-SpacingTiny rounded-RadiusFull bg-FeedbackColorSuccess shadow-ElevationLow" />
            <span>Kunjungan Awal</span>
          </div>
          <div id={`${id}-legend-end`} className="flex items-center gap-SpacingTiny text-FontSizeNano font-black text-TextColorBase">
            <div id={`${id}-legend-end-dot`} className="w-spacing-SpacingTiny h-spacing-SpacingTiny rounded-RadiusFull bg-FeedbackColorError shadow-ElevationLow" />
            <span>Kunjungan Terakhir</span>
          </div>
          <div id={`${id}-legend-path`} className="flex items-center gap-SpacingTiny text-FontSizeNano font-black text-TextColorBase">
            <div id={`${id}-legend-path-line`} className="w-spacing-SpacingTiny h-spacing-SpacingTiny rounded-RadiusSmall shadow-ElevationLow" style={{ backgroundColor: color, opacity: 0.8 }} />
            <span>Jalur Perjalanan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
