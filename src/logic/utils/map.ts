/**
 * UTILS/MAP.TS
 * Shared logic for map and coordinate operations.
 */

// Format coordinates to readable string
export const formatCoordinates = (lat: number, lng: number, fractionDigits: number = 6): string => {
  if (isNaN(lat) || isNaN(lng)) return '';
  return `${lat.toFixed(fractionDigits)}, ${lng.toFixed(fractionDigits)}`;
};

// Validate latitude and longitude values
export const isValidCoordinate = (lat: number, lng: number): boolean => {
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
};

// Reverse geocoding using OSM Nominatim
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'AIPenyerahanApp/1.0'
      }
    });
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    return data.display_name || formatCoordinates(lat, lng);
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return formatCoordinates(lat, lng);
  }
};

// Open coordinates in device's default map application
export const openInMaps = (lat: number, lng: number): void => {
  if (!isValidCoordinate(lat, lng)) return;
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS) {
    window.open(`maps://maps.apple.com/?q=${lat},${lng}`, '_blank');
  } else if (isAndroid) {
    window.open(`geo:${lat},${lng}?q=${lat},${lng}`, '_blank');
  } else {
    // Desktop or others: Default to Google Maps Search
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  }
};
