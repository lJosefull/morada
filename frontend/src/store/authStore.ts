import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<{
            accessToken: string;
            user: User;
          }>('/auth/login', { email, password });
          
          set({
            token: response.accessToken,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<{
            accessToken: string;
            user: User;
          }>('/auth/register', { email, password, name });
          
          set({
            token: response.accessToken,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      fetchProfile: async () => {
        try {
          const user = await apiClient.get<User>('/auth/profile');
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false, token: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);