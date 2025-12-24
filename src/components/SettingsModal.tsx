import { useState } from 'react'
import { Modal, Form, Input, Button, message, Space, Upload, InputNumber, Select } from 'antd'
import {
  CheckCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import type { S3Config } from '../types'
import { useConfigStore } from '../stores/configStore'
import { useUIStore } from '../stores/uiStore'
import { useGalleryStore } from '../stores/galleryStore'
import { useAppConfigStore } from '../stores/appConfigStore'
import { storageService } from '../services/storageService'

export function SettingsModal() {
  const [form] = Form.useForm<S3Config>()
  const [appForm] = Form.useForm()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const visible = useUIStore((state) => state.settingsModalVisible)
  const hideSettingsModal = useUIStore((state) => state.hideSettingsModal)
  const config = useConfigStore((state) => state.config)
  const saveConfigToStorage = useConfigStore((state) => state.saveConfigToStorage)
  const theme = useUIStore((state) => state.theme)
  const refreshItems = useGalleryStore((state) => state.refreshItems)
  
  const { 
    itemsPerPage, 
    copyFormat, 
    uploadFormat, 
    uploadNameStrategy, 
    uploadTargetPath, 
    uploadCustomPath,
    setItemsPerPage, 
    setCopyFormat,
    setUploadFormat,
    setUploadNameStrategy,
    setUploadTargetPath,
    setUploadCustomPath,
  } = useAppConfigStore()

  const isDark = theme === 'dark'

  // 当Modal打开时，填充现有配置
  const handleOpen = () => {
    if (config) {
      form.setFieldsValue(config)
    }
    // 填充应用配置
    appForm.setFieldsValue({
      itemsPerPage,
      copyFormat,
      uploadFormat,
      uploadNameStrategy,
      uploadTargetPath,
      uploadCustomPath,
    })
  }

  // 测试连接
  const handleTestConnection = async () => {
    try {
      // 先验证表单
      await form.validateFields()
      const values = form.getFieldsValue()

      setTesting(true)
      setTestResult(null)

      // 创建临时S3服务实例进行测试
      const { S3Service } = await import('../services/s3Service')
      const tempService = new S3Service(values)

      const success = await tempService.testConnection()
      tempService.destroy()

      if (success) {
        setTestResult('success')
        message.success('连接测试成功！')
      } else {
        setTestResult('error')
        message.error('连接测试失败，请检查配置')
      }
    } catch (error) {
      setTestResult('error')
      if (error instanceof Error) {
        message.error(`连接测试失败: ${error.message}`)
      } else {
        message.error('连接测试失败，请检查配置')
      }
    } finally {
      setTesting(false)
    }
  }

  // 导出配置
  const handleExport = () => {
    try {
      const json = storageService.exportConfig()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `s3-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('配置已导出')
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('导出配置失败')
      }
    }
  }

  // 导入配置
  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const fullConfig = storageService.importConfig(json)
        
        // 设置 S3 配置
        form.setFieldsValue(fullConfig.s3)
        
        // 设置应用配置
        appForm.setFieldsValue(fullConfig.app)
        
        message.success('配置已导入，请检查并保存')
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('导入配置失败')
        }
      }
    }
    reader.readAsText(file)
    return false // 阻止自动上传
  }

  // 保存配置
  const handleSave = async () => {
    try {
      const s3Values = await form.validateFields()
      const appValues = await appForm.validateFields()
      
      // 保存 S3 配置
      saveConfigToStorage(s3Values)
      
      // 保存应用配置
      setItemsPerPage(appValues.itemsPerPage)
      setCopyFormat(appValues.copyFormat)
      setUploadFormat(appValues.uploadFormat)
      setUploadNameStrategy(appValues.uploadNameStrategy)
      setUploadTargetPath(appValues.uploadTargetPath)
      setUploadCustomPath(appValues.uploadCustomPath || '')
      
      message.success('配置已保存')
      hideSettingsModal()
      
      // 保存成功后自动刷新图片区域
      setTimeout(() => {
        refreshItems().catch((error) => {
          console.error('刷新图片列表失败:', error)
        })
      }, 100)
    } catch (error) {
      message.error('请填写所有必填字段')
    }
  }

  // 关闭Modal
  const handleCancel = () => {
    setTestResult(null)
    hideSettingsModal()
  }

  return (
    <Modal
      title="S3配置设置"
      open={visible}
      onCancel={handleCancel}
      afterOpenChange={(open) => open && handleOpen()}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存配置
        </Button>,
      ]}
      className={isDark ? 'dark-modal' : ''}
      aria-labelledby="settings-modal-title"
      aria-describedby="settings-modal-description"
    >
      <div id="settings-modal-description" className="sr-only">
        配置S3存储连接信息，包括访问密钥、区域、端点和存储桶名称
      </div>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        className="mt-4"
      >
        <Form.Item
          label="Access Key ID"
          name="accessKeyId"
          rules={[
            { required: true, message: '请输入Access Key ID' },
            { min: 16, message: 'Access Key ID长度至少16个字符' },
          ]}
        >
          <Input 
            placeholder="请输入Access Key ID" 
            aria-required="true"
            aria-describedby="accessKeyId-help"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          label="Secret Access Key"
          name="secretAccessKey"
          rules={[
            { required: true, message: '请输入Secret Access Key' },
            { min: 32, message: 'Secret Access Key长度至少32个字符' },
          ]}
        >
          <Input.Password 
            placeholder="请输入Secret Access Key" 
            aria-required="true"
            aria-describedby="secretAccessKey-help"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item
          label="Region"
          name="region"
          rules={[{ required: true, message: '请输入Region' }]}
          tooltip="例如: us-east-1, auto"
        >
          <Input 
            placeholder="例如: us-east-1, auto" 
            aria-required="true"
            aria-describedby="region-help"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Endpoint"
          name="endpoint"
          rules={[
            { required: true, message: '请输入Endpoint' },
            {
              pattern: /^https?:\/\/.+/,
              message: 'Endpoint必须以http://或https://开头',
            },
          ]}
          tooltip="例如: https://s3.amazonaws.com 或 https://your-account.r2.cloudflarestorage.com"
        >
          <Input 
            placeholder="https://your-endpoint.com" 
            aria-required="true"
            aria-describedby="endpoint-help"
            autoComplete="url"
          />
        </Form.Item>

        <Form.Item
          label="Bucket"
          name="bucket"
          rules={[
            { required: true, message: '请输入Bucket名称' },
            {
              pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
              message: 'Bucket名称只能包含小写字母、数字和连字符',
            },
          ]}
        >
          <Input 
            placeholder="your-bucket-name" 
            aria-required="true"
            aria-describedby="bucket-help"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="自定义域名（可选）"
          name="customDomain"
          tooltip="如果配置了自定义域名，将使用该域名生成图片URL"
          rules={[
            {
              pattern: /^https?:\/\/.+/,
              message: '自定义域名必须以http://或https://开头',
            },
          ]}
        >
          <Input 
            placeholder="https://your-custom-domain.com" 
            aria-describedby="customDomain-help"
            autoComplete="url"
          />
        </Form.Item>
      </Form>

      {/* 应用配置表单 */}
      <Form
        form={appForm}
        layout="vertical"
        className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="text-base font-semibold mb-4 text-gray-900 dark:text-gray-100">
          应用设置
        </div>

        <Form.Item
          label="单页显示数量"
          name="itemsPerPage"
          rules={[
            { required: true, message: '请输入单页显示数量' },
            { type: 'number', min: 1, max: 100, message: '数量范围：1-100' },
          ]}
          tooltip="设置每页显示的图片数量，超过则分页显示"
        >
          <InputNumber 
            min={1} 
            max={100} 
            className="w-full"
            placeholder="默认 20"
          />
        </Form.Item>

        <Form.Item
          label="复制格式"
          name="copyFormat"
          rules={[{ required: true, message: '请选择复制格式' }]}
          tooltip="选择复制图片链接时使用的格式"
        >
          <Select placeholder="选择复制格式">
            <Select.Option value="url">原链接</Select.Option>
            <Select.Option value="markdown">Markdown 格式</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="上传图片格式"
          name="uploadFormat"
          rules={[{ required: true, message: '请选择上传图片格式' }]}
          tooltip="选择WebP可以减小文件大小，提高加载速度"
        >
          <Select placeholder="选择上传图片格式">
            <Select.Option value="original">保持原格式</Select.Option>
            <Select.Option value="webp">转换为WebP</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="上传文件名策略"
          name="uploadNameStrategy"
          rules={[{ required: true, message: '请选择文件名策略' }]}
          tooltip="使用MD5可以避免文件名冲突，并且文件名长度固定"
        >
          <Select placeholder="选择文件名策略">
            <Select.Option value="original">保留原文件名</Select.Option>
            <Select.Option value="md5">使用MD5命名</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="上传目标路径"
          name="uploadTargetPath"
          rules={[{ required: true, message: '请选择上传目标路径' }]}
          tooltip="设置默认的上传路径策略，支持{year}/{mouth}/{day}变量"
        >
          <Select placeholder="选择上传目标路径">
            <Select.Option value="current">当前目录</Select.Option>
            <Select.Option value="custom">自定义路径</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => 
            prevValues.uploadTargetPath !== currentValues.uploadTargetPath
          }
        >
          {({ getFieldValue }) =>
            getFieldValue('uploadTargetPath') === 'custom' ? (
              <Form.Item
                name="uploadCustomPath"
                rules={[
                  { required: true, message: '请输入自定义路径' },
                ]}
                tooltip="支持变量: {year}, {month}, {day}"
              >
                <Input
                  placeholder="例如: images/{year}/{month}/{day}"
                  aria-label="输入自定义上传路径"
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>
      </Form>

      {/* S3 配置表单 */}
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        className="mt-4"
      >
        {/* 操作按钮组 */}
        <Form.Item>
          <Space className="w-full" direction="vertical">
            {/* 测试连接按钮 */}
            <Button
              block
              icon={
                testing ? (
                  <LoadingOutlined />
                ) : testResult === 'success' ? (
                  <CheckCircleOutlined />
                ) : undefined
              }
              onClick={handleTestConnection}
              loading={testing}
              type={testResult === 'success' ? 'primary' : 'default'}
              danger={testResult === 'error'}
              aria-label={
                testing
                  ? '正在测试连接'
                  : testResult === 'success'
                    ? '连接测试成功'
                    : testResult === 'error'
                      ? '连接测试失败'
                      : '测试S3连接'
              }
            >
              {testing
                ? '测试中...'
                : testResult === 'success'
                  ? '连接成功'
                  : testResult === 'error'
                    ? '连接失败'
                    : '测试连接'}
            </Button>

            {/* 导入导出按钮 */}
            <Space className="w-full">
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={!config}
                className="flex-1"
                aria-label="导出配置到JSON文件"
              >
                导出配置
              </Button>
              <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={handleImport}
                className="flex-1"
              >
                <Button 
                  icon={<UploadOutlined />} 
                  className="w-full"
                  aria-label="从JSON文件导入配置"
                >
                  导入配置
                </Button>
              </Upload>
            </Space>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
