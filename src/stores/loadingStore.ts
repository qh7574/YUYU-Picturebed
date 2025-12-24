import { create } from 'zustand'

interface LoadingState {
  loading: boolean
  tip: string
  showLoading: (tip?: string) => void
  hideLoading: () => void
}

export const useLoadingStore = create<LoadingState>((set) => ({
  loading: false,
  tip: '加载中...',

  showLoading: (tip = '加载中...') => {
    set({ loading: true, tip })
  },

  hideLoading: () => {
    set({ loading: false })
  },
}))

// 导出便捷的加载函数
export const loading = {
  show: (tip?: string) => {
    useLoadingStore.getState().showLoading(tip)
  },
  hide: () => {
    useLoadingStore.getState().hideLoading()
  },
}
