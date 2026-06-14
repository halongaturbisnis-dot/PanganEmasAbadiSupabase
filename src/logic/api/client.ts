/**
 * API/CLIENT.TS
 * Standardized API client for all network requests.
 * Supports interceptors, token management, and structured error handling.
 */

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined' && window.localStorage) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

export const apiClient = {
  get: async <T>(url: string, params?: Record<string, string>, signal?: AbortSignal): Promise<T> => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = new URL(url, baseUrl || undefined);
    if (params) {
      Object.entries(params).forEach(([key, value]) => fullUrl.searchParams.append(key, value));
    }
    
    const res = await fetch(fullUrl.toString(), { 
      headers: getHeaders(),
      signal 
    });
    return handleResponse<T>(res);
  },
  
  post: async <T>(url: string, data: any, signal?: AbortSignal): Promise<T> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
      signal
    });
    return handleResponse<T>(res);
  },

  put: async <T>(url: string, data: any, signal?: AbortSignal): Promise<T> => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
      signal
    });
    return handleResponse<T>(res);
  },

  delete: async <T>(url: string, signal?: AbortSignal): Promise<T> => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
      signal
    });
    return handleResponse<T>(res);
  },
};

/**
 * Common Response Handler
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Global Interceptor: Handle 401 Unauthorized
  if (response.status === 401) {
    console.warn('API Client: Session expired or unauthorized.');
    // Logic for redirection to login can be added here
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
