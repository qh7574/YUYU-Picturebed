import React from 'react'
import type { BreadcrumbProps } from '../types'

/**
 * Breadcrumb组件 - 路径栏
 * 显示当前路径，支持路径段点击导航
 * 显示批量操作按钮（根据选中数量显示/隐藏）
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentPath,
  onNavigate,
  selectedCount,
  onSelectAll,
  onBatchDownload,
  onBatchCopy,
  onBatchCopyUrl,
  onBatchMove,
  onBatchDelete,
}) => {
  // 解析路径为路径段
  const pathSegments = React.useMemo(() => {
    if (!currentPath || currentPath === '/') {
      return [{ name: '根目录', path: '' }]
    }

    const segments = currentPath.split('/').filter(Boolean)
    const result = [{ name: '根目录', path: '' }]

    let accumulatedPath = ''
    for (const segment of segments) {
      accumulatedPath += (accumulatedPath ? '/' : '') + segment
      result.push({ name: segment, path: accumulatedPath })
    }

    return result
  }, [currentPath])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-2">
      {/* 路径导航 */}
      <nav 
        className="flex items-center space-x-1 sm:space-x-2 flex-1 overflow-x-auto w-full sm:w-auto"
        aria-label="面包屑导航"
      >
        {pathSegments.map((segment, index) => (
          <React.Fragment key={segment.path}>
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">/</span>
            )}
            <button
              onClick={() => onNavigate(segment.path)}
              className={`
                px-2 py-1 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${
                  index === pathSegments.length - 1
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 cursor-default'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              disabled={index === pathSegments.length - 1}
              aria-current={index === pathSegments.length - 1 ? 'page' : undefined}
              aria-label={`导航到 ${segment.name}`}
            >
              {segment.name}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* 批量操作按钮 */}
      {selectedCount > 0 && (
        <div 
          className="flex items-center flex-wrap gap-1 sm:gap-2 w-full sm:w-auto sm:ml-4"
          role="toolbar"
          aria-label="批量操作"
        >
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mr-1">
            已选中 {selectedCount} 项
          </span>

          {/* 全选按钮 */}
          {onSelectAll && (
            <button
              onClick={onSelectAll}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:bg-gray-200 dark:focus:bg-gray-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              title="全选本页"
              aria-label="全选本页所有项目"
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 inline-block sm:mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span className="hidden sm:inline">全选</span>
            </button>
          )}

          {/* 批量复制文件 */}
          {onBatchCopy && (
            <button
              onClick={onBatchCopy}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:bg-gray-200 dark:focus:bg-gray-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              title="批量复制文件"
              aria-label={`批量复制 ${selectedCount} 个项目`}
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 inline-block sm:mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">复制</span>
            </button>
          )}

          {/* 批量移动 */}
          {onBatchMove && (
            <button
              onClick={onBatchMove}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:bg-gray-200 dark:focus:bg-gray-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              title="批量移动"
              aria-label={`批量移动 ${selectedCount} 个项目`}
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 inline-block sm:mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">移动</span>
            </button>
          )}

          {/* 批量删除 */}
          <button
            onClick={onBatchDelete}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:bg-red-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            title="批量删除"
            aria-label={`批量删除 ${selectedCount} 个项目`}
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 inline-block sm:mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span className="hidden sm:inline">删除</span>
          </button>

          {/* 批量复制链接 */}
          <button
            onClick={onBatchCopyUrl}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:bg-gray-200 dark:focus:bg-gray-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
            title="批量复制链接"
            aria-label={`批量复制 ${selectedCount} 个项目的链接`}
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 inline-block sm:mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="hidden sm:inline">复制链接</span>
          </button>

          {/* 批量下载 */}
          <button
            onClick={onBatchDownload}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            title="批量下载"
            aria-label={`批量下载 ${selectedCount} 个项目`}
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 inline-block sm:mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">下载</span>
          </button>
        </div>
      )}
    </div>
  )
}
