import type { S3Config, IStorageService, AppConfig, FullConfig } from '../types'

const CONFIG_KEY = 's3-gallery-config'
const THEME_KEY = 's3-gallery-theme'
const APP_CONFIG_KEY = 's3-gallery-app-config'

// 默认应用配置
const DEFAULT_APP_CONFIG: AppConfig = {
  itemsPerPage: 20,
  copyFormat: 'url',
  uploadFormat: 'original',
  uploadNameStrategy: 'original',
  uploadTargetPath: 'current',
  uploadCustomPath: '',
}

class StorageService implements IStorageService {
  /**
   * 保存S3配置到LocalStorage
   */
  saveConfig(config: S3Config): void {
    try {
      const json = JSON.stringify(config)
      localStorage.setItem(CONFIG_KEY, json)
    } catch (error) {
      console.error('保存配置失败:', error)
      throw new Error('保存配置失败')
    }
  }

  /**
   * 从LocalStorage加载S3配置
   */
  loadConfig(): S3Config | null {
    try {
      const json = localStorage.getItem(CONFIG_KEY)
      if (!json) return null
      return JSON.parse(json) as S3Config
    } catch (error) {
      console.error('加载配置失败:', error)
      return null
    }
  }

  /**
   * 导出配置为JSON字符串
   */
  exportConfig(): string {
    const s3Config = this.loadConfig()
    const appConfig = this.loadAppConfig()
    
    if (!s3Config) {
      throw new Error('没有可导出的配置')
    }
    
    const fullConfig: FullConfig = {
      s3: s3Config,
      app: appConfig,
    }
    
    return JSON.stringify(fullConfig, null, 2)
  }

  /**
   * 从JSON字符串导入配置
   */
  importConfig(json: string): FullConfig {
    try {
      const parsed = JSON.parse(json)
      
      // 兼容旧版本配置（只有 S3 配置）
      if (parsed.accessKeyId) {
        const s3Config = parsed as S3Config
        // 验证必填字段
        if (!s3Config.accessKeyId || !s3Config.secretAccessKey || !s3Config.endpoint || !s3Config.bucket) {
          throw new Error('配置文件缺少必填字段')
        }
        return {
          s3: s3Config,
          app: DEFAULT_APP_CONFIG,
        }
      }
      
      // 新版本配置（包含 S3 和 App 配置）
      const fullConfig = parsed as FullConfig
      
      // 验证 S3 配置必填字段
      if (!fullConfig.s3?.accessKeyId || !fullConfig.s3?.secretAccessKey || 
          !fullConfig.s3?.endpoint || !fullConfig.s3?.bucket) {
        throw new Error('配置文件缺少必填字段')
      }
      
      // 合并默认应用配置
      fullConfig.app = {
        ...DEFAULT_APP_CONFIG,
        ...fullConfig.app,
      }
      
      return fullConfig
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('配置文件格式无效')
      }
      throw error
    }
  }

  /**
   * 保存应用配置
   */
  saveAppConfig(config: AppConfig): void {
    try {
      const json = JSON.stringify(config)
      localStorage.setItem(APP_CONFIG_KEY, json)
    } catch (error) {
      console.error('保存应用配置失败:', error)
      throw new Error('保存应用配置失败')
    }
  }

  /**
   * 加载应用配置
   */
  loadAppConfig(): AppConfig {
    try {
      const json = localStorage.getItem(APP_CONFIG_KEY)
      if (!json) return DEFAULT_APP_CONFIG
      
      const config = JSON.parse(json) as AppConfig
      // 合并默认配置，确保新增字段有默认值
      return {
        ...DEFAULT_APP_CONFIG,
        ...config,
      }
    } catch (error) {
      console.error('加载应用配置失败:', error)
      return DEFAULT_APP_CONFIG
    }
  }

  /**
   * 保存主题设置
   */
  saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch (error) {
      console.error('保存主题失败:', error)
    }
  }

  /**
   * 加载主题设置
   */
  loadTheme(): 'light' | 'dark' {
    try {
      const theme = localStorage.getItem(THEME_KEY)
      if (theme === 'dark' || theme === 'light') {
        return theme
      }
      // 默认跟随系统
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    } catch {
      return 'light'
    }
  }

  /**
   * 清除所有存储的数据
   */
  clearAll(): void {
    localStorage.removeItem(CONFIG_KEY)
    localStorage.removeItem(THEME_KEY)
    localStorage.removeItem(APP_CONFIG_KEY)
  }
}

// 导出单例实例
export const storageService = new StorageService()
