import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api`
        : '/api',
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

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
            if (!refreshToken) throw new Error('No refresh token available');

            const { data } = await this.client.post('/auth/refresh', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = data;

            if (!accessToken || !newRefreshToken) {
              throw new Error('Invalid token response');
            }

            useAuthStore.getState().setTokens(accessToken, newRefreshToken);
            this.processQueue(null, accessToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        const errorMessage = this.getErrorMessage(error);
        return Promise.reject(new Error(errorMessage));
      },
    );
  }

  private processQueue(error: unknown, token: string | null): void {
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
    if (error.response) {
      const data = error.response.data as any;
      if (data?.message) {
        return Array.isArray(data.message) ? data.message[0] : data.message;
      }
      switch (error.response.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Session expired. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'Conflict. The resource already exists.';
        case 422:
          return 'Validation error. Please check your input.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Internal server error. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    } else if (error.request) {
      return 'Network error. Please check your connection.';
    }
    return error.message || 'An unexpected error occurred.';
  }

  // Public API methods
  async get<T>(url: string, config?: InternalAxiosRequestConfig): Promise<{ data: T }> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<{ data: T }> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<{ data: T }> {
    return this.client.put(url, data, config);
  }

  async patch<T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig): Promise<{ data: T }> {
    return this.client.patch(url, data, config);
  }

  async delete<T>(url: string, config?: InternalAxiosRequestConfig): Promise<{ data: T }> {
    return this.client.delete(url, config);
  }
}

export const api = new ApiClient();