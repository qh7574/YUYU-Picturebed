import { useState, useEffect } from 'react'
import { Modal, Form, Button, message, Progress, Upload as AntUpload } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadConfig, UploadProgress } from '../types'
import { useUIStore } from '../stores/uiStore'
import { useNavigationStore } from '../stores/navigationStore'
import { useAppConfigStore } from '../stores/appConfigStore'
import { replacePathVariables, normalizePath, joinPath } from '../utils/pathUtils'

const { Dragger } = AntUpload

export function UploadModal() {
  const [form] = Form.useForm()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])

  const visible = useUIStore((state) => state.uploadModalVisible)
  const hideUploadModal = useUIStore((state) => state.hideUploadModal)
  const currentPath = useNavigationStore((state) => state.currentPath)
  const theme = useUIStore((state) => state.theme)
  
  // 从应用配置中读取上传设置
  const { uploadFormat, uploadNameStrategy, uploadTargetPath, uploadCustomPath } = useAppConfigStore()

  const isDark = theme === 'dark'

  // 当Modal打开时，重置表单和状态
  useEffect(() => {
    if (visible) {
      setFiles([])
      setUploadProgress([])
    }
  }, [visible])

  // 文件选择处理
  const handleFileChange = (info: any) => {
    const fileList = info.fileList.map((file: any) => file.originFileObj).filter(Boolean)
    setFiles(fileList)
    return false // 阻止自动上传
  }

  // 开始上传
  const handleUpload = async () => {
    if (files.length === 0) {
      message.warning('请先选择要上传的文件')
      return
    }

    try {
      // 构建上传配置（使用应用配置中的设置）
      const config: UploadConfig = {
        files,
        format: uploadFormat,
        targetPath: uploadTargetPath,
        customPath: uploadCustomPath,
        nameStrategy: uploadNameStrategy,
      }

      setUploading(true)
      
      // 初始化进度
      const initialProgress: UploadProgress[] = files.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }))
      setUploadProgress(initialProgress)

      // 执行上传
      await performUpload(config)

      message.success('所有文件上传完成！')
      
      // 延迟关闭，让用户看到完成状态
      setTimeout(() => {
        hideUploadModal()
      }, 1000)
    } catch (error) {
      if (error instanceof Error) {
        message.error(`上传失败: ${error.message}`)
      } else {
        message.error('上传失败，请重试')
      }
    } finally {
      setUploading(false)
    }
  }

  // 执行上传逻辑
  const performUpload = async (config: UploadConfig) => {
    const { imageService } = await import('../services/imageService')
    const { getS3Service } = await import('../services/s3Service')
    const { cacheService } = await import('../services/cacheService')

    const s3Service = getS3Service()
    if (!s3Service) {
      throw new Error('S3服务未初始化，请先配置S3连接')
    }

    // 确定目标路径
    let targetPath = currentPath
    if (config.targetPath === 'custom' && config.customPath) {
      targetPath = replacePathVariables(config.customPath)
    }
    targetPath = normalizePath(targetPath)

    // 并发上传控制：最多3个并发
    const concurrency = 3
    const results: Array<{ success: boolean; fileName: string; error?: string }> = []

    for (let i = 0; i < config.files.length; i += concurrency) {
      const batch = config.files.slice(i, i + concurrency)
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex
        
        try {
          // 更新状态为上传中
          setUploadProgress((prev) => {
            const newProgress = [...prev]
            newProgress[fileIndex] = {
              ...newProgress[fileIndex],
              status: 'uploading',
              progress: 10,
            }
            return newProgress
          })

          // 处理文件
          let fileToUpload: Blob = file
          let fileName = file.name

          // 格式转换
          if (config.format === 'webp' && !file.type.includes('webp')) {
            setUploadProgress((prev) => {
              const newProgress = [...prev]
              newProgress[fileIndex].progress = 30
              return newProgress
            })
            
            fileToUpload = await imageService.convertToWebP(file)
            // 更改文件扩展名为.webp
            const lastDotIndex = fileName.lastIndexOf('.')
            if (lastDotIndex !== -1) {
              fileName = fileName.substring(0, lastDotIndex) + '.webp'
            } else {
              fileName = fileName + '.webp'
            }
          }

          // 文件名策略
          if (config.nameStrategy === 'md5') {
            setUploadProgress((prev) => {
              const newProgress = [...prev]
              newProgress[fileIndex].progress = 50
              return newProgress
            })
            
            const md5 = await imageService.calculateMD5(file)
            const ext = fileName.split('.').pop()
            fileName = ext ? `${md5}.${ext}` : md5
          }

          // 构建完整的S3键
          const s3Key = targetPath ? joinPath(targetPath, fileName) : fileName

          setUploadProgress((prev) => {
            const newProgress = [...prev]
            newProgress[fileIndex].progress = 70
            return newProgress
          })

          // 上传到S3
          await s3Service.uploadObject(s3Key, fileToUpload)

          setUploadProgress((prev) => {
            const newProgress = [...prev]
            newProgress[fileIndex] = {
              ...newProgress[fileIndex],
              status: 'success',
              progress: 100,
            }
            return newProgress
          })

          results.push({ success: true, fileName: file.name })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'
          
          setUploadProgress((prev) => {
            const newProgress = [...prev]
            newProgress[fileIndex] = {
              ...newProgress[fileIndex],
              status: 'error',
              progress: 0,
              error: errorMessage,
            }
            return newProgress
          })

          results.push({ success: false, fileName: file.name, error: errorMessage })
        }
      })

      await Promise.all(batchPromises)
    }

    // 清除相关缓存
    await cacheService.clearPath(targetPath)
    
    // 刷新图片列表（无论上传到哪个路径，都刷新当前视图）
    const { useGalleryStore } = await import('../stores/galleryStore')
    await useGalleryStore.getState().refreshItems()

    // 检查是否有失败的上传
    const failedUploads = results.filter((r) => !r.success)
    if (failedUploads.length > 0) {
      throw new Error(`${failedUploads.length} 个文件上传失败`)
    }
  }

  // 关闭Modal
  const handleCancel = () => {
    if (uploading) {
      message.warning('上传进行中，请等待完成')
      return
    }
    hideUploadModal()
  }

  // 监听targetPath变化，显示当前配置信息
  const getTargetPathDisplay = () => {
    if (uploadTargetPath === 'custom' && uploadCustomPath) {
      return replacePathVariables(uploadCustomPath)
    }
    return currentPath || '根目录'
  }

  return (
    <Modal
      title="上传图片"
      open={visible}
      onCancel={handleCancel}
      width={600}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={uploading}>
          取消
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={files.length === 0}
          aria-label={uploading ? '正在上传' : '开始上传图片'}
        >
          {uploading ? '上传中...' : '开始上传'}
        </Button>,
      ]}
      className={isDark ? 'dark-modal' : ''}
      closable={!uploading}
      maskClosable={!uploading}
      aria-labelledby="upload-modal-title"
      aria-describedby="upload-modal-description"
    >
      <div id="upload-modal-description" className="sr-only">
        选择图片文件进行上传，上传设置可在设置弹窗中配置
      </div>
      
      {/* 显示当前上传配置 */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <div><span className="font-medium">上传路径：</span>{getTargetPathDisplay()}</div>
          <div><span className="font-medium">图片格式：</span>{uploadFormat === 'webp' ? '转换为WebP' : '保持原格式'}</div>
          <div><span className="font-medium">文件名策略：</span>{uploadNameStrategy === 'md5' ? '使用MD5命名' : '保留原文件名'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 可在设置中修改这些配置
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical">
        {/* 文件选择器 */}
        <Form.Item label="选择文件" htmlFor="file-upload-dragger">
          <Dragger
            id="file-upload-dragger"
            multiple
            accept="image/*"
            fileList={files.map((file, index) => ({
              uid: `${index}`,
              name: file.name,
              status: 'done' as const,
            }))}
            onChange={handleFileChange}
            beforeUpload={() => false}
            disabled={uploading}
            aria-label="拖拽或点击选择图片文件"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持单个或批量上传图片文件</p>
          </Dragger>
        </Form.Item>

        {/* 上传进度显示 */}
        {uploadProgress.length > 0 && (
          <div className="mt-4 space-y-2" role="region" aria-label="上传进度" aria-live="polite">
            <div className="font-medium">上传进度：</div>
            {uploadProgress.map((progress, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="truncate flex-1" title={progress.fileName}>
                    {progress.fileName}
                  </span>
                  <span className="ml-2" aria-label={`${progress.fileName} 的上传状态`}>
                    {progress.status === 'pending' && '等待中'}
                    {progress.status === 'uploading' && `${progress.progress}%`}
                    {progress.status === 'success' && '✓ 完成'}
                    {progress.status === 'error' && '✗ 失败'}
                  </span>
                </div>
                <Progress
                  percent={progress.progress}
                  status={
                    progress.status === 'error'
                      ? 'exception'
                      : progress.status === 'success'
                        ? 'success'
                        : 'active'
                  }
                  showInfo={false}
                  size="small"
                  aria-label={`${progress.fileName} 上传进度 ${progress.progress}%`}
                />
                {progress.error && (
                  <div className="text-xs text-red-500" role="alert">
                    {progress.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Form>
    </Modal>
  )
}
