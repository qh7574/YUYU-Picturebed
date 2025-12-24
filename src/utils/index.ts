// 工具函数导出

export {
  replacePathVariables,
  normalizePath,
  parsePath,
  getPathAtSegment,
  getParentPath,
  joinPath,
  validateFilename,
  getFilename,
  getExtension,
  changeExtension,
  isRootPath,
  type FilenameValidationResult,
} from './pathUtils'

export {
  debounce,
  throttle,
  rafThrottle,
  batchProcess,
} from './performanceUtils'
