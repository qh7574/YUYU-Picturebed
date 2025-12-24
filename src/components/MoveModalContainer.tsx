import React from 'react'
import { MoveModal } from './MoveModal'
import { useUIStore } from '../stores/uiStore'
import { useGalleryStore } from '../stores/galleryStore'
import { useNavigationStore } from '../stores/navigationStore'
import { message } from '../stores'
import { getS3Service } from '../services/s3Service'
import { cacheService } from '../services/cacheService'

export const MoveModalContainer: React.FC = () => {
  const { moveModalVisible, currentOperationItem, hideMoveModal } = useUIStore()
  const { refreshItems } = useGalleryStore()
  const { currentPath } = useNavigationStore()

  const handleMove = async (targetPath: string) => {
    if (!currentOperationItem) return

    const s3Service = getS3Service()
    if (!s3Service) {
      throw new Error('请先配置S3连接信息')
    }

    try {
      // 判断是文件夹还是文件
      const isFolder = currentOperationItem.key.endsWith('/')
      
      // 获取文件/文件夹名
      const pathParts = currentOperationItem.key.split('/').filter(Boolean)
      const itemName = pathParts[pathParts.length - 1]
      
      // 构建新的key
      let newKey = targetPath ? `${targetPath}${itemName}` : itemName
      
      // 如果是文件夹，确保以 / 结尾
      if (isFolder) {
        newKey = newKey + '/'
      }

      // 调用S3服务移动
      await s3Service.moveObject(currentOperationItem.key, newKey)

      message.success('移动成功')

      // 清除当前路径和目标路径的缓存
      await cacheService.clearPath(currentPath)
      await cacheService.clearPath(targetPath)

      // 刷新列表
      await refreshItems()
    } catch (error) {
      console.error('移动失败:', error)
      throw error // 重新抛出错误，让MoveModal显示错误信息
    }
  }

  return (
    <MoveModal
      visible={moveModalVisible}
      currentKey={currentOperationItem?.key || ''}
      currentPath={currentPath}
      onClose={hideMoveModal}
      onMove={handleMove}
    />
  )
}
