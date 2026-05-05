import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../types/auth';
import { api } from '../lib/api';

// API base paths for auth
const AUTH_API_PATH = '/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<AuthResponse>(`${AUTH_API_PATH}/login`, credentials);
          set({
            user: response.user,
            token: response.access_token,
            refreshToken: response.refresh_token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<AuthResponse>(`${AUTH_API_PATH}/register`, data);
          set({
            user: response.user,
            token: response.access_token,
            refreshToken: response.refresh_token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      logout: () => {
        // Optionally call backend logout endpoint to invalidate refresh token
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            // Fire and forget - don't block logout on API failure
            api.post(`${AUTH_API_PATH}/logout`, { refreshToken }).catch(() => {
              // Silently fail - we're logging out anyway
            });
          } catch {
            // Ignore errors during logout
          }
        }
        
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      setToken: (token: string) => {
        set({ token });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          set({ isLoading: true });
          // Verify token by fetching user profile
          const user = await api.get<User>(`${AUTH_API_PATH}/profile`);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // If profile fetch fails, check if it's a 401 and try refresh
          const err = error as Error & { status?: number };
          if (err.status === 401) {
            // Token might be expired, try refresh flow
            const { refreshToken } = get();
            if (refreshToken) {
              try {
                const response = await api.post<AuthResponse>(`${AUTH_API_PATH}/refresh`, {
                  refreshToken,
                });
                set({
                  token: response.access_token,
                  refreshToken: response.refresh_token || null,
                  user: response.user,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              } catch {
                // Refresh failed, clear auth
              }
            }
          }
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);