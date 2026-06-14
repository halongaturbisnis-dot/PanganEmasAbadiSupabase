import { useState, useEffect, useCallback } from 'react';
import { locationService, LocationData } from '../services/locationService';

/**
 * HOOKS/USELOCATION.TS
 * Custom hook to manage location state and permissions.
 */
export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');

  const updatePermission = useCallback(async () => {
    const status = await locationService.checkPermissionStatus();
    setPermissionStatus(status);
  }, []);

  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pos = await locationService.getCurrentPosition();
      setLocation(pos);
      await updatePermission();
      return pos;
    } catch (err: any) {
      const msg = err.message || 'Gagal mendeteksi lokasi';
      setError(msg);
      await updatePermission();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updatePermission]);

  useEffect(() => {
    updatePermission();
    
    // Listen for permission changes if supported
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as any }).then(status => {
        status.onchange = () => setPermissionStatus(status.state);
      });
    }
  }, [updatePermission]);

  return {
    location,
    isLoading,
    error,
    permissionStatus,
    getLocation,
  };
}
