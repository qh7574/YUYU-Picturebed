import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsModal } from './SettingsModal'
import { useConfigStore } from '../stores/configStore'
import { useUIStore } from '../stores/uiStore'
import type { S3Config } from '../types'

// Mock services
vi.mock('../services/storageService', () => ({
  storageService: {
    exportConfig: vi.fn(),
    importConfig: vi.fn(),
  },
}))

vi.mock('../services/s3Service', () => ({
  getS3Service: vi.fn(),
  S3Service: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
    destroy: vi.fn(),
  })),
}))

describe('SettingsModal', () => {
  const mockConfig: S3Config = {
    accessKeyId: 'test-access-key-id-123',
    secretAccessKey: 'test-secret-access-key-1234567890',
    region: 'us-east-1',
    endpoint: 'https://s3.amazonaws.com',
    bucket: 'test-bucket',
    customDomain: 'https://cdn.example.com',
  }

  beforeEach(() => {
    // 重置stores
    useUIStore.setState({
      settingsModalVisible: true,
      theme: 'light',
    })
    useConfigStore.setState({
      config: mockConfig,
      isInitialized: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该在Modal打开时显示', () => {
    render(<SettingsModal />)
    expect(screen.getByText('S3配置设置')).toBeInTheDocument()
  })

  it('应该在Modal关闭时不显示', () => {
    useUIStore.setState({ settingsModalVisible: false })
    render(<SettingsModal />)
    expect(screen.queryByText('S3配置设置')).not.toBeInTheDocument()
  })

  it('应该显示所有必填的表单字段', () => {
    render(<SettingsModal />)
    
    expect(screen.getByLabelText(/Access Key ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Secret Access Key/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Region/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Endpoint/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Bucket/i)).toBeInTheDocument()
  })

  it('应该显示可选的自定义域名字段', () => {
    render(<SettingsModal />)
    expect(screen.getByLabelText(/自定义域名/i)).toBeInTheDocument()
  })

  it('应该显示测试连接按钮', () => {
    render(<SettingsModal />)
    expect(screen.getByRole('button', { name: /测试S3连接/i })).toBeInTheDocument()
  })

  it('应该显示导出配置按钮', () => {
    render(<SettingsModal />)
    expect(screen.getByRole('button', { name: /导出配置/i })).toBeInTheDocument()
  })

  it('应该显示导入配置按钮', () => {
    render(<SettingsModal />)
    expect(screen.getByRole('button', { name: /导入配置/i })).toBeInTheDocument()
  })

  it('应该显示保存配置按钮', () => {
    render(<SettingsModal />)
    expect(screen.getByRole('button', { name: /保存配置/i })).toBeInTheDocument()
  })

  it('应该在打开时填充现有配置', async () => {
    render(<SettingsModal />)
    
    await waitFor(() => {
      const accessKeyInput = screen.getByLabelText(/Access Key ID/i) as HTMLInputElement
      expect(accessKeyInput.value).toBe(mockConfig.accessKeyId)
    })
  })

  it('应该在点击取消时关闭Modal', () => {
    const hideSettingsModal = vi.fn()
    useUIStore.setState({ hideSettingsModal })
    
    render(<SettingsModal />)
    const cancelButton = screen.getByRole('button', { name: /取\s*消/i })
    fireEvent.click(cancelButton)
    
    expect(hideSettingsModal).toHaveBeenCalled()
  })

  it('应该验证必填字段', async () => {
    useConfigStore.setState({ config: null })
    render(<SettingsModal />)
    
    const saveButton = screen.getByRole('button', { name: /保存配置/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/请输入Access Key ID/i)).toBeInTheDocument()
    })
  })

  it('应该验证Access Key ID最小长度', async () => {
    useConfigStore.setState({ config: null })
    render(<SettingsModal />)
    
    const accessKeyInput = screen.getByLabelText(/Access Key ID/i)
    fireEvent.change(accessKeyInput, { target: { value: 'short' } })
    
    const saveButton = screen.getByRole('button', { name: /保存配置/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Access Key ID长度至少16个字符/i)).toBeInTheDocument()
    })
  })

  it('应该验证Endpoint格式', async () => {
    useConfigStore.setState({ config: null })
    render(<SettingsModal />)
    
    const endpointInput = screen.getByLabelText(/Endpoint/i)
    fireEvent.change(endpointInput, { target: { value: 'invalid-endpoint' } })
    
    const saveButton = screen.getByRole('button', { name: /保存配置/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Endpoint必须以http:\/\/或https:\/\/开头/i)).toBeInTheDocument()
    })
  })

  it('应该验证Bucket名称格式', async () => {
    useConfigStore.setState({ config: null })
    render(<SettingsModal />)
    
    const bucketInput = screen.getByLabelText(/Bucket/i)
    fireEvent.change(bucketInput, { target: { value: 'Invalid_Bucket' } })
    
    const saveButton = screen.getByRole('button', { name: /保存配置/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Bucket名称只能包含小写字母、数字和连字符/i)).toBeInTheDocument()
    })
  })

  it('应该在没有配置时禁用导出按钮', () => {
    useConfigStore.setState({ config: null })
    render(<SettingsModal />)
    
    const exportButton = screen.getByRole('button', { name: /导出配置/i })
    expect(exportButton).toBeDisabled()
  })

  it('应该在有配置时启用导出按钮', () => {
    render(<SettingsModal />)
    
    const exportButton = screen.getByRole('button', { name: /导出配置/i })
    expect(exportButton).not.toBeDisabled()
  })
})
