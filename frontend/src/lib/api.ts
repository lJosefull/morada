```ts  
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';  
import { useAuthStore } from '../stores/authStore';  

interface ApiError {  
  message: string;  
  statusCode: number;  
  errors?: Record<string, string[]>;  
}  

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';  

class ApiClient {  
  private client: AxiosInstance;  
  private isRefreshing = false;  
  private failedQueue: Array<{  
    resolve: (value: AxiosResponse) => void;  
    reject: (error: unknown) => void;  
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
      async (error: AxiosError<ApiError>) => {  
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };  

        if (error.response?.status === 401 && !originalRequest._retry) {  
          if (this.isRefreshing) {  
            return new Promise<AxiosResponse>((resolve, reject) => {  
              this.failedQueue.push({ resolve, reject });  
            }).then((response) => {  
              return response;  
            });  
          }  

          originalRequest._retry = true;  
          this.isRefreshing = true;  

          try {  
            const refreshToken = useAuthStore.getState().refreshToken;  
            if (!refreshToken) {  
              throw new Error('No refresh token available');  
            }  

            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {  
              refreshToken,  
            });  

            const { accessToken } = response.data;  
            useAuthStore.getState().setAccessToken(accessToken);  

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

        // Handle other errors  
        const errorMessage = this.extractErrorMessage(error);  
        return Promise.reject(new Error(errorMessage));  
      }  
    );  
  }  

  private processQueue(error: unknown, token: string | null): void {  
    this.failedQueue.forEach(({ resolve, reject }) => {  
      if (error) {  
        reject(error);  
      } else if (token) {  
        resolve(token as unknown as AxiosResponse);  
      }  
    });  
    this.failedQueue = [];  
  }  

  private extractErrorMessage(error: AxiosError<ApiError>): string {  
    if (error.response?.data?.message) {  
      return error.response.data.message;  
    }  
    if (error.message === 'Network Error') {  
      return 'Unable to connect to the server. Please check your internet connection.';  
    }  
    if (error.code === 'ECONNABORTED') {  
      return 'Request timed out. Please try again.';  
    }  
    return error.message || 'An unexpected error occurred';  
  }  

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {  
    try {  
      const response = await this.client.get<T>(url, config);  
      return response.data;  
    } catch (error) {  
      throw this.normalizeError(error);  
    }  
  }  

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {  
    try {  
      const response = await this.client.post<T>(url, data, config);  
      return response.data;  
    } catch (error) {  
      throw this.normalizeError(error);  
    }  
  }  

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {  
    try {  
      const response = await this.client.put<T>(url, data, config);  
      return response.data;  
    } catch (error) {  
      throw this.normalizeError(error);  
    }  
  }  

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {  
    try {  
      const response = await this.client.patch<T>(url, data, config);  
      return response.data;  
    } catch (error) {  
      throw this.normalizeError(error);  
    }  
  }  

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {  
    try {  
      const response = await this.client.delete<T>(url, config);  
      return response.data;  
    } catch (error) {  
      throw this.normalizeError(error);  
    }  
  }  

  private normalizeError(error: unknown): Error {  
    if (error instanceof AxiosError) {  
      const message = this.extractErrorMessage(error);  
      return new Error(message);  
    }  
    if (error instanceof Error) {  
      return error;  
    }  
    return new Error('An unexpected error occurred');  
  }  
}  

export const apiClient = new ApiClient();  
export default apiClient;  
```