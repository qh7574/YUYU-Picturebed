import type { IImageService } from '../types'
import { cacheService } from './cacheService'

class ImageService implements IImageService {
  // 并发控制：限制同时生成缩略图的数量
  private generatingQueue: Map<string, Promise<string>> = new Map()
  private maxConcurrent = 6 // 提高并发数
  private currentGenerating = 0
  
  // Blob URL 管理器：避免内存泄漏
  private blobUrlCache: Map<string, string> = new Map()
  
  // 正在处理的任务集合：避免重复请求
  private processingKeys: Set<string> = new Set()

  /**
   * 生成缩略图
   * @param file 原始图片文件
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @returns 缩略图Blob
   */
  async generateThumbnail(file: File, maxWidth: number = 300, maxHeight: number = 300): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)

        // 计算缩放比例
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // 创建canvas绘制缩略图
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('生成缩略图失败'))
            }
          },
          'image/jpeg',
          0.8
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('加载图片失败'))
      }

      img.src = url
    })
  }

  /**
   * 将图片转换为WebP格式
   * @param file 原始图片文件
   * @param quality 质量 (0-1)
   * @returns WebP格式的Blob
   */
  async convertToWebP(file: File, quality: number = 0.9): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'))
          return
        }

        ctx.drawImage(img, 0, 0)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('转换WebP失败'))
            }
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('加载图片失败'))
      }

      img.src = url
    })
  }

  /**
   * 计算文件的MD5值（16位）
   * @param file 文件
   * @returns 16位MD5字符串
   */
  async calculateMD5(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    // 返回前16位
    return hashHex.substring(0, 16)
  }

  /**
   * 批量下载图片
   * @param urls 图片URL列表
   * @param names 文件名列表
   */
  async downloadImages(urls: string[], names: string[]): Promise<void> {
    for (let i = 0; i < urls.length; i++) {
      await this.downloadSingleImage(urls[i], names[i])
      // 添加小延迟避免浏览器阻止多个下载
      if (i < urls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }
  }

  /**
   * 下载单个图片
   */
  private async downloadSingleImage(url: string, name: string): Promise<void> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error(`下载图片失败: ${name}`, error)
      throw error
    }
  }

  /**
   * 获取图片的原始尺寸
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.width, height: img.height })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('加载图片失败'))
      }

      img.src = url
    })
  }

  /**
   * 从URL生成并缓存缩略图（带并发控制）
   * @param url 图片URL
   * @param key 缓存key（通常是S3对象key）
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @returns 缩略图的Blob URL
   */
  async generateAndCacheThumbnailFromUrl(
    url: string,
    key: string,
    maxWidth: number = 300,
    maxHeight: number = 300
  ): Promise<string> {
    // 先检查 Blob URL 缓存
    if (this.blobUrlCache.has(key)) {
      return this.blobUrlCache.get(key)!
    }

    // 检查是否已经在生成队列中（避免重复请求）
    if (this.generatingQueue.has(key)) {
      return this.generatingQueue.get(key)!
    }

    // 创建生成任务
    const generateTask = this.generateThumbnailInternal(url, key, maxWidth, maxHeight)
    
    // 添加到队列
    this.generatingQueue.set(key, generateTask)
    this.processingKeys.add(key)
    
    try {
      const result = await generateTask
      // 缓存 Blob URL
      this.blobUrlCache.set(key, result)
      return result
    } finally {
      // 完成后从队列中移除
      this.generatingQueue.delete(key)
      this.processingKeys.delete(key)
    }
  }

  /**
   * 内部方法：实际生成缩略图
   */
  private async generateThumbnailInternal(
    url: string,
    key: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<string> {
    // 等待并发控制
    while (this.currentGenerating >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.currentGenerating++

    try {
      return await new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous' // 处理跨域图片

        img.onload = async () => {
          try {
            // 计算缩放比例
            let width = img.width
            let height = img.height

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height)
              width = Math.round(width * ratio)
              height = Math.round(height * ratio)
            }

            // 创建canvas绘制缩略图
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('无法创建Canvas上下文'))
              return
            }

            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  // 缓存缩略图
                  await cacheService.cacheThumbnail(key, blob)
                  // 返回Blob URL（不在这里创建，由调用方管理）
                  resolve(URL.createObjectURL(blob))
                } else {
                  reject(new Error('生成缩略图失败'))
                }
              },
              'image/jpeg',
              0.8
            )
          } catch (error) {
            reject(error)
          }
        }

        img.onerror = (error) => {
          console.error('图片加载失败，可能是CORS问题:', error)
          reject(error)
        }

        img.src = url
      })
    } finally {
      this.currentGenerating--
    }
  }

  /**
   * 批量预生成缩略图
   * @param items 包含URL和key的图片项列表
   * @param _concurrency 并发数量（已废弃，使用内部并发控制）
   */
  async preGenerateThumbnails(
    items: Array<{ url: string; key: string }>,
    _concurrency: number = 3
  ): Promise<void> {
    // 过滤掉已经在处理或已缓存的项
    const itemsToProcess = []
    
    for (const item of items) {
      // 跳过正在处理的
      if (this.isProcessing(item.key)) {
        continue
      }
      
      // 跳过已有缓存的
      if (this.blobUrlCache.has(item.key)) {
        continue
      }
      
      // 检查 IndexedDB 缓存
      const cached = await cacheService.getThumbnail(item.key)
      if (cached) {
        // 创建 Blob URL 并缓存
        const blobUrl = URL.createObjectURL(cached)
        this.blobUrlCache.set(item.key, blobUrl)
        continue
      }
      
      itemsToProcess.push(item)
    }

    // 批量生成（使用内部并发控制）
    const promises = itemsToProcess.map(item =>
      this.generateAndCacheThumbnailFromUrl(item.url, item.key).catch(error => {
        console.error(`预生成缩略图失败: ${item.key}`, error)
      })
    )

    await Promise.all(promises)
  }

  /**
   * 获取缓存的缩略图URL
   * @param key 缓存key
   * @returns 缩略图Blob URL，如果不存在则返回null
   */
  async getCachedThumbnailUrl(key: string): Promise<string | null> {
    // 先检查 Blob URL 缓存
    if (this.blobUrlCache.has(key)) {
      return this.blobUrlCache.get(key)!
    }

    // 检查 IndexedDB 缓存
    const cachedThumbnail = await cacheService.getThumbnail(key)
    if (cachedThumbnail) {
      const blobUrl = URL.createObjectURL(cachedThumbnail)
      this.blobUrlCache.set(key, blobUrl)
      return blobUrl
    }
    return null
  }

  /**
   * 检查是否正在处理某个key
   * @param key 缓存key
   * @returns 是否正在处理
   */
  isProcessing(key: string): boolean {
    return this.processingKeys.has(key)
  }

  /**
   * 清理指定key的Blob URL
   * @param key 缓存key
   */
  revokeBlobUrl(key: string): void {
    const url = this.blobUrlCache.get(key)
    if (url) {
      URL.revokeObjectURL(url)
      this.blobUrlCache.delete(key)
    }
  }

  /**
   * 清理所有Blob URL
   */
  revokeAllBlobUrls(): void {
    this.blobUrlCache.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    this.blobUrlCache.clear()
  }
}

// 导出单例实例
export const imageService = new ImageService()
