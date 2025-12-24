import { useState } from 'react'
import { CreateFolderModal } from './CreateFolderModal'
import { useUIStore } from '../stores/uiStore'
import { useNavigationStore } from '../stores/navigationStore'
import { useGalleryStore } from '../stores/galleryStore'
import { useMessageStore } from '../stores/messageStore'
import { getS3Service } from '../services/s3Service'

export function CreateFolderModalContainer() {
  const [loading, setLoading] = useState(false)
  const isDark = useUIStore((state) => state.theme === 'dark')
  const visible = useUIStore((state) => state.createFolderModalVisible)
  const hideModal = useUIStore((state) => state.hideCreateFolderModal)
  const currentPath = useNavigationStore((state) => state.currentPath)
  const refreshItems = useGalleryStore((state) => state.refreshItems)
  const success = useMessageStore((state) => state.success)
  const error = useMessageStore((state) => state.error)

  const handleOk = async (folderName: string) => {
    const s3Service = getS3Service()
    if (!s3Service) {
      error('S3服务未初始化')
      return
    }

    setLoading(true)
    try {
      // 构建文件夹路径（以 / 结尾）
      const folderPath = currentPath + folderName + '/'
      
      // 在 S3 中创建文件夹（上传一个空对象，key 以 / 结尾）
      await s3Service.uploadObject(folderPath, new Blob([]))
      
      success('文件夹创建成功')
      hideModal()
      
      // 刷新图片列表
      await refreshItems()
    } catch (err) {
      console.error('创建文件夹失败:', err)
      error(`创建文件夹失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CreateFolderModal
      visible={visible}
      loading={loading}
      onOk={handleOk}
      onCancel={hideModal}
      isDark={isDark}
    />
  )
}
