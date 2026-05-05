import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
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
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // FIX: The backend expects the refresh token in the body as { refreshToken: string }
            // and returns { accessToken, refreshToken } directly, not nested in tokens object
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            // FIX: Handle both possible response structures
            let accessToken: string;
            let newRefreshToken: string;
            
            if (response.data.tokens) {
              // Backend returns { tokens: { accessToken, refreshToken } }
              accessToken = response.data.tokens.accessToken;
              newRefreshToken = response.data.tokens.refreshToken;
            } else if (response.data.accessToken) {
              // Backend returns { accessToken, refreshToken } directly
              accessToken = response.data.accessToken;
              newRefreshToken = response.data.refreshToken;
            } else {
              throw new Error('Invalid refresh token response structure');
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

        return Promise.reject(error);
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

  // Generic request methods with error handling
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<T>(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      // FIX: Handle nested error messages from backend
      const responseData = error.response?.data;
      let message = 'An unexpected error occurred';
      
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.message) {
          message = Array.isArray(responseData.message) 
            ? responseData.message.join(', ') 
            : responseData.message;
        } else if (responseData.error) {
          message = typeof responseData.error === 'string' 
            ? responseData.error 
            : responseData.error.message || 'An unexpected error occurred';
        }
      } else {
        message = error.message || 'Network error';
      }
      
      const status = error.response?.status || 500;
      
      // Create a structured error
      const apiError = {
        status,
        message,
        errors: responseData?.errors || [],
        code: responseData?.code || 'UNKNOWN_ERROR',
      };
      
      throw apiError;
    }
    throw { status: 500, message: 'Network error', errors: [], code: 'NETWORK_ERROR' };
  }
}

export const api = new ApiClient();