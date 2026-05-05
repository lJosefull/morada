import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>
  logout: () => void
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        set({
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        })
        await get().fetchUser()
      },

      register: async (input) => {
        const { data } = await api.post('/auth/register', input)
        set({
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        })
        await get().fetchUser()
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null })
      },

      setTokens: (tokens) => {
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
      },

      fetchUser: async () => {
        set({ isLoading: true })
        try {
          const { data } = await api.get('/users/me')
          set({ user: data, isLoading: false })
        } catch {
          set({ isLoading: false })
        }
      },
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
