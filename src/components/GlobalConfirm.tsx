import { Modal } from 'antd'
import { useConfirmStore } from '../stores/confirmStore'

/**
 * 全局确认对话框组件
 */
export function GlobalConfirm() {
  const visible = useConfirmStore((state) => state.visible)
  const options = useConfirmStore((state) => state.options)
  const loading = useConfirmStore((state) => state.loading)
  const handleOk = useConfirmStore((state) => state.handleOk)
  const handleCancel = useConfirmStore((state) => state.handleCancel)

  if (!options) return null

  return (
    <Modal
      open={visible}
      title={options.title}
      okText={options.okText || '确定'}
      cancelText={options.cancelText || '取消'}
      okButtonProps={{
        danger: options.okType === 'danger',
        loading,
      }}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={!loading}
      closable={!loading}
    >
      {options.content}
    </Modal>
  )
}
