import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3'
import type { S3Config, S3Object, BatchOperationResult, IS3Service } from '../types'

/**
 * S3操作服务
 * 提供与S3兼容存储服务的交互功能
 */
export class S3Service implements IS3Service {
  private client: S3Client
  private config: S3Config

  constructor(config: S3Config) {
    this.config = config
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // 对于非AWS S3（如R2）需要启用
    })
  }

  /**
   * 列出指定前缀下的所有对象
   * @param prefix 路径前缀
   * @returns S3对象列表
   */
  async listObjects(prefix: string): Promise<S3Object[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        Delimiter: '/', // 使用分隔符来区分文件夹
      })

      const response = await this.client.send(command)
      const objects: S3Object[] = []

      // 处理文件夹（CommonPrefixes）
      if (response.CommonPrefixes) {
        for (const prefix of response.CommonPrefixes) {
          if (prefix.Prefix) {
            objects.push({
              key: prefix.Prefix,
              size: 0,
              lastModified: new Date(),
              isFolder: true,
            })
          }
        }
      }

      // 处理文件（Contents）
      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key && item.Key !== prefix) {
            // 排除前缀本身
            objects.push({
              key: item.Key,
              size: item.Size || 0,
              lastModified: item.LastModified || new Date(),
              isFolder: false,
            })
          }
        }
      }

      return objects
    } catch (error) {
      console.error('列出对象失败:', error)
      throw new Error(`列出对象失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 上传对象到S3
   * @param key 对象键（路径）
   * @param file 文件Blob
   */
  async uploadObject(key: string, file: Blob): Promise<void> {
    try {
      // 在浏览器环境中，需要将 Blob 转换为 ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: uint8Array,
        ContentType: file.type,
      })

      await this.client.send(command)
    } catch (error) {
      console.error('上传对象失败:', error)
      throw new Error(`上传对象失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 删除单个对象
   * @param key 对象键
   */
  async deleteObject(key: string): Promise<void> {
    try {
      // 判断是否为文件夹
      const isFolder = key.endsWith('/')
      
      if (isFolder) {
        // 文件夹删除：需要递归删除所有子对象
        await this.deleteFolderRecursive(key)
      } else {
        // 文件删除：直接删除
        const command = new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })

        await this.client.send(command)
      }
    } catch (error) {
      console.error('删除对象失败:', error)
      throw new Error(`删除对象失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 递归删除文件夹及其所有内容
   * @param prefix 文件夹前缀
   */
  private async deleteFolderRecursive(prefix: string): Promise<void> {
    // 列出文件夹下的所有对象（不使用分隔符，获取所有子对象）
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: prefix,
    })

    const response = await this.client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      // 空文件夹或文件夹不存在
      return
    }

    // 收集所有需要删除的 key
    const keysToDelete = response.Contents.map((item) => item.Key).filter(Boolean) as string[]
    
    if (keysToDelete.length > 0) {
      // 批量删除所有对象
      await this.deleteObjects(keysToDelete)
    }
  }

  /**
   * 批量删除对象
   * @param keys 对象键数组
   * @returns 批量操作结果
   */
  async deleteObjects(keys: string[]): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: [],
      failed: [],
    }

    if (keys.length === 0) {
      return result
    }

    try {
      // AWS SDK支持一次最多删除1000个对象
      const batchSize = 1000
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize)

        const command = new DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
            Quiet: false,
          },
        })

        const response = await this.client.send(command)

        // 记录成功删除的对象
        if (response.Deleted) {
          for (const deleted of response.Deleted) {
            if (deleted.Key) {
              result.success.push(deleted.Key)
            }
          }
        }

        // 记录失败的对象
        if (response.Errors) {
          for (const error of response.Errors) {
            if (error.Key) {
              result.failed.push({
                key: error.Key,
                error: error.Message || '未知错误',
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('批量删除对象失败:', error)
      // 如果整个批量操作失败，将所有键标记为失败
      for (const key of keys) {
        if (!result.success.includes(key)) {
          result.failed.push({
            key,
            error: error instanceof Error ? error.message : '未知错误',
          })
        }
      }
    }

    return result
  }

  /**
   * 重命名对象（通过复制+删除实现）
   * @param oldKey 原对象键
   * @param newKey 新对象键
   */
  async renameObject(oldKey: string, newKey: string): Promise<void> {
    try {
      // 判断是否为文件夹
      const isFolder = oldKey.endsWith('/')
      
      if (isFolder) {
        // 文件夹重命名：需要递归处理所有子对象
        await this.renameFolderRecursive(oldKey, newKey)
      } else {
        // 文件重命名：直接复制+删除
        const copyCommand = new CopyObjectCommand({
          Bucket: this.config.bucket,
          CopySource: `${this.config.bucket}/${oldKey}`,
          Key: newKey,
        })

        await this.client.send(copyCommand)
        await this.deleteObject(oldKey)
      }
    } catch (error) {
      console.error('重命名对象失败:', error)
      throw new Error(`重命名对象失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 递归重命名文件夹及其所有内容
   * @param oldPrefix 原文件夹前缀
   * @param newPrefix 新文件夹前缀
   */
  private async renameFolderRecursive(oldPrefix: string, newPrefix: string): Promise<void> {
    // 列出文件夹下的所有对象（不使用分隔符，获取所有子对象）
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: oldPrefix,
    })

    const response = await this.client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      // 空文件夹，只需创建新文件夹标记
      await this.uploadObject(newPrefix, new Blob([]))
      await this.deleteObject(oldPrefix)
      return
    }

    // 复制所有对象到新路径
    const copyPromises = response.Contents.map(async (item) => {
      if (!item.Key) return
      
      // 构建新的 key（替换前缀）
      const relativePath = item.Key.substring(oldPrefix.length)
      const newKey = newPrefix + relativePath
      
      // 跳过文件夹标记对象（大小为0且以/结尾）
      if (item.Key.endsWith('/') && (item.Size === 0 || !item.Size)) {
        return
      }
      
      // 复制对象
      const copyCommand = new CopyObjectCommand({
        Bucket: this.config.bucket,
        CopySource: `${this.config.bucket}/${item.Key}`,
        Key: newKey,
      })
      
      await this.client.send(copyCommand)
    })

    await Promise.all(copyPromises)

    // 创建新文件夹标记
    await this.uploadObject(newPrefix, new Blob([]))

    // 删除所有旧对象
    const keysToDelete = response.Contents.map((item) => item.Key).filter(Boolean) as string[]
    if (keysToDelete.length > 0) {
      await this.deleteObjects(keysToDelete)
    }
  }

  /**
   * 移动对象（通过复制+删除实现）
   * @param oldKey 原对象键
   * @param newKey 新对象键
   */
  async moveObject(oldKey: string, newKey: string): Promise<void> {
    // 移动和重命名的实现相同
    return this.renameObject(oldKey, newKey)
  }

  /**
   * 测试S3连接
   * @returns 连接是否成功
   */
  async testConnection(): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.config.bucket,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      console.error('测试连接失败:', error)
      return false
    }
  }

  /**
   * 生成对象的访问URL
   * @param key 对象键
   * @returns 访问URL
   */
  getObjectUrl(key: string): string {
    // 如果配置了自定义域名，使用自定义域名
    if (this.config.customDomain) {
      const domain = this.config.customDomain.replace(/\/$/, '') // 移除末尾斜杠
      return `${domain}/${key}`
    }

    // 否则使用endpoint构建URL
    const endpoint = this.config.endpoint.replace(/\/$/, '')
    
    // 判断endpoint格式，构建正确的URL
    // 对于path-style URL: https://endpoint/bucket/key
    // 对于virtual-hosted-style URL: https://bucket.endpoint/key
    if (endpoint.includes('://')) {
      // 使用path-style（适用于大多数S3兼容服务）
      return `${endpoint}/${this.config.bucket}/${key}`
    } else {
      // 如果endpoint没有协议，添加https
      return `https://${endpoint}/${this.config.bucket}/${key}`
    }
  }

  /**
   * 更新配置并重新初始化客户端
   * @param config 新的S3配置
   */
  updateConfig(config: S3Config): void {
    this.config = config
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    })
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    this.client.destroy()
  }
}

// 创建单例实例（需要配置后才能使用）
let s3ServiceInstance: S3Service | null = null

/**
 * 初始化S3服务
 * @param config S3配置
 * @returns S3服务实例
 */
export function initS3Service(config: S3Config): S3Service {
  if (s3ServiceInstance) {
    s3ServiceInstance.destroy()
  }
  s3ServiceInstance = new S3Service(config)
  return s3ServiceInstance
}

/**
 * 获取S3服务实例
 * @returns S3服务实例，如果未初始化则返回null
 */
export function getS3Service(): S3Service | null {
  return s3ServiceInstance
}

/**
 * 销毁S3服务实例
 */
export function destroyS3Service(): void {
  if (s3ServiceInstance) {
    s3ServiceInstance.destroy()
    s3ServiceInstance = null
  }
}
