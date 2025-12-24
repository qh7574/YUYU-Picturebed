import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  content: string
  okText?: string
  cancelText?: string
  okType?: 'primary' | 'danger'
  onOk?: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmState {
  visible: boolean
  options: ConfirmOptions | null
  loading: boolean
  showConfirm: (options: ConfirmOptions) => void
  hideConfirm: () => void
  setLoading: (loading: boolean) => void
  handleOk: () => Promise<void>
  handleCancel: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  visible: false,
  options: null,
  loading: false,

  showConfirm: (options: ConfirmOptions) => {
    set({ visible: true, options, loading: false })
  },

  hideConfirm: () => {
    set({ visible: false, options: null, loading: false })
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },

  handleOk: async () => {
    const { options, hideConfirm, setLoading } = get()
    if (!options?.onOk) {
      hideConfirm()
      return
    }

    try {
      setLoading(true)
      await options.onOk()
      hideConfirm()
    } catch (error) {
      console.error('确认操作失败:', error)
      setLoading(false)
      throw error
    }
  },

  handleCancel: () => {
    const { options, hideConfirm } = get()
    options?.onCancel?.()
    hideConfirm()
  },
}))

// 导出便捷的确认函数
export const confirm = (options: ConfirmOptions) => {
  useConfirmStore.getState().showConfirm(options)
}
