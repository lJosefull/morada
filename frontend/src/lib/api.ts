import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: AxiosResponse | unknown) => void;
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
      (config: AxiosRequestConfig) => {
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

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              // token is now a string from processQueue
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
              const response = await this.client.post('/auth/refresh', {
                refreshToken,
              });
              const { access_token } = response.data;
              useAuthStore.getState().setToken(access_token);

              // Process queue with the new token string
              this.processQueue(null, access_token);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
              }
              return this.client(originalRequest);
            } else {
              // No refresh token available, force logout
              this.processQueue(new Error('No refresh token available'), null);
              useAuthStore.getState().logout();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(refreshError as Error, null);
            useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle specific error codes with structured error messages
        if (error.response) {
          const { status, data } = error.response;
          const errorData = data as { message?: string; errors?: Record<string, string[]> };
          const message = errorData?.message || this.getDefaultErrorMessage(status);

          // Create a structured error with status code for better frontend handling
          const enhancedError = new Error(message) as Error & { status?: number; data?: unknown };
          enhancedError.status = status;
          enhancedError.data = errorData;
          
          switch (status) {
            case 400:
              console.error('Bad Request:', message, errorData?.errors);
              break;
            case 401:
              console.error('Unauthorized:', message);
              break;
            case 403:
              console.error('Forbidden:', message);
              break;
            case 404:
              console.error('Not Found:', message);
              break;
            case 409:
              console.error('Conflict:', message);
              break;
            case 422:
              console.error('Validation Error:', message, errorData?.errors);
              break;
            case 429:
              console.error('Rate Limit Exceeded');
              break;
            case 500:
              console.error('Server Error:', message);
              break;
            default:
              console.error(`HTTP Error ${status}:`, message);
          }
          
          return Promise.reject(enhancedError);
        } else if (error.request) {
          console.error('Network Error: No response received');
          const networkError = new Error('Network error. Please check your connection.') as Error & { status?: number };
          networkError.status = 0;
          return Promise.reject(networkError);
        }

        return Promise.reject(error);
      }
    );
  }

  private getDefaultErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'A conflict occurred. The resource may have been modified.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
    };
    return messages[status] || 'An unexpected error occurred';
  }

  private processQueue(error: Error | null, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        // Resolve with the token string directly
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();