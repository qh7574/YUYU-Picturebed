// S3配置类型
export interface S3Config {
  accessKeyId: string
  secretAccessKey: string
  region: string
  endpoint: string
  bucket: string
  customDomain?: string
}

// 应用配置类型
export interface AppConfig {
  itemsPerPage: number // 单页显示数量
  copyFormat: 'url' | 'markdown' // 复制格式
  uploadFormat: 'original' | 'webp' // 上传图片格式
  uploadNameStrategy: 'original' | 'md5' // 上传文件名策略
  uploadTargetPath: 'current' | 'custom' // 上传目标路径类型
  uploadCustomPath: string // 自定义上传路径
}

// 完整配置类型
export interface FullConfig {
  s3: S3Config
  app: AppConfig
}

// 图库项目类型
export interface GalleryItem {
  type: 'folder' | 'image'
  key: string
  name: string
  thumbnailUrl?: string
  fullUrl?: string
  size?: number
  lastModified?: Date
}

// S3对象类型
export interface S3Object {
  key: string
  size: number
  lastModified: Date
  isFolder: boolean
}

// 上传配置类型
export interface UploadConfig {
  files: File[]
  format: 'original' | 'webp'
  targetPath: 'current' | 'custom'
  customPath?: string
  nameStrategy: 'original' | 'md5'
}

// 缓存目录数据类型
export interface CachedDirectory {
  items: GalleryItem[]
  timestamp: number
  ttl: number
}

// 缓存缩略图数据类型
export interface CachedThumbnail {
  blob: Blob
  timestamp: number
}

// 上传进度类型
export interface UploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// 批量操作结果类型
export interface BatchOperationResult {
  success: string[]
  failed: Array<{ key: string; error: string }>
}

// 服务层接口类型
export interface IS3Service {
  listObjects(prefix: string): Promise<S3Object[]>
  uploadObject(key: string, file: Blob): Promise<void>
  deleteObject(key: string): Promise<void>
  deleteObjects(keys: string[]): Promise<BatchOperationResult>
  renameObject(oldKey: string, newKey: string): Promise<void>
  moveObject(oldKey: string, newKey: string): Promise<void>
  copyObject(sourceKey: string, targetKey: string): Promise<void>
  testConnection(): Promise<boolean>
  getObjectUrl(key: string): string
}

export interface ICacheService {
  init(): Promise<void>
  cacheDirectory(path: string, items: GalleryItem[]): Promise<void>
  getDirectory(path: string): Promise<GalleryItem[] | null>
  cacheThumbnail(key: string, blob: Blob): Promise<void>
  getThumbnail(key: string): Promise<Blob | null>
  clearPath(path: string): Promise<void>
  clearAll(): Promise<void>
}

export interface IImageService {
  generateThumbnail(file: File, maxWidth: number, maxHeight: number): Promise<Blob>
  convertToWebP(file: File, quality?: number): Promise<Blob>
  calculateMD5(file: File): Promise<string>
  downloadImages(urls: string[], names: string[]): Promise<void>
}

export interface IStorageService {
  saveConfig(config: S3Config): void
  loadConfig(): S3Config | null
  exportConfig(): string
  importConfig(json: string): FullConfig
  saveTheme(theme: 'light' | 'dark'): void
  loadTheme(): 'light' | 'dark'
  saveAppConfig(config: AppConfig): void
  loadAppConfig(): AppConfig
}

// 状态管理类型
export interface ConfigState {
  config: S3Config | null
  isInitialized: boolean
  setConfig: (config: S3Config) => void
  clearConfig: () => void
  loadConfigFromStorage: () => void
  saveConfigToStorage: (config: S3Config) => void
}

export interface NavigationState {
  currentPath: string
  pathHistory: string[]
  navigate: (path: string) => void
  goBack: () => void
  goToPath: (path: string) => void
}

export interface SelectionState {
  selectedItems: Set<string>
  toggleSelection: (key: string) => void
  selectAll: (keys: string[]) => void
  clearSelection: () => void
  isSelected: (key: string) => boolean
}

export interface GalleryState {
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
}

export interface UIState {
  theme: 'light' | 'dark'
  uploadModalVisible: boolean
  settingsModalVisible: boolean
  viewerVisible: boolean
  currentImageIndex: number
  toggleTheme: () => void
  showUploadModal: () => void
  hideUploadModal: () => void
  showSettingsModal: () => void
  hideSettingsModal: () => void
  showViewer: (index: number) => void
  hideViewer: () => void
  setCurrentImageIndex: (index: number) => void
  loadThemeFromStorage: () => void
}

// 组件Props类型
export interface HeaderProps {
  onUpload: () => void
  onSettings: () => void
  onThemeToggle: () => void
  theme: 'light' | 'dark'
}

export interface BreadcrumbProps {
  currentPath: string
  onNavigate: (path: string) => void
  selectedCount: number
  onSelectAll?: () => void
  onBatchDownload: () => void
  onBatchCopy?: () => void
  onBatchCopyUrl: () => void
  onBatchMove?: () => void
  onBatchDelete: () => void
}

export interface GalleryProps {
  items: GalleryItem[]
  loading: boolean
  onItemClick: (item: GalleryItem) => void
  onFolderClick: (folderName: string) => void
  selectedItems: Set<string>
  onSelectionChange: (itemKey: string, selected: boolean) => void
  onDownload?: (item: GalleryItem) => void
  onCopyUrl?: (item: GalleryItem) => void
  onDelete?: (item: GalleryItem) => void
  onRename?: (item: GalleryItem) => void
  onMove?: (item: GalleryItem) => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export interface ImageCardProps {
  item: GalleryItem
  selected: boolean
  onSelect: (selected: boolean) => void
  onClick: () => void
  onDownload: () => void
  onCopyUrl: () => void
  onDelete: () => void
  onRename?: () => void
  onMove?: () => void
}

export interface UploadModalProps {
  visible: boolean
  currentPath: string
  onClose: () => void
  onUpload: (config: UploadConfig) => Promise<void>
}

export interface SettingsModalProps {
  visible: boolean
  onClose: () => void
  onSave: (config: S3Config) => void
  onTest: (config: S3Config) => Promise<boolean>
  onExport: () => void
  onImport: (file: File) => void
}

// 图片支持的格式
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
] as const

export type SupportedImageFormat = (typeof SUPPORTED_IMAGE_FORMATS)[number]

// 判断是否为图片文件
export function isImageFile(key: string): boolean {
  const ext = key.toLowerCase().split('.').pop()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif'].includes(ext || '')
}
