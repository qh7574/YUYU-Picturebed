import React, { useState, useEffect } from 'react'

export interface RenameModalProps {
  visible: boolean
  currentName: string
  onClose: () => void
  onRename: (newName: string) => Promise<void>
}

export const RenameModal: React.FC<RenameModalProps> = ({
  visible,
  currentName,
  onClose,
  onRename,
}) => {
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setNewName(currentName)
      setError(null)
    }
  }, [visible, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newName.trim()) {
      setError('文件名不能为空')
      return
    }

    if (newName === currentName) {
      setError('新文件名与原文件名相同')
      return
    }

    // 验证文件名（不能包含特殊字符）
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(newName)) {
      setError('文件名不能包含特殊字符: < > : " / \\ | ? *')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onRename(newName)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '重命名失败')
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
      aria-labelledby="rename-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 
            id="rename-modal-title"
            className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            重命名文件
          </h2>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit}>
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="mb-4">
              <label
                htmlFor="newName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                新文件名
              </label>
              <input
                id="newName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="请输入新文件名"
                autoFocus
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'rename-error' : 'rename-hint'}
              />
            </div>

            <div 
              id="rename-hint"
              className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2"
            >
              原文件名: {currentName}
            </div>

            {error && (
              <div 
                id="rename-error"
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
              aria-label="取消重命名"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              aria-label={loading ? '正在重命名' : '确认重命名'}
            >
              {loading ? '重命名中...' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
