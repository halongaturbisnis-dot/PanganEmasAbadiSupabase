/**
 * LOGIC/SERVICES/LOCATIONSERVICE.TS
 * Service to handle hybrid location detection (GPS + Fallback).
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  source: 'GPS' | 'NETWORK' | 'IP';
}

export const locationService = {
  /**
   * Gets current location using standard Geolocation API with high accuracy settings.
   */
  async getCurrentPosition(): Promise<LocationData> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            // Standard API doesn't explicitly distinguish GPS vs Network easily, 
            // but high accuracy usually prioritizes GPS.
            source: position.coords.accuracy < 100 ? 'GPS' : 'NETWORK',
          });
        },
        (error) => {
          // If GPS fails/denied, we could potentially call an IP-based fallback service here
          reject(error);
        },
        {
          enableHighAccuracy: true, // Priority 1: GPS Satellite
          timeout: 10000,           // 10 seconds timeout per LocationRule.md
          maximumAge: 300000,       // 5 minutes freshness per LocationRule.md
        }
      );
    });
  },

  /**
   * Checks the current permission status for Geolocation.
   */
  async checkPermissionStatus(): Promise<PermissionState> {
    if (!navigator.permissions) return 'prompt';
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as any });
      return status.state;
    } catch {
      return 'prompt';
    }
  }
};
