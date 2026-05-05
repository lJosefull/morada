import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Extend AxiosRequestConfig to include _retry property
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
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
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
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // FIX: Changed endpoint from /api/v1/auth/refresh to /api/v1/auth/refresh-token to match backend controller route
            const response = await axios.post(
              `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/auth/refresh-token`,
              { refreshToken }, // FIX: Send refreshToken in body instead of Authorization header
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            // FIX: Handle different response structures - backend returns { accessToken, refreshToken } directly or nested
            const data = response.data;
            const accessToken = data.accessToken || data.tokens?.accessToken;
            const newRefreshToken = data.refreshToken || data.tokens?.refreshToken;
            
            if (!accessToken || !newRefreshToken) {
              throw new Error('Invalid token response structure');
            }
            
            // Update auth store with new tokens
            useAuthStore.getState().setTokens(accessToken, newRefreshToken);

            // Process queued requests
            this.processQueue(null, accessToken);

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Process queue with error
            this.processQueue(refreshError, null);
            
            // Clear auth state and redirect to login
            useAuthStore.getState().logout();
            window.location.href = '/login';
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        const errorMessage = this.getErrorMessage(error);
        return Promise.reject(new Error(errorMessage));
      }
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