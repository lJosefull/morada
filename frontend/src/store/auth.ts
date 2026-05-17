import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; name: string }) => Promise<void>
  logout: () => void
  setTokens: (accessToken: string, refreshToken: string) => void
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
            '/auth/login', { email, password },
          )
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
          await get().fetchUser()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      register: async (input) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
            '/auth/register', input,
          )
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
          await get().fetchUser()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Registration failed'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, error: null })
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken })
      },

      fetchUser: async () => {
        set({ isLoading: true })
        try {
          const { data } = await api.get<User>('/auth/profile')
          set({ user: data, isLoading: false, error: null })
        } catch {
          set({ isLoading: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
