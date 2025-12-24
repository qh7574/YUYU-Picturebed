import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Gallery } from './Gallery'
import type { GalleryItem } from '../types'

describe('Gallery组件', () => {
  const mockItems: GalleryItem[] = [
    {
      type: 'folder',
      key: 'folder1/',
      name: 'folder1',
    },
    {
      type: 'image',
      key: 'image1.jpg',
      name: 'image1.jpg',
      fullUrl: 'https://example.com/image1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
    },
  ]

  const mockProps = {
    items: mockItems,
    loading: false,
    onItemClick: vi.fn(),
    onFolderClick: vi.fn(),
    selectedItems: new Set<string>(),
    onSelectionChange: vi.fn(),
  }

  it('应该在加载时显示加载提示', () => {
    render(<Gallery {...mockProps} loading={true} />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('应该在没有内容时显示空状态', () => {
    render(<Gallery {...mockProps} items={[]} />)
    expect(screen.getByText('暂无内容')).toBeInTheDocument()
  })

  it('应该渲染文件夹和图片', () => {
    render(<Gallery {...mockProps} />)
    expect(screen.getByText('folder1')).toBeInTheDocument()
    expect(screen.getByText('image1.jpg')).toBeInTheDocument()
  })

  it('应该正确渲染返回上一级项', () => {
    const backItem: GalleryItem = {
      type: 'folder',
      key: '__back__',
      name: '..',
    }
    const itemsWithBack = [backItem, ...mockItems]
    
    render(<Gallery {...mockProps} items={itemsWithBack} />)
    expect(screen.getByText('返回上一级')).toBeInTheDocument()
  })
})
