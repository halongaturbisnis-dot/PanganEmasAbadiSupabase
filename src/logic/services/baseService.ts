import { apiClient } from '../api/client';
import { PaginatedResponse, ApiResponse } from '../types/app';
import { getPageFetchLimit } from './fetchingCenter';

/**
 * SERVICES/BASESERVICE.TS
 * A generic CRUD service template with enhanced standard methods.
 */

export interface RequestOptions {
  columns?: string[];
  signal?: AbortSignal;
  params?: Record<string, string>;
  pageKey?: string; // Identifier for fetchingCenter limits
}

export class BaseService<T> {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  private buildParams(options?: RequestOptions): Record<string, string> {
    const params = { ...(options?.params || {}) };
    if (options?.columns && options.columns.length > 0) {
      params['select'] = options.columns.join(',');
    }
    return params;
  }

  async getAll(options?: RequestOptions): Promise<T[]> {
    return apiClient.get<T[]>(this.endpoint, this.buildParams(options), options?.signal);
  }

  async getPaginated(page: number = 1, requestedLimit?: number, options?: RequestOptions): Promise<PaginatedResponse<T>> {
    // Determine limit: requestedLimit > pageKey config > default
    const limit = requestedLimit || (options?.pageKey ? getPageFetchLimit(options.pageKey) : getPageFetchLimit('DEFAULT'));
    
    return apiClient.get<PaginatedResponse<T>>(this.endpoint, {
      ...this.buildParams(options),
      page: page.toString(),
      limit: limit.toString(),
    }, options?.signal);
  }

  async getById(id: string | number, options?: RequestOptions): Promise<T> {
    return apiClient.get<T>(`${this.endpoint}/${id}`, this.buildParams(options), options?.signal);
  }

  async create(data: Partial<T>, options?: RequestOptions): Promise<T> {
    return apiClient.post<T>(this.endpoint, data, options?.signal);
  }

  async update(id: string | number, data: Partial<T>, options?: RequestOptions): Promise<T> {
    return apiClient.put<T>(`${this.endpoint}/${id}`, data, options?.signal);
  }

  async delete(id: string | number, options?: RequestOptions): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`, options?.signal);
  }

  /**
   * Toggles the 'is_active' status of an entity if it exists
   */
  async toggleActive(id: string | number, currentStatus: boolean): Promise<ApiResponse<T>> {
    return apiClient.put<ApiResponse<T>>(`${this.endpoint}/${id}/status`, {
      is_active: !currentStatus
    });
  }
}
