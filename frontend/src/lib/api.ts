import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private instance: AxiosInstance;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
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

    // Response interceptor for token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Prevent multiple simultaneous refresh attempts
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken();
            }

            const newToken = await this.refreshPromise;
            this.refreshPromise = null;

            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            this.refreshPromise = null;
            // Clear auth state on refresh failure
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors
        if (!error.response) {
          console.error('Network error:', error.message);
          return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refreshToken,
      });

      // FIX: Handle both response formats (data.tokens or data.data.tokens)
      const tokens = response.data?.data?.tokens || response.data?.tokens;
      if (!tokens) {
        console.error('Invalid refresh response format:', response.data);
        return null;
      }

      const { accessToken, refreshToken: newRefreshToken } = tokens;
      useAuthStore.getState().setTokens(accessToken, newRefreshToken);
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  // Public API methods
  public get<T = any>(url: string, config?: any): Promise<{ data: T }> {
    return this.instance.get(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return this.instance.post(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return this.instance.put(url, data, config);
  }

  public patch<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return this.instance.patch(url, data, config);
  }

  public delete<T = any>(url: string, config?: any): Promise<{ data: T }> {
    return this.instance.delete(url, config);
  }
}

export const api = new ApiClient();