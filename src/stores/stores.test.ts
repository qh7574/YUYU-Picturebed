import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigStore } from './configStore'
import { useNavigationStore } from './navigationStore'
import { useSelectionStore } from './selectionStore'
import { useGalleryStore } from './galleryStore'
import { useUIStore } from './uiStore'
import type { S3Config } from '../types'

describe('状态管理Stores', () => {
  describe('ConfigStore', () => {
    beforeEach(() => {
      useConfigStore.getState().clearConfig()
    })

    it('应该能够设置和获取配置', () => {
      const config: S3Config = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'auto',
        endpoint: 'https://test.com',
        bucket: 'test-bucket',
      }

      useConfigStore.getState().setConfig(config)
      expect(useConfigStore.getState().config).toEqual(config)
      expect(useConfigStore.getState().isInitialized).toBe(true)
    })

    it('应该能够清除配置', () => {
      const config: S3Config = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'auto',
        endpoint: 'https://test.com',
        bucket: 'test-bucket',
      }

      useConfigStore.getState().setConfig(config)
      useConfigStore.getState().clearConfig()
      expect(useConfigStore.getState().config).toBeNull()
    })
  })

  describe('NavigationStore', () => {
    beforeEach(() => {
      useNavigationStore.setState({ currentPath: '', pathHistory: [] })
    })

    it('应该能够导航到新路径', () => {
      useNavigationStore.getState().navigate('folder1')
      expect(useNavigationStore.getState().currentPath).toBe('folder1')
      expect(useNavigationStore.getState().pathHistory).toEqual([''])
    })

    it('应该能够返回上一级', () => {
      useNavigationStore.getState().navigate('folder1')
      useNavigationStore.getState().navigate('folder2')
      useNavigationStore.getState().goBack()
      expect(useNavigationStore.getState().currentPath).toBe('folder1')
    })

    it('应该能够直接跳转到指定路径', () => {
      useNavigationStore.getState().navigate('folder1')
      useNavigationStore.getState().goToPath('folder2/subfolder')
      expect(useNavigationStore.getState().currentPath).toBe('folder2/subfolder')
      expect(useNavigationStore.getState().pathHistory).toEqual([])
    })
  })

  describe('SelectionStore', () => {
    beforeEach(() => {
      useSelectionStore.getState().clearSelection()
    })

    it('应该能够切换选择状态', () => {
      useSelectionStore.getState().toggleSelection('item1')
      expect(useSelectionStore.getState().isSelected('item1')).toBe(true)

      useSelectionStore.getState().toggleSelection('item1')
      expect(useSelectionStore.getState().isSelected('item1')).toBe(false)
    })

    it('应该能够全选', () => {
      const keys = ['item1', 'item2', 'item3']
      useSelectionStore.getState().selectAll(keys)
      
      keys.forEach(key => {
        expect(useSelectionStore.getState().isSelected(key)).toBe(true)
      })
    })

    it('应该能够清除选择', () => {
      useSelectionStore.getState().selectAll(['item1', 'item2'])
      useSelectionStore.getState().clearSelection()
      
      expect(useSelectionStore.getState().selectedItems.size).toBe(0)
    })
  })

  describe('GalleryStore', () => {
    beforeEach(() => {
      useGalleryStore.getState().clearItems()
    })

    it('应该能够设置和获取图库项目', () => {
      const items = [
        { type: 'folder' as const, key: 'folder1/', name: 'folder1' },
        { type: 'image' as const, key: 'image1.jpg', name: 'image1.jpg' },
      ]

      useGalleryStore.getState().setItems(items)
      expect(useGalleryStore.getState().items).toHaveLength(2)
    })

    it('应该能够设置加载状态', () => {
      useGalleryStore.getState().setLoading(true)
      expect(useGalleryStore.getState().loading).toBe(true)

      useGalleryStore.getState().setLoading(false)
      expect(useGalleryStore.getState().loading).toBe(false)
    })

    it('应该能够设置错误信息', () => {
      const errorMsg = '加载失败'
      useGalleryStore.getState().setError(errorMsg)
      expect(useGalleryStore.getState().error).toBe(errorMsg)
      expect(useGalleryStore.getState().loading).toBe(false)
    })

    it('设置项目时应该按文件夹优先排序', () => {
      const items = [
        { type: 'image' as const, key: 'image1.jpg', name: 'image1.jpg' },
        { type: 'folder' as const, key: 'folder1/', name: 'folder1' },
        { type: 'image' as const, key: 'image2.jpg', name: 'image2.jpg' },
        { type: 'folder' as const, key: 'folder2/', name: 'folder2' },
      ]

      useGalleryStore.getState().setItems(items)
      const sortedItems = useGalleryStore.getState().items
      
      // 前两个应该是文件夹
      expect(sortedItems[0].type).toBe('folder')
      expect(sortedItems[1].type).toBe('folder')
      // 后两个应该是图片
      expect(sortedItems[2].type).toBe('image')
      expect(sortedItems[3].type).toBe('image')
    })
  })

  describe('UIStore', () => {
    beforeEach(() => {
      useUIStore.setState({
        theme: 'light',
        uploadModalVisible: false,
        settingsModalVisible: false,
        viewerVisible: false,
        currentImageIndex: 0,
      })
    })

    it('应该能够切换主题', () => {
      expect(useUIStore.getState().theme).toBe('light')
      
      useUIStore.getState().toggleTheme()
      expect(useUIStore.getState().theme).toBe('dark')
      
      useUIStore.getState().toggleTheme()
      expect(useUIStore.getState().theme).toBe('light')
    })

    it('应该能够显示和隐藏上传弹窗', () => {
      useUIStore.getState().showUploadModal()
      expect(useUIStore.getState().uploadModalVisible).toBe(true)
      
      useUIStore.getState().hideUploadModal()
      expect(useUIStore.getState().uploadModalVisible).toBe(false)
    })

    it('应该能够显示和隐藏设置弹窗', () => {
      useUIStore.getState().showSettingsModal()
      expect(useUIStore.getState().settingsModalVisible).toBe(true)
      
      useUIStore.getState().hideSettingsModal()
      expect(useUIStore.getState().settingsModalVisible).toBe(false)
    })

    it('应该能够显示和隐藏图片查看器', () => {
      useUIStore.getState().showViewer(5)
      expect(useUIStore.getState().viewerVisible).toBe(true)
      expect(useUIStore.getState().currentImageIndex).toBe(5)
      
      useUIStore.getState().hideViewer()
      expect(useUIStore.getState().viewerVisible).toBe(false)
    })

    it('应该能够设置当前图片索引', () => {
      useUIStore.getState().setCurrentImageIndex(10)
      expect(useUIStore.getState().currentImageIndex).toBe(10)
    })
  })
})
