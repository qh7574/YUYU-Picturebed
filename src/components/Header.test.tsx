import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './Header'
import { useUIStore } from '../stores/uiStore'

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  UploadOutlined: () => <span>UploadIcon</span>,
  SettingOutlined: () => <span>SettingIcon</span>,
  SunOutlined: () => <span>SunIcon</span>,
  MoonOutlined: () => <span>MoonIcon</span>,
}))

describe('Header组件', () => {
  it('应该渲染网站标题', () => {
    render(<Header />)
    expect(screen.getByText('S3图床管理')).toBeInTheDocument()
  })

  it('应该显示主题切换按钮', () => {
    render(<Header />)
    const themeButton = screen.getByLabelText(/切换到/)
    expect(themeButton).toBeInTheDocument()
  })

  it('应该显示上传按钮', () => {
    render(<Header />)
    const uploadButtons = screen.getAllByLabelText(/上传/)
    expect(uploadButtons.length).toBeGreaterThan(0)
  })

  it('应该显示设置按钮', () => {
    render(<Header />)
    const settingsButtons = screen.getAllByLabelText(/设置/)
    expect(settingsButtons.length).toBeGreaterThan(0)
  })

  it('点击主题切换按钮应该调用toggleTheme', () => {
    render(<Header />)
    
    const initialTheme = useUIStore.getState().theme
    const themeButton = screen.getByLabelText(/切换到/)
    
    fireEvent.click(themeButton)
    
    const newTheme = useUIStore.getState().theme
    expect(newTheme).not.toBe(initialTheme)
  })

  it('点击上传按钮应该调用showUploadModal', () => {
    render(<Header />)
    
    const uploadButton = screen.getAllByLabelText(/上传/)[0]
    fireEvent.click(uploadButton)
    
    expect(useUIStore.getState().uploadModalVisible).toBe(true)
  })

  it('点击设置按钮应该调用showSettingsModal', () => {
    render(<Header />)
    
    const settingsButton = screen.getAllByLabelText(/设置/)[0]
    fireEvent.click(settingsButton)
    
    expect(useUIStore.getState().settingsModalVisible).toBe(true)
  })
})
