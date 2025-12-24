import { Button } from 'antd'
import {
  UploadOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  FolderAddOutlined,
} from '@ant-design/icons'
import { useUIStore } from '../stores/uiStore'

export function Header() {
  const theme = useUIStore((state) => state.theme)
  const toggleTheme = useUIStore((state) => state.toggleTheme)
  const showUploadModal = useUIStore((state) => state.showUploadModal)
  const showSettingsModal = useUIStore((state) => state.showSettingsModal)
  const showCreateFolderModal = useUIStore((state) => state.showCreateFolderModal)

  const isDark = theme === 'dark'

  return (
    <header
      role="banner"
      className={`sticky top-0 z-50 border-b ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="w-full px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* 网站标题 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img 
            src="/logo.svg" 
            alt="鱼鱼图床" 
            className={`w-7 h-7 sm:w-8 sm:h-8 ${
              isDark ? 'brightness-0 invert' : ''
            }`}
          />
          <h1
            className={`text-base sm:text-lg md:text-xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            鱼鱼图床
          </h1>
        </div>

        {/* 操作按钮组 */}
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="主要操作">
          {/* 主题切换按钮 */}
          <Button
            type="text"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
            title={isDark ? '切换到浅色模式' : '切换到深色模式'}
            className={`${isDark ? 'text-gray-300 hover:text-white' : ''} min-w-[32px] sm:min-w-[40px]`}
          />

          {/* 新建文件夹按钮 */}
          <Button
            icon={<FolderAddOutlined />}
            onClick={showCreateFolderModal}
            className="hidden sm:inline-flex"
            aria-label="新建文件夹"
          >
            新建文件夹
          </Button>
          <Button
            icon={<FolderAddOutlined />}
            onClick={showCreateFolderModal}
            className="sm:hidden min-w-[32px]"
            aria-label="新建文件夹"
            title="新建文件夹"
          />

          {/* 上传按钮 */}
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={showUploadModal}
            className="hidden sm:inline-flex"
            aria-label="上传图片"
          >
            上传
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={showUploadModal}
            className="sm:hidden min-w-[32px]"
            aria-label="上传图片"
            title="上传图片"
          />

          {/* 设置按钮 */}
          <Button
            icon={<SettingOutlined />}
            onClick={showSettingsModal}
            className="hidden sm:inline-flex"
            aria-label="打开设置"
          >
            设置
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={showSettingsModal}
            className="sm:hidden min-w-[32px]"
            aria-label="打开设置"
            title="打开设置"
          />
        </nav>
      </div>
    </header>
  )
}
