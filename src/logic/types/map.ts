/**
 * Type definitions for Map related data
 */

export interface MapPoint {
  id: string | number;
  lat: number;
  lng: number;
  timestamp: string; // ISO string
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RouteData {
  id: string | number;
  userId: string | number;
  userName?: string;
  date: string;
  points: MapPoint[];
}
