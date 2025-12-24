import { create } from 'zustand'
import type { GalleryItem } from '../types'
import { getS3Service } from '../services/s3Service'
import { cacheService } from '../services/cacheService'
import { imageService } from '../services/imageService'

interface GalleryState {
  items: GalleryItem[]
  loading: boolean
  error: string | null
  currentPath: string
  setItems: (items: GalleryItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearItems: () => void
  loadItems: (path: string) => Promise<void>
  refreshItems: () => Promise<void>
  preloadThumbnails: () => Promise<void>
}

/**
 * 对GalleryItem进行排序：文件夹优先，然后按名称排序
 */
function sortGalleryItems(items: GalleryItem[]): GalleryItem[] {
  return [...items].sort((a, b) => {
    // 文件夹优先
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    // 同类型按名称排序
    return a.name.localeCompare(b.name)
  })
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  currentPath: '',

  setItems: (items: GalleryItem[]) => set({ items: sortGalleryItems(items), error: null }),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (error: string | null) => set({ error, loading: false }),

  clearItems: () => set({ items: [], error: null }),

  /**
   * 加载指定路径的内容
   * 优先从缓存加载，缓存不存在或过期时从S3加载
   */
  loadItems: async (path: string) => {
    const s3Service = getS3Service()
    if (!s3Service) {
      set({ error: '请先配置S3连接信息', loading: false })
      return
    }

    set({ loading: true, error: null, currentPath: path })

    try {
      // 先尝试从缓存获取
      const cachedItems = await cacheService.getDirectory(path)
      if (cachedItems) {
        set({ items: sortGalleryItems(cachedItems), loading: false })
        // 后台预加载缩略图
        get().preloadThumbnails()
        return
      }

      // 缓存不存在或已过期，从S3加载
      const s3Objects = await s3Service.listObjects(path)
      
      // 转换S3Object为GalleryItem
      const galleryItems: GalleryItem[] = s3Objects.map((obj) => {
        // 获取文件名（去除路径前缀）
        const name = obj.key.replace(path, '').replace(/\/$/, '')
        
        if (obj.isFolder) {
          return {
            type: 'folder' as const,
            key: obj.key,
            name: name,
          }
        } else {
          return {
            type: 'image' as const,
            key: obj.key,
            name: name,
            fullUrl: s3Service.getObjectUrl(obj.key),
            thumbnailUrl: undefined, // 不设置缩略图URL，让ImageCard组件按需生成
            size: obj.size,
            lastModified: obj.lastModified,
          }
        }
      }).filter(item => item.name) // 过滤掉空名称的项

      // 排序并更新状态
      const sortedItems = sortGalleryItems(galleryItems)
      set({ items: sortedItems, loading: false })

      // 缓存结果
      await cacheService.cacheDirectory(path, sortedItems)
      
      // 后台预加载缩略图
      get().preloadThumbnails()
    } catch (error) {
      console.error('加载目录失败:', error)
      set({ 
        error: error instanceof Error ? error.message : '加载目录失败', 
        loading: false 
      })
    }
  },

  /**
   * 刷新当前路径的内容
   * 清除缓存后重新加载
   */
  refreshItems: async () => {
    const { currentPath, loadItems } = get()
    
    // 清除当前路径的缓存
    await cacheService.clearPath(currentPath)
    
    // 重新加载
    await loadItems(currentPath)
  },

  /**
   * 预加载当前列表中的缩略图
   * 在后台异步执行，不阻塞UI
   */
  preloadThumbnails: async () => {
    const { items } = get()
    
    // 只预加载图片项
    const imageItems = items
      .filter(item => item.type === 'image' && item.fullUrl)
      .map(item => ({
        url: item.fullUrl!,
        key: item.key,
      }))

    if (imageItems.length === 0) {
      return
    }

    // 后台预生成缩略图，不等待完成
    imageService.preGenerateThumbnails(imageItems, 3).catch(error => {
      console.error('预加载缩略图失败:', error)
    })
  },
}))
