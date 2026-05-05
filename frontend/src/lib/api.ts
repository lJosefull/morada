import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${newToken}`,
              };
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, logout user
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Transform error to ApiError
        const status = error.response?.status || 500;
        const message = this.getErrorMessage(error);
        const data = error.response?.data;

        return Promise.reject(new ApiError(status, message, data));
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          return null;
        }

        const response = await this.client.post('/auth/refresh', {
          refreshToken,
        });

        const { accessToken } = response.data;
        useAuthStore.getState().setAccessToken(accessToken);
        return accessToken;
      } catch (error) {
        useAuthStore.getState().logout();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any;
      if (data.message) {
        return Array.isArray(data.message) ? data.message[0] : data.message;
      }
    }

    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Unauthorized. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. Resource already exists.';
      case 422:
        return 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async register(data: { email: string; password: string; name: string }) {
    return this.client.post('/auth/register', data);
  }

  async getProfile() {
    return this.client.get('/auth/profile');
  }

  // Properties endpoints
  async getProperties(filters?: {
    type?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return this.client.get(`/properties?${params.toString()}`);
  }

  async getProperty(id: string) {
    return this.client.get(`/properties/${id}`);
  }

  async createProperty(data: FormData | Record<string, any>) {
    const isFormData = data instanceof FormData;
    return this.client.post('/properties', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  }

  async updateProperty(id: string, data: FormData | Record<string, any>) {
    const isFormData = data instanceof FormData;
    return this.client.put(`/properties/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  }

  async deleteProperty(id: string) {
    return this.client.delete(`/properties/${id}`);
  }

  async markPropertyAsSold(id: string) {
    return this.client.post(`/properties/${id}/sold`);
  }

  // Image endpoints
  async uploadImage(propertyId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.client.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async deleteImage(propertyId: string, imageId: string) {
    return this.client.delete(`/properties/${propertyId}/images/${imageId}`);
  }

  async setPrimaryImage(propertyId: string, imageId: string) {
    return this.client.put(`/properties/${propertyId}/images/${imageId}/primary`);
  }

  // AI endpoints
  async analyzeProperty(propertyId: string) {
    return this.client.post(`/ai/analyze/${propertyId}`);
  }

  async analyzeImage(imageUrl: string) {
    return this.client.post('/ai/analyze-image', { imageUrl });
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();
export const authApi = {
  login: (email: string, password: string) => api.login(email, password),
  register: (data: { email: string; password: string; name: string }) => api.register(data),
  getProfile: () => api.getProfile(),
};

export const propertiesApi = {
  getAll: (filters?: any) => api.getProperties(filters),
  getById: (id: string) => api.getProperty(id),
  create: (data: any) => api.createProperty(data),
  update: (id: string, data: any) => api.updateProperty(id, data),
  delete: (id: string) => api.deleteProperty(id),
  markAsSold: (id: string) => api.markPropertyAsSold(id),
};

export const imagesApi = {
  upload: (propertyId: string, file: File) => api.uploadImage(propertyId, file),
  delete: (propertyId: string, imageId: string) => api.deleteImage(propertyId, imageId),
  setPrimary: (propertyId: string, imageId: string) => api.setPrimaryImage(propertyId, imageId),
};

export const aiApi = {
  analyzeProperty: (propertyId: string) => api.analyzeProperty(propertyId),
  analyzeImage: (imageUrl: string) => api.analyzeImage(imageUrl),
};

export { ApiError };