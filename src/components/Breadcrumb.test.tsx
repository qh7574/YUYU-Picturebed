import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Breadcrumb } from './Breadcrumb'

describe('Breadcrumb组件', () => {
  const mockOnNavigate = vi.fn()
  const mockOnBatchDownload = vi.fn()
  const mockOnBatchCopyUrl = vi.fn()
  const mockOnBatchDelete = vi.fn()

  it('应该显示根目录', () => {
    render(
      <Breadcrumb
        currentPath=""
        onNavigate={mockOnNavigate}
        selectedCount={0}
        onBatchDownload={mockOnBatchDownload}
        onBatchCopyUrl={mockOnBatchCopyUrl}
        onBatchDelete={mockOnBatchDelete}
      />
    )

    expect(screen.getByText('根目录')).toBeInTheDocument()
  })

  it('应该显示路径段', () => {
    render(
      <Breadcrumb
        currentPath="folder1/folder2"
        onNavigate={mockOnNavigate}
        selectedCount={0}
        onBatchDownload={mockOnBatchDownload}
        onBatchCopyUrl={mockOnBatchCopyUrl}
        onBatchDelete={mockOnBatchDelete}
      />
    )

    expect(screen.getByText('根目录')).toBeInTheDocument()
    expect(screen.getByText('folder1')).toBeInTheDocument()
    expect(screen.getByText('folder2')).toBeInTheDocument()
  })

  it('点击路径段应该触发导航', () => {
    render(
      <Breadcrumb
        currentPath="folder1/folder2"
        onNavigate={mockOnNavigate}
        selectedCount={0}
        onBatchDownload={mockOnBatchDownload}
        onBatchCopyUrl={mockOnBatchCopyUrl}
        onBatchDelete={mockOnBatchDelete}
      />
    )

    fireEvent.click(screen.getByText('folder1'))
    expect(mockOnNavigate).toHaveBeenCalledWith('folder1')
  })

  it('当没有选中项时不应该显示批量操作按钮', () => {
    render(
      <Breadcrumb
        currentPath=""
        onNavigate={mockOnNavigate}
        selectedCount={0}
        onBatchDownload={mockOnBatchDownload}
        onBatchCopyUrl={mockOnBatchCopyUrl}
        onBatchDelete={mockOnBatchDelete}
      />
    )

    expect(screen.queryByText('下载')).not.toBeInTheDocument()
    expect(screen.queryByText('复制')).not.toBeInTheDocument()
    expect(screen.queryByText('删除')).not.toBeInTheDocument()
  })

  it('当有选中项时应该显示批量操作按钮', () => {
    render(
      <Breadcrumb
        currentPath=""
        onNavigate={mockOnNavigate}
        selectedCount={3}
        onBatchDownload={mockOnBatchDownload}
        onBatchCopyUrl={mockOnBatchCopyUrl}
        onBatchDelete={mockOnBatchDelete}
      />
    )

    expect(screen.getByText('已选中 3 项')).toBeInTheDocument()
    expect(screen.getByText('下载')).toBeInTheDocument()
    expect(screen.getByText('复制')).toBeInTheDocument()
    expect(screen.getByText('删除')).toBeInTheDocument()
  })

  it('点击批量下载按钮应该触发回调', () => {
    render(
      <Breadcrumb
        currentPath=""
        onNavigate={mockOnNavigate}
        selectedCount={2}
        onBatchDownload={mockOnBatchDownload}
        onBatchCopyUrl={mockOnBatchCopyUrl}
        onBatchDelete={mockOnBatchDelete}
      />
    )

    fireEvent.click(screen.getByText('下载'))
    expect(mockOnBatchDownload).toHaveBeenCalled()
  })

  it('点击批量复制按钮应该触发回调', () => {
    render(
      <Breadcrumb
        currentPath=""
        onNavigate={mockOnNavigate}
        selectedCount={2}
        onBatchDownload={mockOnBatchDownload}
        onBatchCopyUrl={mockOnBatchCopyUrl}
        onBatchDelete={mockOnBatchDelete}
      />
    )

    fireEvent.click(screen.getByText('复制'))
    expect(mockOnBatchCopyUrl).toHaveBeenCalled()
  })

  it('点击批量删除按钮应该触发回调', () => {
    render(
      <Breadcrumb
        currentPath=""
        onNavigate={mockOnNavigate}
        selectedCount={2}
        onBatchDownload={mockOnBatchDownload}
        onBatchCopyUrl={mockOnBatchCopyUrl}
        onBatchDelete={mockOnBatchDelete}
      />
    )

    fireEvent.click(screen.getByText('删除'))
    expect(mockOnBatchDelete).toHaveBeenCalled()
  })
})
