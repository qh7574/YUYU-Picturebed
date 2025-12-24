import React, { useState, useRef, useEffect } from 'react'
import type { ImageCardProps } from '../types'
import { imageService } from '../services/imageService'
import { useCorsStore } from '../stores/corsStore'

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  selected,
  onSelect,
  onClick,
  onDownload,
  onCopyUrl,
  onDelete,
  onRename,
  onMove,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [useOriginalImage, setUseOriginalImage] = useState(false) // 是否使用原图（CSS缩放模式）
  const imgRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const { corsAvailable, corsErrorShown, setCorsAvailable, setCorsErrorShown } = useCorsStore()

  // 使用 Intersection Observer 实现懒加载，增加预加载距离
  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '400px', // 增加预加载距离，提前加载
        threshold: 0.01, // 只要1%可见就开始加载
      }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  // 当图片进入视口时，尝试生成并加载缩略图
  useEffect(() => {
    if (!isInView || !item.fullUrl) return

    const loadThumbnail = async () => {
      try {
        setIsGenerating(true)
        setLoadError(false)
        
        // 先尝试获取缓存的缩略图（包括 Blob URL 缓存）
        const cachedUrl = await imageService.getCachedThumbnailUrl(item.key)
        if (cachedUrl) {
          setThumbnailUrl(cachedUrl)
          setIsGenerating(false)
          // 缓存可用说明之前 CORS 是正常的
          if (corsAvailable === null) {
            setCorsAvailable(true)
          }
          return
        }
        
        // 如果有预设的缩略图URL，使用它
        if (item.thumbnailUrl) {
          setThumbnailUrl(item.thumbnailUrl)
          setIsGenerating(false)
          return
        }
        
        // 如果没有缓存也没有预设缩略图，尝试生成缩略图
        if (item.fullUrl) {
          try {
            // 首次尝试使用 CORS 方式（最快）
            const generatedUrl = await imageService.generateAndCacheThumbnailFromUrl(
              item.fullUrl,
              item.key,
              300,
              300
            )
            setThumbnailUrl(generatedUrl)
            setIsGenerating(false)
            
            // 成功生成说明 CORS 可用
            if (corsAvailable === null) {
              setCorsAvailable(true)
            }
          } catch (error) {
            // CORS 失败，使用原图但优化加载
            console.warn('CORS方式失败，使用原图优化加载模式:', error)
            
            // 标记 CORS 不可用
            if (corsAvailable === null) {
              setCorsAvailable(false)
              setCorsErrorShown(true)
            }
            
            // 使用原图，但通过 CSS 和浏览器优化
            setUseOriginalImage(true)
            setThumbnailUrl(item.fullUrl)
            setIsGenerating(false)
          }
        }
      } catch (error) {
        console.error('加载缩略图失败:', error)
        setLoadError(true)
        setIsGenerating(false)
      }
    }

    loadThumbnail()

    // 清理函数：不再需要手动释放 Blob URL，由 imageService 统一管理
    return () => {
      // Blob URL 由 imageService 的缓存管理，这里不需要释放
    }
  }, [isInView, item.key, item.thumbnailUrl, item.fullUrl, corsAvailable, corsErrorShown, setCorsAvailable, setCorsErrorShown])

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect(e.target.checked)
  }

  const handleImageClick = () => {
    onClick()
  }

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload()
  }

  const handleCopyUrlClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopyUrl()
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

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

  // 处理图片加载错误
  const handleImageError = () => {
    console.warn('缩略图显示失败')
    setLoadError(true)
  }

  return (
    <article
      ref={imgRef}
      className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 w-full shadow-md hover:shadow-xl transition-shadow duration-300 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ 
        contentVisibility: 'auto',
        // 添加固定高度提示，优化布局稳定性
        containIntrinsicSize: '300px',
        aspectRatio: '1',
      }}
      role="listitem"
    >
      {/* 复选框 - 左上角 */}
      <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-20">
        <input
          type="checkbox"
          id={`image-checkbox-${item.key}`}
          name={`image-checkbox-${item.key}`}
          checked={selected}
          onChange={handleCheckboxChange}
          className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer accent-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label={`选择 ${item.name}`}
        />
      </div>

      {/* 图片区域 */}
      <div
        className="w-full h-full cursor-pointer overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 relative"
        onClick={handleImageClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleImageClick()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`查看图片 ${item.name}`}
      >
        {loadError ? (
          // 加载失败，显示错误图标
          <div className="w-full h-full flex flex-col items-center justify-center gap-2" role="status" aria-label="加载失败">
            <svg className="w-16 h-16 text-red-400 dark:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">加载失败</span>
          </div>
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              // 原图模式的性能优化
              ...(useOriginalImage ? {
                imageRendering: '-webkit-optimize-contrast', // 优化渲染质量
                transform: 'translateZ(0)', // 启用 GPU 加速
                backfaceVisibility: 'hidden', // 优化渲染
                WebkitBackfaceVisibility: 'hidden',
              } : {
                willChange: isLoaded ? 'auto' : 'opacity',
              }),
            }}
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            // 原图模式不使用 crossOrigin，避免 CORS 错误
            {...(!useOriginalImage ? { crossOrigin: 'anonymous' as const } : {})}
            // 添加尺寸提示，帮助浏览器优化
            width={300}
            height={300}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3" role="status" aria-label="加载中">
            {isGenerating ? (
              <>
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">生成缩略图中...</span>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* 图片信息和操作按钮 - 半透明叠加在图片底部 */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
          {/* 文件名 */}
          <div
            className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate mb-1.5 sm:mb-2"
            title={item.name}
          >
            {item.name}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-around gap-0.5 sm:gap-1" role="toolbar" aria-label={`${item.name} 的操作`}>
            {/* 下载按钮 */}
            <button
              onClick={handleDownloadClick}
              className="flex-1 flex items-center justify-center p-1 sm:p-1.5 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 focus:bg-white/50 dark:focus:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`下载 ${item.name}`}
              title="下载"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>

            {/* 复制路径按钮 */}
            <button
              onClick={handleCopyUrlClick}
              className="flex-1 flex items-center justify-center p-1 sm:p-1.5 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 focus:bg-white/50 dark:focus:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`复制 ${item.name} 的路径`}
              title="复制路径"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* 删除按钮 */}
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

            {/* 更多按钮 */}
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
                  <button
                    onClick={handleRenameClick}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-t-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    role="menuitem"
                  >
                    重命名
                  </button>
                  <button
                    onClick={handleMoveClick}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-b-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    role="menuitem"
                  >
                    移动
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
