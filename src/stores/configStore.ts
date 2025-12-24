import { create } from 'zustand'
import type { S3Config } from '../types'
import { storageService } from '../services/storageService'
import { initS3Service, destroyS3Service } from '../services/s3Service'

interface ConfigState {
  config: S3Config | null
  isInitialized: boolean
  setConfig: (config: S3Config) => void
  clearConfig: () => void
  loadConfigFromStorage: () => void
  saveConfigToStorage: (config: S3Config) => void
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  isInitialized: false,

  setConfig: (config: S3Config) => {
    // 初始化S3服务
    initS3Service(config)
    set({ config, isInitialized: true })
  },

  clearConfig: () => {
    // 销毁S3服务
    destroyS3Service()
    // 清除存储
    storageService.saveConfig({} as S3Config)
    set({ config: null, isInitialized: false })
  },

  loadConfigFromStorage: () => {
    const config = storageService.loadConfig()
    if (config) {
      // 初始化S3服务
      initS3Service(config)
      set({ config, isInitialized: true })
    } else {
      set({ isInitialized: true })
    }
  },

  saveConfigToStorage: (config: S3Config) => {
    storageService.saveConfig(config)
    // 初始化S3服务
    initS3Service(config)
    set({ config, isInitialized: true })
  },
}))
