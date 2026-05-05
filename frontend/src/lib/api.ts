import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

// API response types
interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

// Default retry configuration
const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status <= 599);
  },
};

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };
    
    // Handle 401 Unauthorized - try token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const response = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );
          
          const { token } = response.data;
          useAuthStore.getState().setToken(token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // Could redirect to unauthorized page
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.response.data);
    }
    
    // Handle network errors with retry logic
    if (!error.response && originalRequest) {
      const retryConfig = defaultRetryConfig;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      if (originalRequest._retryCount <= retryConfig.retries) {
        const delay = retryConfig.retryDelay * Math.pow(2, originalRequest._retryCount - 1);
        
        console.warn(
          `Retrying request (${originalRequest._retryCount}/${retryConfig.retries}) after ${delay}ms`
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }
    
    // Transform error for consistent error handling
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status || 500,
      error: error.response?.data?.error,
    };
    
    return Promise.reject(apiError);
  }
);

// API helper methods
export const api = {
  get: <T>(url: string, config?: InternalAxiosRequestConfig) => 
    apiClient.get<T>(url, config),
    
  post: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) => 
    apiClient.post<T>(url, data, config),
    
  put: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) => 
    apiClient.put<T>(url, data, config),
    
  patch: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config),
    
  delete: <T>(url: string, config?: InternalAxiosRequestConfig) => 
    apiClient.delete<T>(url, config),
};

// Export types for use in other files
export type { ApiError, RetryConfig };
export default apiClient;