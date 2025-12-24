import React, { useMemo, useEffect, useState, useCallback } from 'react'
import { Pagination } from 'antd'
import type { GalleryProps } from '../types'
import { ImageCard } from './ImageCard'
import { FolderCard } from './FolderCard'
import { throttle } from '../utils/performanceUtils'

export const Gallery: React.FC<GalleryProps> = ({
  items,
  loading,
  onItemClick,
  onFolderClick,
  selectedItems,
  onSelectionChange,
  onDownload,
  onCopyUrl,
  onDelete,
  onRename,
  onMove,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  // 监听窗口大小变化，使用节流优化（比防抖更流畅）
  useEffect(() => {
    const handleResize = throttle(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }, 150) // 使用节流，每150ms最多更新一次

    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 计算网格布局参数
  const { columnCount } = useMemo(() => {
    const containerWidth = windowSize.width - 32 // 减去padding
    const minCardWidth = 140 // 最小卡片宽度
    const maxCardWidth = 260 // 最大卡片宽度，限制全屏时的大小
    const gap = 12

    let cols = Math.floor((containerWidth + gap) / (minCardWidth + gap))
    cols = Math.max(2, Math.min(cols, 10)) // 限制在2-10列之间
    
    // 如果计算出的卡片宽度超过最大值，增加列数
    const calculatedCardWidth = (containerWidth - (cols - 1) * gap) / cols
    if (calculatedCardWidth > maxCardWidth && cols < 10) {
      cols = Math.floor((containerWidth + gap) / (maxCardWidth + gap))
      cols = Math.max(2, Math.min(cols, 10))
    }

    return {
      columnCount: cols,
    }
  }, [windowSize])

  // 处理文件夹点击
  const handleFolderClick = useCallback((folderKey: string) => {
    onFolderClick(folderKey)
  }, [onFolderClick])

  // 处理图片点击
  const handleImageClick = useCallback((item: typeof items[0]) => {
    onItemClick(item)
  }, [onItemClick])

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  // 空状态
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="text-gray-500 dark:text-gray-400">暂无内容</div>
      </div>
    )
  }

  // 普通网格布局
  // 注意：虚拟滚动功能已通过懒加载和缓存优化实现
  // 当图片数量很大时，Intersection Observer会确保只加载可见区域的图片
  return (
    <>
      <main className="w-full px-2 sm:px-3 md:px-4 py-3 sm:py-4" role="main">
        <div
          className="grid gap-2 sm:gap-3 w-full"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
          role="list"
          aria-label="图片和文件夹列表"
        >
          {items.map((item) => {
            const isSelected = selectedItems.has(item.key)
            const isBackItem = item.key === '__back__'

            // 文件夹卡片
            if (item.type === 'folder') {
              return (
                <FolderCard
                  key={item.key}
                  item={item}
                  onClick={() => handleFolderClick(item.key)}
                  onDelete={!isBackItem ? () => onDelete?.(item) : undefined}
                  onRename={!isBackItem ? () => onRename?.(item) : undefined}
                  onMove={!isBackItem ? () => onMove?.(item) : undefined}
                  isBackItem={isBackItem}
                />
              )
            }

            // 图片卡片
            return (
              <ImageCard
                key={item.key}
                item={item}
                selected={isSelected}
                onSelect={(selected) => onSelectionChange(item.key, selected)}
                onClick={() => handleImageClick(item)}
                onDownload={() => onDownload?.(item)}
                onCopyUrl={() => onCopyUrl?.(item)}
                onDelete={() => onDelete?.(item)}
                onRename={() => onRename?.(item)}
                onMove={() => onMove?.(item)}
              />
            )
          })}
        </div>
      </main>
      
      {/* 分页器 */}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center py-6">
          <Pagination
            current={currentPage}
            total={totalPages * 10} // Ant Design 需要 total 项数
            pageSize={10}
            onChange={onPageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={() => `共 ${totalPages} 页`}
          />
        </div>
      )}
    </>
  )
}
