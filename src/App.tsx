import { useEffect } from 'react'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useUIStore } from './stores/uiStore'
import { useConfigStore } from './stores/configStore'
import { useCorsStore } from './stores/corsStore'
import { useAppConfigStore } from './stores/appConfigStore'
import { 
  Header, 
  BreadcrumbContainer, 
  GalleryContainer, 
  ImageViewer,
  SettingsModalContainer,
  UploadModalContainer,
  RenameModalContainer,
  MoveModalContainer,
  CopyModalContainer,
  CreateFolderModalContainer,
  GlobalMessage,
  GlobalConfirm,
  GlobalLoading,
} from './components'

function App() {
  const isDark = useUIStore((state) => state.theme === 'dark')
  const loadThemeFromStorage = useUIStore((state) => state.loadThemeFromStorage)
  const showSettingsModal = useUIStore((state) => state.showSettingsModal)
  
  const config = useConfigStore((state) => state.config)
  const isInitialized = useConfigStore((state) => state.isInitialized)
  const loadConfigFromStorage = useConfigStore((state) => state.loadConfigFromStorage)
  
  const resetCorsState = useCorsStore((state) => state.resetCorsState)
  const loadAppConfig = useAppConfigStore((state) => state.loadFromStorage)

  // 初始化：加载配置和主题，重置 CORS 状态
  useEffect(() => {
    // 加载主题
    loadThemeFromStorage()
    
    // 加载配置
    loadConfigFromStorage()
    
    // 加载应用配置
    loadAppConfig()
    
    // 页面刷新时重置 CORS 状态，重新测试
    resetCorsState()
  }, [loadThemeFromStorage, loadConfigFromStorage, loadAppConfig, resetCorsState])

  // 如果没有配置，自动打开设置弹窗
  useEffect(() => {
    if (isInitialized && !config) {
      showSettingsModal()
    }
  }, [isInitialized, config, showSettingsModal])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div 
        className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}
        lang="zh-CN"
      >
        {/* 跳转到主内容的链接 - 提高键盘导航可访问性 */}
        <a href="#main-content" className="skip-to-content">
          跳转到主内容
        </a>
        
        <Header />
        <BreadcrumbContainer />
        <div id="main-content">
          <GalleryContainer />
        </div>
        <ImageViewer />
        <SettingsModalContainer />
        <UploadModalContainer />
        <RenameModalContainer />
        <MoveModalContainer />
        <CopyModalContainer />
        <CreateFolderModalContainer />
        
        {/* 全局组件 */}
        <GlobalMessage />
        <GlobalConfirm />
        <GlobalLoading />
      </div>
    </ConfigProvider>
  )
}

export default App
