import React, { useState, useEffect } from 'react'
import { getS3Service } from '../services/s3Service'

export interface CopyModalProps {
  visible: boolean
  currentKey: string
  currentPath: string
  onClose: () => void
  onCopy: (targetPath: string) => Promise<void>
  isBatch?: boolean
  batchCount?: number
}

export const CopyModal: React.FC<CopyModalProps> = ({
  visible,
  currentKey,
  currentPath,
  onClose,
  onCopy,
  isBatch = false,
  batchCount = 0,
}) => {
  const [targetPath, setTargetPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)

  useEffect(() => {
    if (visible) {
      setTargetPath(currentPath)
      setError(null)
      loadFolders()
    }
  }, [visible, currentPath])

  const loadFolders = async () => {
    const s3Service = getS3Service()
    if (!s3Service) return

    setLoadingFolders(true)
    try {
      // 加载根目录的文件夹列表
      const objects = await s3Service.listObjects('')
      const folderList = objects
        .filter((obj) => obj.isFolder)
        .map((obj) => obj.key)
      setFolders(['', ...folderList]) // 包含根目录
    } catch (err) {
      console.error('加载文件夹列表失败:', err)
    } finally {
      setLoadingFolders(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isBatch) {
      // 单个文件复制时检查路径
      const fileName = currentKey.split('/').pop() || ''
      const newKey = targetPath ? `${targetPath}${fileName}` : fileName

      if (newKey === currentKey) {
        setError('目标路径与当前路径相同')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      await onCopy(targetPath)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '复制失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 
            id="copy-modal-title"
            className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            {isBatch ? `批量复制 (${batchCount}项)` : '复制文件'}
          </h2>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit}>
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="mb-4">
              <label
                htmlFor="targetPath"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                目标路径
              </label>
              
              {loadingFolders ? (
                <div 
                  className="text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                  role="status"
                  aria-live="polite"
                >
                  加载文件夹列表...
                </div>
              ) : (
                <select
                  id="targetPath"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  aria-describedby="targetPath-hint"
                >
                  <option value="">根目录 (/)</option>
                  {folders.slice(1).map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-4">
              <label 
                htmlFor="customPath"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                或输入自定义路径
              </label>
              <input
                id="customPath"
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="例如: images/2024/"
                aria-describedby="customPath-hint"
              />
              <p 
                id="customPath-hint"
                className="mt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                路径应以 / 结尾，留空表示根目录
              </p>
            </div>

            {!isBatch && (
              <div 
                id="targetPath-hint"
                className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2"
              >
                当前位置: {currentKey}
              </div>
            )}

            {error && (
              <div 
                className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              aria-label="取消复制"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              aria-label={loading ? '正在复制文件' : '确认复制文件'}
            >
              {loading ? '复制中...' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
