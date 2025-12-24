import React, { useEffect, useMemo } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useGalleryStore } from '../stores/galleryStore'

export const ImageViewer: React.FC = () => {
  const { viewerVisible, currentImageIndex, hideViewer, setCurrentImageIndex } = useUIStore()
  const { items } = useGalleryStore()

  // 过滤出所有图片项
  const imageItems = useMemo(() => {
    return items.filter((item) => item.type === 'image')
  }, [items])

  // 键盘导航支持
  useEffect(() => {
    if (!viewerVisible || imageItems.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (currentImageIndex < imageItems.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1)
          }
          break
        case 'Escape':
          e.preventDefault()
          hideViewer()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewerVisible, currentImageIndex, imageItems.length, setCurrentImageIndex, hideViewer])

  // 如果查看器不可见或没有图片，不渲染
  if (!viewerVisible || imageItems.length === 0) {
    return null
  }

  const currentItem = imageItems[currentImageIndex]
  if (!currentItem) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={hideViewer}
      role="dialog"
      aria-modal="true"
      aria-label="图片查看器"
    >
      {/* 关闭按钮 */}
      <button
        className="absolute top-2 sm:top-4 right-2 sm:right-4 text-white hover:text-gray-300 focus:text-gray-300 transition-colors z-10 p-2 focus:outline-none focus:ring-2 focus:ring-white rounded"
        onClick={hideViewer}
        aria-label="关闭图片查看器"
        title="关闭 (ESC)"
      >
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 左箭头 */}
      {currentImageIndex > 0 && (
        <button
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 focus:text-gray-300 transition-colors z-10 p-2 focus:outline-none focus:ring-2 focus:ring-white rounded"
          onClick={(e) => {
            e.stopPropagation()
            setCurrentImageIndex(currentImageIndex - 1)
          }}
          aria-label="上一张图片"
          title="上一张 (←)"
        >
          <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 右箭头 */}
      {currentImageIndex < imageItems.length - 1 && (
        <button
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 focus:text-gray-300 transition-colors z-10 p-2 focus:outline-none focus:ring-2 focus:ring-white rounded"
          onClick={(e) => {
            e.stopPropagation()
            setCurrentImageIndex(currentImageIndex + 1)
          }}
          aria-label="下一张图片"
          title="下一张 (→)"
        >
          <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 图片信息 */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-white text-center z-10 px-4 max-w-full">
        <div className="text-xs sm:text-sm mb-1 truncate max-w-[90vw]" title={currentItem.name}>
          {currentItem.name}
        </div>
        <div className="text-xs text-gray-400" aria-live="polite" aria-atomic="true">
          {currentImageIndex + 1} / {imageItems.length}
        </div>
      </div>

      {/* 图片容器 */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentItem.fullUrl || currentItem.thumbnailUrl || ''}
          alt={currentItem.name}
          className="max-w-full max-h-[90vh] object-contain"
          loading="lazy"
        />
      </div>
    </div>
  )
}
