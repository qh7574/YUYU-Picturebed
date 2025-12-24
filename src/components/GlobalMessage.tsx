import { useEffect } from 'react'
import { message as antdMessage } from 'antd'
import { useMessageStore, type Message } from '../stores/messageStore'

/**
 * 全局消息组件
 * 使用Ant Design的message API显示全局消息
 */
export function GlobalMessage() {
  const messages = useMessageStore((state) => state.messages)
  const removeMessage = useMessageStore((state) => state.removeMessage)

  useEffect(() => {
    // 为每个新消息显示Ant Design的message
    messages.forEach((msg: Message) => {
      const key = msg.id

      switch (msg.type) {
        case 'success':
          antdMessage.success({
            content: msg.content,
            key,
            duration: (msg.duration || 3000) / 1000,
            onClose: () => removeMessage(msg.id),
          })
          break
        case 'error':
          antdMessage.error({
            content: msg.content,
            key,
            duration: (msg.duration || 5000) / 1000,
            onClose: () => removeMessage(msg.id),
          })
          break
        case 'info':
          antdMessage.info({
            content: msg.content,
            key,
            duration: (msg.duration || 3000) / 1000,
            onClose: () => removeMessage(msg.id),
          })
          break
        case 'warning':
          antdMessage.warning({
            content: msg.content,
            key,
            duration: (msg.duration || 3000) / 1000,
            onClose: () => removeMessage(msg.id),
          })
          break
        case 'loading':
          antdMessage.loading({
            content: msg.content,
            key,
            duration: 0, // loading消息不自动关闭
          })
          break
      }
    })
  }, [messages, removeMessage])

  // 这个组件不渲染任何内容，只是用来触发副作用
  return null
}
