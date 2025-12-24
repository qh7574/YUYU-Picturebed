import React from 'react'
import { RenameModal } from './RenameModal'
import { useUIStore } from '../stores/uiStore'
import { useGalleryStore } from '../stores/galleryStore'
import { useNavigationStore } from '../stores/navigationStore'
import { message } from '../stores'
import { getS3Service } from '../services/s3Service'
import { cacheService } from '../services/cacheService'

export const RenameModalContainer: React.FC = () => {
  const { renameModalVisible, currentOperationItem, hideRenameModal } = useUIStore()
  const { refreshItems } = useGalleryStore()
  const { currentPath } = useNavigationStore()

  const handleRename = async (newName: string) => {
    if (!currentOperationItem) return

    const s3Service = getS3Service()
    if (!s3Service) {
      throw new Error('请先配置S3连接信息')
    }

    try {
      // 判断是文件夹还是文件
      const isFolder = currentOperationItem.key.endsWith('/')
      
      // 构建新的key
      const pathParts = currentOperationItem.key.split('/').filter(Boolean)
      pathParts[pathParts.length - 1] = newName
      let newKey = pathParts.join('/')
      
      // 如果是文件夹，确保以 / 结尾
      if (isFolder) {
        newKey = newKey + '/'
      }

      // 调用S3服务重命名
      await s3Service.renameObject(currentOperationItem.key, newKey)

      message.success('重命名成功')

      // 清除缓存
      await cacheService.clearPath(currentPath)

      // 刷新列表
      await refreshItems()
    } catch (error) {
      console.error('重命名失败:', error)
      throw error // 重新抛出错误，让RenameModal显示错误信息
    }
  }

  return (
    <RenameModal
      visible={renameModalVisible}
      currentName={currentOperationItem?.name || ''}
      onClose={hideRenameModal}
      onRename={handleRename}
    />
  )
}
