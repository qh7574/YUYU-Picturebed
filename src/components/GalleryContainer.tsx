import React, { useEffect, useMemo, useCallback, useState } from 'react'
import { Gallery } from './Gallery'
import { useGalleryStore } from '../stores/galleryStore'
import { useNavigationStore } from '../stores/navigationStore'
import { useSelectionStore } from '../stores/selectionStore'
import { useUIStore } from '../stores/uiStore'
import { useAppConfigStore } from '../stores/appConfigStore'
import { message, confirm } from '../stores'
import { getS3Service } from '../services/s3Service'
import { imageService } from '../services/imageService'
import { cacheService } from '../services/cacheService'
import type { GalleryItem } from '../types'

export const GalleryContainer: React.FC = () => {
  const { items, loading, loadItems, refreshItems } = useGalleryStore()
  const { currentPath, navigate } = useNavigationStore()
  const { selectedItems, toggleSelection, clearSelection } = useSelectionStore()
  const { showViewer, showRenameModal, showMoveModal } = useUIStore()
  const { itemsPerPage, copyFormat } = useAppConfigStore()
  
  const [currentPage, setCurrentPage] = useState(1)

  // 加载当前路径的内容
  useEffect(() => {
    loadItems(currentPath)
    // 路径改变时清除选择和重置页码
    clearSelection()
    setCurrentPage(1)
  }, [currentPath, loadItems, clearSelection])

  // 处理返回上一级
  const handleGoBack = () => {
    // 移除最后一个路径段
    const segments = currentPath.split('/').filter(Boolean)
    segments.pop()
    const parentPath = segments.length > 0 ? segments.join('/') + '/' : ''
    navigate(parentPath)
  }

  // 添加返回上一级项（如果不在根目录）
  const displayItems = useMemo(() => {
    const isRoot = !currentPath || currentPath === '' || currentPath === '/'
    
    if (isRoot) {
      return items
    }

    // 在非根目录时，添加返回上一级项
    const backItem: GalleryItem = {
      type: 'folder',
      key: '__back__',
      name: '..',
    }

    return [backItem, ...items]
  }, [currentPath, items])

  // 分页逻辑
  const { paginatedItems, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginated = displayItems.slice(startIndex, endIndex)
    const total = Math.ceil(displayItems.length / itemsPerPage)
    
    return {
      paginatedItems: paginated,
      totalPages: total,
    }
  }, [displayItems, currentPage, itemsPerPage])

  // 处理页码变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 处理文件夹点击
  const handleFolderClick = (folderKey: string) => {
    if (folderKey === '__back__') {
      handleGoBack()
    } else {
      navigate(folderKey)
    }
  }

  // 处理图片点击（打开全屏查看）
  const handleItemClick = (item: GalleryItem) => {
    if (item.type === 'image') {
      // 找到所有图片项的索引
      const imageItems = displayItems.filter((i) => i.type === 'image')
      const index = imageItems.findIndex((i) => i.key === item.key)
      if (index !== -1) {
        showViewer(index)
      }
    }
  }

  // 处理选择变化
  const handleSelectionChange = (itemKey: string) => {
    // 不允许选择返回上一级项
    if (itemKey === '__back__') return
    toggleSelection(itemKey)
  }

  // 处理下载
  const handleDownload = useCallback(async (item: GalleryItem) => {
    if (!item.fullUrl) return

    try {
      await imageService.downloadImages([item.fullUrl], [item.name])
      message.success('下载成功')
    } catch (error) {
      console.error('下载失败:', error)
      message.error('下载失败，请重试')
    }
  }, [])

  // 处理复制URL
  const handleCopyUrl = useCallback(async (item: GalleryItem) => {
    if (!item.fullUrl) return

    try {
      let textToCopy = item.fullUrl
      
      // 根据配置格式化
      if (copyFormat === 'markdown') {
        textToCopy = `![${item.name}](${item.fullUrl})`
      }
      
      await navigator.clipboard.writeText(textToCopy)
      message.success('已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      message.error('复制失败，请重试')
    }
  }, [copyFormat])

  // 处理删除
  const handleDelete = useCallback((item: GalleryItem) => {
    confirm({
      title: '确认删除',
      content: `确定要删除 "${item.name}" 吗？此操作无法撤销。`,
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        const s3Service = getS3Service()
        if (!s3Service) {
          message.error('请先配置S3连接信息')
          return
        }

        try {
          await s3Service.deleteObject(item.key)
          message.success('删除成功')
          
          // 清除缓存并刷新列表
          await cacheService.clearPath(currentPath)
          await refreshItems()
        } catch (error) {
          console.error('删除失败:', error)
          message.error(error instanceof Error ? error.message : '删除失败，请重试')
          throw error // 重新抛出错误，让confirm知道操作失败
        }
      },
    })
  }, [currentPath, refreshItems])

  // 处理重命名
  const handleRename = useCallback((item: GalleryItem) => {
    showRenameModal({ key: item.key, name: item.name })
  }, [showRenameModal])

  // 处理移动
  const handleMove = useCallback((item: GalleryItem) => {
    showMoveModal({ key: item.key, name: item.name })
  }, [showMoveModal])

  return (
    <Gallery
      items={paginatedItems}
      loading={loading}
      onItemClick={handleItemClick}
      onFolderClick={handleFolderClick}
      selectedItems={selectedItems}
      onSelectionChange={handleSelectionChange}
      onDownload={handleDownload}
      onCopyUrl={handleCopyUrl}
      onDelete={handleDelete}
      onRename={handleRename}
      onMove={handleMove}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  )
}
