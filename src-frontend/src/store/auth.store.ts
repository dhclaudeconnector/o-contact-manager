// Path: src-frontend/src/store/auth.store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEY_API } from '@/constants/config'

interface AuthState {
  apiKey: string | null
  isAuthenticated: boolean
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: null,
      isAuthenticated: false,
      setApiKey: (key: string) =>
        set({ apiKey: key, isAuthenticated: !!key }),
      clearApiKey: () =>
        set({ apiKey: null, isAuthenticated: false }),
    }),
    {
      name: STORAGE_KEY_API,
      partialize: (state) => ({ apiKey: state.apiKey }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.apiKey
        }
      },
    }
  )
)
