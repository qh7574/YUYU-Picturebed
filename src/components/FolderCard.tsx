import React, { useState, useRef, useEffect } from 'react'
import type { GalleryItem } from '../types'

interface FolderCardProps {
  item: GalleryItem
  onClick: () => void
  onDelete?: () => void
  onRename?: () => void
  onMove?: () => void
  isBackItem?: boolean
}

export const FolderCard: React.FC<FolderCardProps> = ({
  item,
  onClick,
  onDelete,
  onRename,
  onMove,
  isBackItem = false,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭更多菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false)
      }
    }

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMoreMenu(!showMoreMenu)
  }

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMoreMenu(false)
    onRename?.()
  }

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMoreMenu(false)
    onMove?.()
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMoreMenu(false)
    onDelete?.()
  }

  return (
    <article
      className="relative rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-all duration-300 w-full overflow-hidden shadow-md hover:shadow-xl"
      style={{ aspectRatio: '1' }}
      role="listitem"
    >
      {/* 文件夹主体 - 可点击区域，排除底部操作栏的高度 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ 
          bottom: !isBackItem && (onDelete || onRename || onMove) ? '70px' : '0' 
        }}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        tabIndex={0}
        aria-label={isBackItem ? '返回上一级目录' : `打开文件夹 ${item.name}`}
      >
        {isBackItem ? (
          // 返回上一级图标
          <svg
            className="w-12 h-12 sm:w-14 sm:h-14 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        ) : (
          // 普通文件夹图标
          <svg
            className="w-12 h-12 sm:w-14 sm:h-14 text-blue-500 dark:text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        )}
      </div>

      {/* 操作按钮 - 只对普通文件夹显示，半透明叠加在底部 */}
      {!isBackItem && (onDelete || onRename || onMove) && (
        <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
          {/* 文件名 */}
          <div
            className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate mb-1.5 sm:mb-2"
            title={item.name}
          >
            {item.name}
          </div>

          <div className="flex items-center justify-around gap-0.5 sm:gap-1" role="toolbar" aria-label={`${item.name} 的操作`}>
            {/* 重命名按钮 */}
            {onRename && (
              <button
                onClick={handleRenameClick}
                className="flex-1 flex items-center justify-center p-1 sm:p-1.5 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 focus:bg-white/50 dark:focus:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`重命名 ${item.name}`}
                title="重命名"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}

            {/* 移动按钮 */}
            {onMove && (
              <button
                onClick={handleMoveClick}
                className="flex-1 flex items-center justify-center p-1 sm:p-1.5 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 focus:bg-white/50 dark:focus:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`移动 ${item.name}`}
                title="移动"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </button>
            )}

            {/* 删除按钮 */}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="flex-1 flex items-center justify-center p-1 sm:p-1.5 rounded hover:bg-red-50/50 dark:hover:bg-red-900/30 focus:bg-red-50/50 dark:focus:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`删除 ${item.name}`}
                title="删除"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400"
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
              </button>
            )}

            {/* 更多按钮 */}
            {(onRename || onMove) && (
              <div className="relative flex-1" ref={moreMenuRef}>
                <button
                  onClick={handleMoreClick}
                  className="w-full flex items-center justify-center p-1 sm:p-1.5 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 focus:bg-white/50 dark:focus:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`${item.name} 的更多操作`}
                  aria-expanded={showMoreMenu}
                  aria-haspopup="true"
                  title="更多"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {/* 更多菜单 */}
                {showMoreMenu && (
                  <div 
                    className="absolute bottom-full right-0 mb-1 w-28 sm:w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20"
                    role="menu"
                    aria-label="更多操作菜单"
                  >
                    {onRename && (
                      <button
                        onClick={handleRenameClick}
                        className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-t-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        role="menuitem"
                      >
                        重命名
                      </button>
                    )}
                    {onMove && (
                      <button
                        onClick={handleMoveClick}
                        className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-b-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        role="menuitem"
                      >
                        移动
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
