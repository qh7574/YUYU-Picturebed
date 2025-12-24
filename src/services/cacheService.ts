import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { GalleryItem, ICacheService, CachedDirectory, CachedThumbnail } from '../types'

// 默认缓存TTL：5分钟
const DEFAULT_TTL = 5 * 60 * 1000

// IndexedDB数据库名称和版本
const DB_NAME = 's3-image-gallery-cache'
const DB_VERSION = 1

// 定义数据库Schema
interface CacheDBSchema extends DBSchema {
  directories: {
    key: string
    value: CachedDirectory
  }
  thumbnails: {
    key: string
    value: CachedThumbnail
  }
}

/**
 * 缓存服务类
 * 使用IndexedDB存储目录列表和缩略图缓存
 */
class CacheService implements ICacheService {
  private db: IDBPDatabase<CacheDBSchema> | null = null
  private initPromise: Promise<void> | null = null

  /**
   * 初始化IndexedDB数据库
   */
  async init(): Promise<void> {
    // 避免重复初始化
    if (this.db) {
      return
    }

    // 如果正在初始化，等待完成
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.doInit()
    return this.initPromise
  }

  private async doInit(): Promise<void> {
    try {
      this.db = await openDB<CacheDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // 创建directories对象存储
          if (!db.objectStoreNames.contains('directories')) {
            db.createObjectStore('directories')
          }
          // 创建thumbnails对象存储
          if (!db.objectStoreNames.contains('thumbnails')) {
            db.createObjectStore('thumbnails')
          }
        },
      })
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      // 降级处理：不抛出错误，允许应用继续运行
      this.db = null
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBPDatabase<CacheDBSchema> | null> {
    if (!this.db) {
      await this.init()
    }
    return this.db
  }

  /**
   * 缓存目录列表
   * @param path 目录路径
   * @param items 目录内容
   * @param ttl 缓存有效期（毫秒），默认5分钟
   */
  async cacheDirectory(path: string, items: GalleryItem[], ttl: number = DEFAULT_TTL): Promise<void> {
    const db = await this.ensureDB()
    if (!db) return

    try {
      const cachedData: CachedDirectory = {
        items,
        timestamp: Date.now(),
        ttl,
      }
      await db.put('directories', cachedData, path)
    } catch (error) {
      console.error('Failed to cache directory:', error)
    }
  }

  /**
   * 获取缓存的目录列表
   * @param path 目录路径
   * @returns 目录内容，如果缓存不存在或已过期则返回null
   */
  async getDirectory(path: string): Promise<GalleryItem[] | null> {
    const db = await this.ensureDB()
    if (!db) return null

    try {
      const cached = await db.get('directories', path)
      if (!cached) {
        return null
      }

      // 检查TTL是否过期
      const now = Date.now()
      if (now - cached.timestamp > cached.ttl) {
        // 缓存已过期，删除并返回null
        await db.delete('directories', path)
        return null
      }

      return cached.items
    } catch (error) {
      console.error('Failed to get cached directory:', error)
      return null
    }
  }

  /**
   * 缓存缩略图
   * @param key 对象key
   * @param blob 缩略图Blob
   */
  async cacheThumbnail(key: string, blob: Blob): Promise<void> {
    const db = await this.ensureDB()
    if (!db) return

    try {
      const cachedData: CachedThumbnail = {
        blob,
        timestamp: Date.now(),
      }
      await db.put('thumbnails', cachedData, key)
    } catch (error) {
      console.error('Failed to cache thumbnail:', error)
    }
  }

  /**
   * 获取缓存的缩略图
   * @param key 对象key
   * @returns 缩略图Blob，如果不存在则返回null
   */
  async getThumbnail(key: string): Promise<Blob | null> {
    const db = await this.ensureDB()
    if (!db) return null

    try {
      const cached = await db.get('thumbnails', key)
      if (!cached) {
        return null
      }
      return cached.blob
    } catch (error) {
      console.error('Failed to get cached thumbnail:', error)
      return null
    }
  }

  /**
   * 清除特定路径的缓存
   * 会清除该路径及其所有子路径的目录缓存
   * @param path 路径
   */
  async clearPath(path: string): Promise<void> {
    const db = await this.ensureDB()
    if (!db) return

    try {
      const tx = db.transaction('directories', 'readwrite')
      const store = tx.objectStore('directories')
      
      // 获取所有key
      const keys = await store.getAllKeys()
      
      // 删除匹配的路径（包括子路径）
      const normalizedPath = path.endsWith('/') ? path : path + '/'
      for (const key of keys) {
        // 精确匹配或前缀匹配（子路径）
        if (key === path || key.startsWith(normalizedPath)) {
          await store.delete(key)
        }
      }
      
      // 同时清除父路径的缓存，因为父目录的内容可能已变化
      const parentPath = this.getParentPath(path)
      if (parentPath !== null && parentPath !== path) {
        await store.delete(parentPath)
      }
      
      await tx.done
    } catch (error) {
      console.error('Failed to clear path cache:', error)
    }
  }

  /**
   * 获取父路径
   */
  private getParentPath(path: string): string | null {
    if (!path || path === '' || path === '/') {
      return null
    }
    
    // 移除末尾斜杠
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path
    const lastSlashIndex = normalizedPath.lastIndexOf('/')
    
    if (lastSlashIndex === -1) {
      return '' // 根目录
    }
    
    return normalizedPath.substring(0, lastSlashIndex)
  }

  /**
   * 清除所有缓存
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB()
    if (!db) return

    try {
      await db.clear('directories')
      await db.clear('thumbnails')
    } catch (error) {
      console.error('Failed to clear all cache:', error)
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }
}

// 导出单例实例
export const cacheService = new CacheService()

// 导出类以便测试
export { CacheService }
