import { create } from 'zustand'

export type MessageType = 'success' | 'error' | 'info' | 'warning' | 'loading'

export interface Message {
  id: string
  type: MessageType
  content: string
  duration?: number
}

interface MessageState {
  messages: Message[]
  addMessage: (type: MessageType, content: string, duration?: number) => string
  removeMessage: (id: string) => void
  success: (content: string, duration?: number) => void
  error: (content: string, duration?: number) => void
  info: (content: string, duration?: number) => void
  warning: (content: string, duration?: number) => void
  loading: (content: string) => string
}

let messageIdCounter = 0

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],

  addMessage: (type: MessageType, content: string, duration = 3000) => {
    const id = `message-${++messageIdCounter}`
    const message: Message = { id, type, content, duration }
    
    set((state) => ({
      messages: [...state.messages, message],
    }))

    // 自动移除消息（loading类型除外）
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id),
        }))
      }, duration)
    }

    return id
  },

  removeMessage: (id: string) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }))
  },

  success: (content: string, duration?: number) => {
    return get().addMessage('success', content, duration)
  },

  error: (content: string, duration = 5000) => {
    return get().addMessage('error', content, duration)
  },

  info: (content: string, duration?: number) => {
    return get().addMessage('info', content, duration)
  },

  warning: (content: string, duration?: number) => {
    return get().addMessage('warning', content, duration)
  },

  loading: (content: string): string => {
    return get().addMessage('loading', content, 0)
  },
}))

// 导出便捷的消息函数
export const message = {
  success: (content: string, duration?: number) => {
    useMessageStore.getState().success(content, duration)
  },
  error: (content: string, duration?: number) => {
    useMessageStore.getState().error(content, duration)
  },
  info: (content: string, duration?: number) => {
    useMessageStore.getState().info(content, duration)
  },
  warning: (content: string, duration?: number) => {
    useMessageStore.getState().warning(content, duration)
  },
  loading: (content: string) => {
    return useMessageStore.getState().loading(content)
  },
  destroy: (id: string) => {
    useMessageStore.getState().removeMessage(id)
  },
}
