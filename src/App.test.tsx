import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { useConfigStore } from './stores/configStore'
import { useUIStore } from './stores/uiStore'

// Mock stores
vi.mock('./stores/configStore')
vi.mock('./stores/uiStore')

// Mock components
vi.mock('./components', () => ({
  Header: () => <div data-testid="header">Header</div>,
  BreadcrumbContainer: () => <div data-testid="breadcrumb">Breadcrumb</div>,
  GalleryContainer: () => <div data-testid="gallery">Gallery</div>,
  ImageViewer: () => <div data-testid="viewer">Viewer</div>,
  SettingsModalContainer: () => <div data-testid="settings">Settings</div>,
  UploadModalContainer: () => <div data-testid="upload">Upload</div>,
  RenameModalContainer: () => <div data-testid="rename">Rename</div>,
  MoveModalContainer: () => <div data-testid="move">Move</div>,
  GlobalMessage: () => null,
  GlobalConfirm: () => null,
  GlobalLoading: () => null,
}))

describe('App组件', () => {
  const mockLoadThemeFromStorage = vi.fn()
  const mockLoadConfigFromStorage = vi.fn()
  const mockShowSettingsModal = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // 默认mock实现
    vi.mocked(useUIStore).mockImplementation((selector: any) => {
      const state = {
        theme: 'light',
        loadThemeFromStorage: mockLoadThemeFromStorage,
        showSettingsModal: mockShowSettingsModal,
      }
      return selector(state)
    })

    vi.mocked(useConfigStore).mockImplementation((selector: any) => {
      const state = {
        config: null,
        isInitialized: false,
        loadConfigFromStorage: mockLoadConfigFromStorage,
      }
      return selector(state)
    })
  })

  it('应该在初始化时加载主题和配置', () => {
    render(<App />)

    expect(mockLoadThemeFromStorage).toHaveBeenCalledTimes(1)
    expect(mockLoadConfigFromStorage).toHaveBeenCalledTimes(1)
  })

  it('应该在没有配置时自动打开设置弹窗', async () => {
    vi.mocked(useConfigStore).mockImplementation((selector: any) => {
      const state = {
        config: null,
        isInitialized: true,
        loadConfigFromStorage: mockLoadConfigFromStorage,
      }
      return selector(state)
    })

    render(<App />)

    await waitFor(() => {
      expect(mockShowSettingsModal).toHaveBeenCalledTimes(1)
    })
  })

  it('应该在有配置时不打开设置弹窗', async () => {
    vi.mocked(useConfigStore).mockImplementation((selector: any) => {
      const state = {
        config: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
          region: 'auto',
          endpoint: 'https://test.com',
          bucket: 'test-bucket',
        },
        isInitialized: true,
        loadConfigFromStorage: mockLoadConfigFromStorage,
      }
      return selector(state)
    })

    render(<App />)

    await waitFor(() => {
      expect(mockShowSettingsModal).not.toHaveBeenCalled()
    })
  })

  it('应该渲染所有主要组件', () => {
    render(<App />)

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByTestId('gallery')).toBeInTheDocument()
    expect(screen.getByTestId('viewer')).toBeInTheDocument()
    expect(screen.getByTestId('settings')).toBeInTheDocument()
    expect(screen.getByTestId('upload')).toBeInTheDocument()
    expect(screen.getByTestId('rename')).toBeInTheDocument()
    expect(screen.getByTestId('move')).toBeInTheDocument()
  })

  it('应该根据主题应用正确的CSS类', () => {
    const { rerender } = render(<App />)
    
    // 浅色主题
    let container = screen.getByTestId('header').parentElement
    expect(container).toHaveClass('bg-gray-50')
    expect(container).not.toHaveClass('dark')

    // 深色主题
    vi.mocked(useUIStore).mockImplementation((selector: any) => {
      const state = {
        theme: 'dark',
        loadThemeFromStorage: mockLoadThemeFromStorage,
        showSettingsModal: mockShowSettingsModal,
      }
      return selector(state)
    })

    rerender(<App />)
    container = screen.getByTestId('header').parentElement
    expect(container).toHaveClass('dark')
    expect(container).toHaveClass('bg-gray-900')
  })
})
