import React from 'react'
import { CopyModal } from './CopyModal'
import { useUIStore } from '../stores/uiStore'
import { useGalleryStore } from '../stores/galleryStore'
import { useNavigationStore } from '../stores/navigationStore'
import { useSelectionStore } from '../stores/selectionStore'
import { message } from '../stores'
import { getS3Service } from '../services/s3Service'
import { cacheService } from '../services/cacheService'

export const CopyModalContainer: React.FC = () => {
  const { copyModalVisible, currentOperationItem, hideCopyModal, batchCopyMode } = useUIStore()
  const { refreshItems } = useGalleryStore()
  const { currentPath } = useNavigationStore()
  const { selectedItems, clearSelection } = useSelectionStore()

  const handleCopy = async (targetPath: string) => {
    const s3Service = getS3Service()
    if (!s3Service) {
      throw new Error('请先配置S3连接信息')
    }

    try {
      if (batchCopyMode && selectedItems.size > 0) {
        // 批量复制
        const keysToCopy = Array.from(selectedItems)
        let successCount = 0
        let failCount = 0

        for (const key of keysToCopy) {
          try {
            // 获取文件/文件夹名
            const pathParts = key.split('/').filter(Boolean)
            const itemName = pathParts[pathParts.length - 1]
            
            // 构建新的key
            let newKey = targetPath ? `${targetPath}${itemName}` : itemName
            
            // 如果是文件夹，确保以 / 结尾
            if (key.endsWith('/')) {
              newKey = newKey + '/'
            }

            // 跳过相同路径
            if (newKey === key) {
              continue
            }

            await s3Service.copyObject(key, newKey)
            successCount++
          } catch (error) {
            console.error(`复制 ${key} 失败:`, error)
            failCount++
          }
        }

        if (successCount > 0) {
          message.success(`成功复制 ${successCount} 项${failCount > 0 ? `，失败 ${failCount} 项` : ''}`)
        } else {
          throw new Error('批量复制失败')
        }

        // 清除选择
        clearSelection()
      } else if (currentOperationItem) {
        // 单个复制
        const isFolder = currentOperationItem.key.endsWith('/')
        const pathParts = currentOperationItem.key.split('/').filter(Boolean)
        const itemName = pathParts[pathParts.length - 1]
        let newKey = targetPath ? `${targetPath}${itemName}` : itemName
        
        if (isFolder) {
          newKey = newKey + '/'
        }

        await s3Service.copyObject(currentOperationItem.key, newKey)
        message.success('复制成功')
      }

      // 清除缓存
      await cacheService.clearPath(currentPath)
      await cacheService.clearPath(targetPath)

      // 刷新列表
      await refreshItems()
    } catch (error) {
      console.error('复制失败:', error)
      throw error
    }
  }

  return (
    <CopyModal
      visible={copyModalVisible}
      currentKey={currentOperationItem?.key || ''}
      currentPath={currentPath}
      onClose={hideCopyModal}
      onCopy={handleCopy}
      isBatch={batchCopyMode}
      batchCount={selectedItems.size}
    />
  )
}
