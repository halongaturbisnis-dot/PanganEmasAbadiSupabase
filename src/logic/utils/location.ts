/**
 * High Integrity Location Utility
 * Handles high accuracy GPS picking and common spoofing detection.
 */

export interface HighIntegrityLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  isFallback: boolean;
  isPotentiallyFake: boolean;
  timestamp: number;
}

export async function getCurrentHighIntegrityLocation(): Promise<HighIntegrityLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // accuracy > 150m is likely signal tower / IP based fallback
        const isFallback = accuracy > 150;
        
        // Simple fake detection (some browsers/environments might provide mocked flag)
        const isPotentiallyFake = (position as any).mocked === true;

        resolve({
          latitude,
          longitude,
          accuracy,
          isFallback,
          isPotentiallyFake,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Calculates distance between two points in Meters using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}
