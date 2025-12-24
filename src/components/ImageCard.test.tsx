import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageCard } from './ImageCard'
import type { GalleryItem } from '../types'

describe('ImageCard', () => {
  const mockItem: GalleryItem = {
    type: 'image',
    key: 'test/image.jpg',
    name: 'image.jpg',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    fullUrl: 'https://example.com/full.jpg',
    size: 1024,
    lastModified: new Date(),
  }

  const mockHandlers = {
    onSelect: vi.fn(),
    onClick: vi.fn(),
    onDownload: vi.fn(),
    onCopyUrl: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    // 在每个测试前重置所有 mock
    vi.clearAllMocks()
  })

  it('应该渲染图片卡片', () => {
    render(<ImageCard item={mockItem} selected={false} {...mockHandlers} />)

    expect(screen.getByText('image.jpg')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('当选中时应该显示选中状态', () => {
    render(<ImageCard item={mockItem} selected={true} {...mockHandlers} />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('点击复选框应该调用onSelect', () => {
    render(<ImageCard item={mockItem} selected={false} {...mockHandlers} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockHandlers.onSelect).toHaveBeenCalledWith(true)
  })

  it('点击图片应该调用onClick', () => {
    const { container } = render(<ImageCard item={mockItem} selected={false} {...mockHandlers} />)

    // 点击图片容器区域
    const imageContainer = container.querySelector('.aspect-square')
    if (imageContainer) {
      fireEvent.click(imageContainer)
    }

    expect(mockHandlers.onClick).toHaveBeenCalled()
  })

  it('点击下载按钮应该调用onDownload', () => {
    render(<ImageCard item={mockItem} selected={false} {...mockHandlers} />)

    const downloadButton = screen.getByLabelText('下载 image.jpg')
    fireEvent.click(downloadButton)

    expect(mockHandlers.onDownload).toHaveBeenCalled()
  })

  it('点击复制路径按钮应该调用onCopyUrl', () => {
    render(<ImageCard item={mockItem} selected={false} {...mockHandlers} />)

    const copyButton = screen.getByLabelText('复制 image.jpg 的路径')
    fireEvent.click(copyButton)

    expect(mockHandlers.onCopyUrl).toHaveBeenCalled()
  })

  it('点击删除按钮应该调用onDelete', () => {
    render(<ImageCard item={mockItem} selected={false} {...mockHandlers} />)

    const deleteButton = screen.getByLabelText('删除 image.jpg')
    fireEvent.click(deleteButton)

    expect(mockHandlers.onDelete).toHaveBeenCalled()
  })

  it('操作按钮点击不应该触发图片点击', () => {
    render(<ImageCard item={mockItem} selected={false} {...mockHandlers} />)

    const downloadButton = screen.getByLabelText('下载 image.jpg')
    fireEvent.click(downloadButton)

    expect(mockHandlers.onClick).not.toHaveBeenCalled()
  })

  it('复选框点击不应该触发图片点击', () => {
    render(<ImageCard item={mockItem} selected={false} {...mockHandlers} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockHandlers.onClick).not.toHaveBeenCalled()
  })
})
