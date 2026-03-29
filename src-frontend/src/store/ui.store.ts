// Path: src-frontend/src/store/ui.store.ts

import { create } from 'zustand'

export type ViewMode = 'list' | 'grid'
export type ActivePanel = 'list' | 'detail' | 'form'

interface UIState {
  sidebarOpen: boolean
  viewMode: ViewMode
  selectedContactId: string | null
  activePanel: ActivePanel
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setViewMode: (mode: ViewMode) => void
  setSelectedContactId: (id: string | null) => void
  setActivePanel: (panel: ActivePanel) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  viewMode: 'list',
  selectedContactId: null,
  activePanel: 'list',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedContactId: (id) =>
    set({ selectedContactId: id, activePanel: id ? 'detail' : 'list' }),
  setActivePanel: (panel) => set({ activePanel: panel }),
}))
