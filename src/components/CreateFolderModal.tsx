import { Modal, Input, Form } from 'antd'
import { FolderAddOutlined } from '@ant-design/icons'

interface CreateFolderModalProps {
  visible: boolean
  loading: boolean
  onOk: (folderName: string) => void
  onCancel: () => void
  isDark: boolean
}

export function CreateFolderModal({
  visible,
  loading,
  onOk,
  onCancel,
  isDark,
}: CreateFolderModalProps) {
  const [form] = Form.useForm()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      await onOk(values.folderName)
      // 只在成功时重置表单
      form.resetFields()
    } catch (error) {
      // 表单验证失败或创建失败，不重置表单
      console.error('操作失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  // 当弹窗关闭时重置表单
  const handleAfterClose = () => {
    form.resetFields()
  }

  return (
    <Modal
      title={
        <span>
          <FolderAddOutlined className="mr-2" />
          新建文件夹
        </span>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      afterClose={handleAfterClose}
      confirmLoading={loading}
      okText="确定"
      cancelText="取消"
      className={isDark ? 'dark-modal' : ''}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          name="folderName"
          label="文件夹名称"
          rules={[
            { required: true, message: '请输入文件夹名称' },
            { 
              pattern: /^[^/\\:*?"<>|]+$/, 
              message: '文件夹名称不能包含特殊字符: / \\ : * ? " < > |' 
            },
          ]}
        >
          <Input
            placeholder="请输入文件夹名称"
            autoFocus
            onPressEnter={handleOk}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
