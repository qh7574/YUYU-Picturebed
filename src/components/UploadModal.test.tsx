import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UploadModal } from './UploadModal'
import { useUIStore } from '../stores/uiStore'
import { useNavigationStore } from '../stores/navigationStore'

// Mock stores
vi.mock('../stores/uiStore')
vi.mock('../stores/navigationStore')

// Mock services
vi.mock('../services/imageService', () => ({
  imageService: {
    convertToWebP: vi.fn().mockResolvedValue(new Blob()),
    calculateMD5: vi.fn().mockResolvedValue('1234567890abcdef'),
  },
}))

vi.mock('../services/s3Service', () => ({
  getS3Service: vi.fn().mockReturnValue({
    uploadObject: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../services/cacheService', () => ({
  cacheService: {
    clearPath: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../stores/galleryStore', () => ({
  useGalleryStore: {
    getState: vi.fn().mockReturnValue({
      refreshItems: vi.fn().mockResolvedValue(undefined),
    }),
  },
}))

describe('UploadModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    vi.mocked(useUIStore).mockReturnValue({
      uploadModalVisible: true,
      hideUploadModal: vi.fn(),
      theme: 'light',
    } as any)

    vi.mocked(useNavigationStore).mockReturnValue({
      currentPath: 'test-folder',
    } as any)
  })

  it('应该渲染上传弹窗', () => {
    render(<UploadModal />)
    
    expect(screen.getByText('上传图片')).toBeInTheDocument()
    expect(screen.getByText('选择文件')).toBeInTheDocument()
  })

  it('应该显示格式选择选项', () => {
    render(<UploadModal />)
    
    expect(screen.getByText('保持原格式')).toBeInTheDocument()
    expect(screen.getByText('转换为WebP')).toBeInTheDocument()
  })

  it('应该显示路径配置选项', () => {
    render(<UploadModal />)
    
    expect(screen.getByText(/当前目录/)).toBeInTheDocument()
    expect(screen.getByText('自定义路径')).toBeInTheDocument()
  })

  it('应该显示文件名策略选项', () => {
    render(<UploadModal />)
    
    expect(screen.getByText('保留原文件名')).toBeInTheDocument()
    expect(screen.getByText('使用MD5命名')).toBeInTheDocument()
  })

  it('当没有选择文件时上传按钮应该被禁用', () => {
    render(<UploadModal />)
    
    const uploadButton = screen.getByRole('button', { name: /开始上传/ })
    expect(uploadButton).toBeDisabled()
  })

  it('应该显示当前路径', () => {
    render(<UploadModal />)
    
    // 检查是否包含"当前目录"和路径信息
    expect(screen.getByText(/当前目录/)).toBeInTheDocument()
  })
})
