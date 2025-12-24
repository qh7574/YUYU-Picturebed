import { create } from 'zustand'
import type { AppConfig } from '../types'
import { storageService } from '../services/storageService'

interface AppConfigState extends AppConfig {
  setItemsPerPage: (count: number) => void
  setCopyFormat: (format: 'url' | 'markdown') => void
  setUploadFormat: (format: 'original' | 'webp') => void
  setUploadNameStrategy: (strategy: 'original' | 'md5') => void
  setUploadTargetPath: (type: 'current' | 'custom') => void
  setUploadCustomPath: (path: string) => void
  loadFromStorage: () => void
  saveToStorage: () => void
}

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  // 默认值
  itemsPerPage: 20,
  copyFormat: 'url',
  uploadFormat: 'original',
  uploadNameStrategy: 'original',
  uploadTargetPath: 'current',
  uploadCustomPath: '',

  setItemsPerPage: (count: number) => {
    set({ itemsPerPage: count })
    get().saveToStorage()
  },

  setCopyFormat: (format: 'url' | 'markdown') => {
    set({ copyFormat: format })
    get().saveToStorage()
  },

  setUploadFormat: (format: 'original' | 'webp') => {
    set({ uploadFormat: format })
    get().saveToStorage()
  },

  setUploadNameStrategy: (strategy: 'original' | 'md5') => {
    set({ uploadNameStrategy: strategy })
    get().saveToStorage()
  },

  setUploadTargetPath: (type: 'current' | 'custom') => {
    set({ uploadTargetPath: type })
    get().saveToStorage()
  },

  setUploadCustomPath: (path: string) => {
    set({ uploadCustomPath: path })
    get().saveToStorage()
  },

  loadFromStorage: () => {
    const config = storageService.loadAppConfig()
    set(config)
  },

  saveToStorage: () => {
    const { itemsPerPage, copyFormat, uploadFormat, uploadNameStrategy, uploadTargetPath, uploadCustomPath } = get()
    storageService.saveAppConfig({ 
      itemsPerPage, 
      copyFormat, 
      uploadFormat, 
      uploadNameStrategy, 
      uploadTargetPath, 
      uploadCustomPath 
    })
  },
}))
