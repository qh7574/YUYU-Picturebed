import { create } from 'zustand'

interface SelectionState {
  selectedItems: Set<string>
  toggleSelection: (key: string) => void
  selectAll: (keys: string[]) => void
  clearSelection: () => void
  isSelected: (key: string) => boolean
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedItems: new Set<string>(),

  toggleSelection: (key: string) =>
    set((state) => {
      const newSet = new Set(state.selectedItems)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return { selectedItems: newSet }
    }),

  selectAll: (keys: string[]) =>
    set({ selectedItems: new Set(keys) }),

  clearSelection: () => set({ selectedItems: new Set() }),

  isSelected: (key: string) => get().selectedItems.has(key),
}))
