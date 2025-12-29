import React from 'react'
import { Breadcrumb } from './Breadcrumb'
import { useNavigationStore } from '../stores/navigationStore'
import { useSelectionStore } from '../stores/selectionStore'
import { useGalleryStore } from '../stores/galleryStore'
import { useAppConfigStore } from '../stores/appConfigStore'
import { useUIStore } from '../stores/uiStore'
import { message, confirm, loading } from '../stores'
import { getS3Service } from '../services/s3Service'
import { imageService } from '../services/imageService'
import { cacheService } from '../services/cacheService'

/**
 * BreadcrumbContainer - Breadcrumb组件的容器
 * 处理批量操作的业务逻辑
 */
export const BreadcrumbContainer: React.FC = () => {
  const { currentPath, goToPath } = useNavigationStore()
  const { selectedItems, clearSelection } = useSelectionStore()
  const { items, refreshItems } = useGalleryStore()
  const { copyFormat } = useAppConfigStore()
  const showBatchMoveModal = useUIStore((state) => state.showBatchMoveModal)
  const showBatchCopyModal = useUIStore((state) => state.showBatchCopyModal)

  // 获取选中的图片项
  const selectedImageItems = React.useMemo(() => {
    return items.filter(
      (item) => item.type === 'image' && selectedItems.has(item.key)
    )
  }, [items, selectedItems])

  // 获取当前页所有可选择的项（排除返回上一级项）
  const selectableItems = React.useMemo(() => {
    return items.filter((item) => item.key !== '__back__')
  }, [items])

  // 处理路径导航
  const handleNavigate = (path: string) => {
    goToPath(path)
    clearSelection()
  }

  // 处理全选
  const handleSelectAll = () => {
    const allKeys = selectableItems.map((item) => item.key)
    
    // 如果当前所有项都已选中，则取消全选；否则全选
    const allSelected = allKeys.every((key) => selectedItems.has(key))
    
    if (allSelected) {
      clearSelection()
    } else {
      // 使用 selectAll 方法
      const { selectAll } = useSelectionStore.getState()
      selectAll(allKeys)
    }
  }

  // 批量下载
  const handleBatchDownload = async () => {
    if (selectedImageItems.length === 0) {
      message.warning('请选择要下载的图片')
      return
    }

    const s3Service = getS3Service()
    if (!s3Service) {
      message.error('请先配置S3连接信息')
      return
    }

    loading.show(`正在下载 ${selectedImageItems.length} 张图片...`)

    try {
      const urls = selectedImageItems.map((item) => s3Service.getObjectUrl(item.key))
      const names = selectedImageItems.map((item) => item.name)

      await imageService.downloadImages(urls, names)
      loading.hide()
      message.success(`成功下载 ${selectedImageItems.length} 张图片`)
    } catch (error) {
      console.error('批量下载失败:', error)
      loading.hide()
      message.error(error instanceof Error ? error.message : '批量下载失败，请重试')
    }
  }

  // 批量复制路径
  const handleBatchCopyUrl = async () => {
    if (selectedImageItems.length === 0) {
      message.warning('请选择要复制路径的图片')
      return
    }

    const s3Service = getS3Service()
    if (!s3Service) {
      message.error('请先配置S3连接信息')
      return
    }

    try {
      const urls = selectedImageItems.map((item) => s3Service.getObjectUrl(item.key))
      
      let textToCopy: string
      if (copyFormat === 'markdown') {
        // Markdown 格式
        const markdownLines = selectedImageItems.map((item, index) => 
          `![${item.name}](${urls[index]})`
        )
        textToCopy = markdownLines.join('\n')
      } else {
        // 原链接格式
        textToCopy = urls.join('\n')
      }

      await navigator.clipboard.writeText(textToCopy)
      const formatText = copyFormat === 'markdown' ? 'Markdown格式' : '原链接'
      message.success(`已复制 ${selectedImageItems.length} 个图片${formatText}到剪贴板`)
    } catch (error) {
      console.error('复制URL失败:', error)
      message.error('复制失败，请重试')
    }
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedImageItems.length === 0) {
      message.warning('请选择要删除的图片')
      return
    }

    confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedImageItems.length} 张图片吗？此操作无法撤销。`,
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
          const keys = selectedImageItems.map((item) => item.key)
          const result = await s3Service.deleteObjects(keys)

          if (result.failed.length > 0) {
            message.warning(
              `删除完成，成功: ${result.success.length}，失败: ${result.failed.length}`
            )
          } else {
            message.success(`成功删除 ${result.success.length} 张图片`)
          }

          // 清除选择
          clearSelection()
          
          // 清除缓存并刷新列表
          await cacheService.clearPath(currentPath)
          await refreshItems()
        } catch (error) {
          console.error('批量删除失败:', error)
          message.error(error instanceof Error ? error.message : '批量删除失败，请重试')
          throw error // 重新抛出错误，让confirm知道操作失败
        }
      },
    })
  }

  return (
    <Breadcrumb
      currentPath={currentPath}
      onNavigate={handleNavigate}
      selectedCount={selectedItems.size}
      onSelectAll={handleSelectAll}
      onBatchDownload={handleBatchDownload}
      onBatchCopy={showBatchCopyModal}
      onBatchCopyUrl={handleBatchCopyUrl}
      onBatchMove={showBatchMoveModal}
      onBatchDelete={handleBatchDelete}
    />
  )
}
