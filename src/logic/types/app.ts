/**
 * Global App Types
 */

export interface EntityBase {
  id: string;
  created_at?: string;
  created_by?: string;
  created_timezone?: string;
  updated_at?: string;
  updated_by?: string;
  updated_timezone?: string;
  deleted_at?: string | null;
}

export interface User extends EntityBase {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
  is_active: boolean;
  last_login?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    perPage: number;
  };
}

export interface AppConfig {
  apiUrl: string;
  isProduction: boolean;
  version: string;
}
