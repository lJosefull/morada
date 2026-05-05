import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling with token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (refreshToken) {
              const { data } = await this.client.post('/auth/refresh', { refreshToken });
              const { accessToken, refreshToken: newRefreshToken } = data;
              useAuthStore.getState().setToken(accessToken, newRefreshToken);
              this.processQueue(accessToken, null);
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.client(originalRequest);
            } else {
              // No refresh token available, force logout
              useAuthStore.getState().logout();
              this.processQueue(null, error);
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(null, refreshError);
            useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Transform error messages - handle backend error format
        const message = this.getErrorMessage(error);
        return Promise.reject(new ApiError(message, error.response?.status || 500));
      }
    );
  }

  private processQueue(token: unknown, error: unknown): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as Record<string, unknown>;
      // Handle various backend error formats
      if (typeof data.message === 'string') {
        return data.message;
      }
      if (Array.isArray(data.message)) {
        return (data.message as string[]).join(', ');
      }
      if (typeof data.error === 'string') {
        return data.error;
      }
      if (typeof data.detail === 'string') {
        return data.detail;
      }
    }
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    return error.message || 'An unexpected error occurred';
  }

  // Auth endpoints - FIXED: Added /api prefix to match backend routes
  async login(email: string, password: string) {
    const { data } = await this.client.post('/api/auth/login', { email, password });
    return data;
  }

  async register(email: string, password: string, name: string) {
    const { data } = await this.client.post('/api/auth/register', { email, password, name });
    return data;
  }

  async refreshToken(refreshToken: string) {
    const { data } = await this.client.post('/api/auth/refresh', { refreshToken });
    return data;
  }

  // Property endpoints - FIXED: Added /api prefix to match backend routes
  async getProperties(params?: Record<string, string>) {
    const { data } = await this.client.get('/api/properties', { params });
    return data;
  }

  async getProperty(id: string) {
    const { data } = await this.client.get(`/api/properties/${id}`);
    return data;
  }

  async createProperty(propertyData: {
    title: string;
    description: string;
    price: number;
    address: string;
    status?: string;
  }) {
    const { data } = await this.client.post('/api/properties', propertyData);
    return data;
  }

  async updateProperty(id: string, propertyData: Partial<{
    title: string;
    description: string;
    price: number;
    address: string;
    status: string;
  }>) {
    const { data } = await this.client.put(`/api/properties/${id}`, propertyData);
    return data;
  }

  async deleteProperty(id: string) {
    const { data } = await this.client.delete(`/api/properties/${id}`);
    return data;
  }

  // Generic request methods
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const { data } = await this.client.get<T>(url, { params });
    return data;
  }

  async post<T>(url: string, body?: unknown): Promise<T> {
    const { data } = await this.client.post<T>(url, body);
    return data;
  }

  async put<T>(url: string, body?: unknown): Promise<T> {
    const { data } = await this.client.put<T>(url, body);
    return data;
  }

  async delete<T>(url: string): Promise<T> {
    const { data } = await this.client.delete<T>(url);
    return data;
  }
}

export class ApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const api = new ApiClient();
export default api;