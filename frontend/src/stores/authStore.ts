import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          // FIX: The backend might return the response in a different structure
          // Handle both { user, tokens } and { data: { user, tokens } } patterns
          const response = await api.post<AuthResponse>('/auth/login', credentials);
          
          // FIX: Handle potential nested response
          const authData = (response as any).data || response;
          
          set({
            user: authData.user,
            accessToken: authData.tokens.accessToken,
            refreshToken: authData.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          // FIX: Handle potential nested response
          const response = await api.post<AuthResponse>('/auth/register', data);
          const authData = (response as any).data || response;
          
          set({
            user: authData.user,
            accessToken: authData.tokens.accessToken,
            refreshToken: authData.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registration failed',
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        // FIX: Call backend logout endpoint to invalidate tokens
        try {
          const refreshToken = get().refreshToken;
          if (refreshToken) {
            // Fire and forget - don't block logout
            api.post('/auth/logout', { refreshToken }).catch(() => {});
          }
        } catch {
          // Ignore errors during logout
        }
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        // Clear persisted state
        localStorage.removeItem('auth-storage');
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      clearError: () => {
        set({ error: null });
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          // FIX: The backend might return the user directly or nested
          const response = await api.get<User>('/auth/me');
          const userData = (response as any).data || response;
          
          set({ user: userData, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch user',
            isAuthenticated: false,
            user: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);