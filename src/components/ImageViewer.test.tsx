import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageViewer } from './ImageViewer'
import { useUIStore } from '../stores/uiStore'
import { useGalleryStore } from '../stores/galleryStore'
import type { GalleryItem } from '../types'

// Mock stores
vi.mock('../stores/uiStore')
vi.mock('../stores/galleryStore')

describe('ImageViewer', () => {
  const mockHideViewer = vi.fn()
  const mockSetCurrentImageIndex = vi.fn()

  const mockImageItems: GalleryItem[] = [
    {
      type: 'image',
      key: 'image1.jpg',
      name: 'Image 1',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      fullUrl: 'https://example.com/full1.jpg',
    },
    {
      type: 'image',
      key: 'image2.jpg',
      name: 'Image 2',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      fullUrl: 'https://example.com/full2.jpg',
    },
    {
      type: 'image',
      key: 'image3.jpg',
      name: 'Image 3',
      thumbnailUrl: 'https://example.com/thumb3.jpg',
      fullUrl: 'https://example.com/full3.jpg',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('不应该在viewerVisible为false时渲染', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: false,
      currentImageIndex: 0,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    const { container } = render(<ImageViewer />)
    expect(container.firstChild).toBeNull()
  })

  it('应该在viewerVisible为true时渲染', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 0,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    expect(screen.getByAltText('Image 1')).toBeInTheDocument()
  })

  it('应该显示当前图片信息', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 1,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    expect(screen.getByText('Image 2')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('应该在点击关闭按钮时调用hideViewer', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 0,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    const closeButton = screen.getByLabelText('关闭图片查看器')
    fireEvent.click(closeButton)
    expect(mockHideViewer).toHaveBeenCalled()
  })

  it('应该在点击左箭头时切换到上一张', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 1,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    const prevButton = screen.getByLabelText('上一张图片')
    fireEvent.click(prevButton)
    expect(mockSetCurrentImageIndex).toHaveBeenCalledWith(0)
  })

  it('应该在点击右箭头时切换到下一张', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 1,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    const nextButton = screen.getByLabelText('下一张图片')
    fireEvent.click(nextButton)
    expect(mockSetCurrentImageIndex).toHaveBeenCalledWith(2)
  })

  it('不应该在第一张图片时显示左箭头', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 0,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    expect(screen.queryByLabelText('上一张图片')).not.toBeInTheDocument()
  })

  it('不应该在最后一张图片时显示右箭头', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 2,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    expect(screen.queryByLabelText('下一张图片')).not.toBeInTheDocument()
  })

  it('应该支持键盘导航 - 左箭头', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 1,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(mockSetCurrentImageIndex).toHaveBeenCalledWith(0)
  })

  it('应该支持键盘导航 - 右箭头', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 1,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(mockSetCurrentImageIndex).toHaveBeenCalledWith(2)
  })

  it('应该支持键盘导航 - ESC关闭', () => {
    vi.mocked(useUIStore).mockReturnValue({
      viewerVisible: true,
      currentImageIndex: 0,
      hideViewer: mockHideViewer,
      setCurrentImageIndex: mockSetCurrentImageIndex,
    } as any)

    vi.mocked(useGalleryStore).mockReturnValue({
      items: mockImageItems,
    } as any)

    render(<ImageViewer />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockHideViewer).toHaveBeenCalledTimes(1)
  })
})
