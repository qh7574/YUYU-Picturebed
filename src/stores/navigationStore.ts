import { create } from 'zustand'

interface NavigationState {
  currentPath: string
  pathHistory: string[]
  navigate: (path: string) => void
  goBack: () => void
  goToPath: (path: string) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPath: '',
  pathHistory: [],

  navigate: (path: string) =>
    set((state) => ({
      currentPath: path,
      pathHistory: [...state.pathHistory, state.currentPath],
    })),

  goBack: () =>
    set((state) => {
      const newHistory = [...state.pathHistory]
      const previousPath = newHistory.pop() ?? ''
      return {
        currentPath: previousPath,
        pathHistory: newHistory,
      }
    }),

  goToPath: (path: string) =>
    set({
      currentPath: path,
      pathHistory: [],
    }),
}))
