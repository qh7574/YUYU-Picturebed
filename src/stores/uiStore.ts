import { create } from 'zustand'
import { storageService } from '../services/storageService'

interface UIState {
  theme: 'light' | 'dark'
  uploadModalVisible: boolean
  settingsModalVisible: boolean
  viewerVisible: boolean
  currentImageIndex: number
  renameModalVisible: boolean
  moveModalVisible: boolean
  createFolderModalVisible: boolean
  currentOperationItem: { key: string; name: string } | null
  toggleTheme: () => void
  showUploadModal: () => void
  hideUploadModal: () => void
  showSettingsModal: () => void
  hideSettingsModal: () => void
  showViewer: (index: number) => void
  hideViewer: () => void
  setCurrentImageIndex: (index: number) => void
  loadThemeFromStorage: () => void
  showRenameModal: (item: { key: string; name: string }) => void
  hideRenameModal: () => void
  showMoveModal: (item: { key: string; name: string }) => void
  hideMoveModal: () => void
  showCreateFolderModal: () => void
  hideCreateFolderModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  uploadModalVisible: false,
  settingsModalVisible: false,
  viewerVisible: false,
  currentImageIndex: 0,
  renameModalVisible: false,
  moveModalVisible: false,
  createFolderModalVisible: false,
  currentOperationItem: null,

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      // 保存主题到存储
      storageService.saveTheme(newTheme)
      return { theme: newTheme }
    }),

  showUploadModal: () => set({ uploadModalVisible: true }),
  hideUploadModal: () => set({ uploadModalVisible: false }),

  showSettingsModal: () => set({ settingsModalVisible: true }),
  hideSettingsModal: () => set({ settingsModalVisible: false }),

  showViewer: (index: number) =>
    set({ viewerVisible: true, currentImageIndex: index }),
  hideViewer: () => set({ viewerVisible: false }),

  setCurrentImageIndex: (index: number) => set({ currentImageIndex: index }),

  loadThemeFromStorage: () => {
    const theme = storageService.loadTheme()
    set({ theme })
  },

  showRenameModal: (item: { key: string; name: string }) =>
    set({ renameModalVisible: true, currentOperationItem: item }),
  hideRenameModal: () =>
    set({ renameModalVisible: false, currentOperationItem: null }),

  showMoveModal: (item: { key: string; name: string }) =>
    set({ moveModalVisible: true, currentOperationItem: item }),
  hideMoveModal: () =>
    set({ moveModalVisible: false, currentOperationItem: null }),

  showCreateFolderModal: () => set({ createFolderModalVisible: true }),
  hideCreateFolderModal: () => set({ createFolderModalVisible: false }),
}))
