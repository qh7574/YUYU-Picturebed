import { create } from 'zustand'

interface CorsState {
  corsAvailable: boolean | null // null = 未测试, true = 可用, false = 不可用
  corsErrorShown: boolean // 是否已显示过错误提示
  setCorsAvailable: (available: boolean) => void
  setCorsErrorShown: (shown: boolean) => void
  resetCorsState: () => void
}

export const useCorsStore = create<CorsState>((set) => ({
  corsAvailable: null,
  corsErrorShown: false,
  
  setCorsAvailable: (available: boolean) => set({ corsAvailable: available }),
  
  setCorsErrorShown: (shown: boolean) => set({ corsErrorShown: shown }),
  
  // 页面刷新时重置状态，重新测试 CORS
  resetCorsState: () => set({ corsAvailable: null, corsErrorShown: false }),
}))
