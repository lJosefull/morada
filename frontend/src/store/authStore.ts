import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, ApiError } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  token?: string; // Alternative field name for access token
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/login', { email, password });

          // Handle both response formats for backend compatibility
          const accessToken = response.accessToken || response.token || '';
          const refreshToken = response.refreshToken || '';
          const user = response.user;

          if (!accessToken || !refreshToken || !user) {
            throw new Error('Invalid response from server: missing authentication data');
          }

          api.setAuthData(accessToken, refreshToken, user);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : (error as ApiError)?.message || 'Login failed. Please check your credentials.';
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/register', { email, password, name });

          // Handle both response formats for backend compatibility
          const accessToken = response.accessToken || response.token || '';
          const refreshToken = response.refreshToken || '';
          const user = response.user;

          if (!accessToken || !refreshToken || !user) {
            throw new Error('Invalid response from server: missing authentication data');
          }

          api.setAuthData(accessToken, refreshToken, user);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : (error as ApiError)?.message || 'Registration failed. Please try again.';
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        api.logout();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const { user } = get();
        if (!user) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            set({ user: null, isAuthenticated: false });
            return;
          }

          // Verify token is still valid by fetching user profile
          // Handle both response formats: direct User object or wrapped response
          const response = await api.get<unknown>('/auth/profile');
          
          let userData: User;
          if (typeof response === 'object' && response !== null && 'user' in (response as Record<string, unknown>)) {
            // Response is wrapped: { user: User }
            userData = (response as { user: User }).user;
          } else {
            // Response is the User object directly
            userData = response as User;
          }

          if (userData && userData.id) {
            set({ user: userData, isAuthenticated: true });
          } else {
            throw new Error('Invalid user data');
          }
        } catch {
          set({ user: null, isAuthenticated: false });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);