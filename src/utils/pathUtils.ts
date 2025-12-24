/**
 * 路径处理工具函数
 * 实现路径变量替换、规范化、解析和文件名验证功能
 */

/**
 * 路径变量替换函数
 * 支持的变量: {year}, {month}, {day}
 * @param path 包含变量的路径字符串
 * @param date 可选的日期对象，默认使用当前日期
 * @returns 替换变量后的路径字符串
 */
export function replacePathVariables(path: string, date: Date = new Date()): string {
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  return path
    .replace(/\{year\}/gi, year)
    .replace(/\{month\}/gi, month)
    .replace(/\{day\}/gi, day)
}

/**
 * 路径规范化函数
 * 处理多余斜杠、首尾斜杠等
 * @param path 原始路径
 * @returns 规范化后的路径
 */
export function normalizePath(path: string): string {
  if (!path) {
    return ''
  }

  // 替换多个连续斜杠为单个斜杠
  let normalized = path.replace(/\/+/g, '/')

  // 移除开头的斜杠（S3路径不以斜杠开头）
  normalized = normalized.replace(/^\/+/, '')

  // 移除结尾的斜杠（除非是根路径）
  if (normalized.length > 0) {
    normalized = normalized.replace(/\/+$/, '')
  }

  return normalized
}

/**
 * 路径解析函数
 * 将路径分割为路径段数组
 * @param path 路径字符串
 * @returns 路径段数组
 */
export function parsePath(path: string): string[] {
  const normalized = normalizePath(path)
  
  if (!normalized) {
    return []
  }

  return normalized.split('/')
}

/**
 * 获取路径段对应的完整路径
 * 用于面包屑导航，点击某个路径段时获取该段对应的完整路径
 * @param path 完整路径
 * @param segmentIndex 路径段索引（从0开始）
 * @returns 该路径段对应的完整路径
 */
export function getPathAtSegment(path: string, segmentIndex: number): string {
  const segments = parsePath(path)
  
  if (segmentIndex < 0 || segmentIndex >= segments.length) {
    return ''
  }

  return segments.slice(0, segmentIndex + 1).join('/')
}

/**
 * 获取父路径
 * @param path 当前路径
 * @returns 父路径，如果已是根路径则返回空字符串
 */
export function getParentPath(path: string): string {
  const segments = parsePath(path)
  
  if (segments.length <= 1) {
    return ''
  }

  return segments.slice(0, -1).join('/')
}

/**
 * 连接路径
 * @param basePath 基础路径
 * @param relativePath 相对路径
 * @returns 连接后的规范化路径
 */
export function joinPath(basePath: string, relativePath: string): string {
  if (!basePath) {
    return normalizePath(relativePath)
  }
  
  if (!relativePath) {
    return normalizePath(basePath)
  }

  return normalizePath(`${basePath}/${relativePath}`)
}

/**
 * 文件名中的非法字符
 * S3对象键名不允许的字符相对较少，但为了兼容性和安全性，我们限制一些特殊字符
 */
const INVALID_FILENAME_CHARS = /[<>:"\|?*\x00-\x1f\\]/

/**
 * 文件名验证结果
 */
export interface FilenameValidationResult {
  valid: boolean
  error?: string
}

/**
 * 文件名验证函数
 * @param filename 文件名
 * @returns 验证结果
 */
export function validateFilename(filename: string): FilenameValidationResult {
  // 检查是否为空
  if (!filename || filename.trim().length === 0) {
    return {
      valid: false,
      error: '文件名不能为空',
    }
  }

  // 检查是否只包含空白字符
  if (filename.trim() !== filename) {
    return {
      valid: false,
      error: '文件名不能以空格开头或结尾',
    }
  }

  // 检查非法字符
  if (INVALID_FILENAME_CHARS.test(filename)) {
    return {
      valid: false,
      error: '文件名包含非法字符: < > : " | ? * \\',
    }
  }

  // 检查是否包含路径分隔符
  if (filename.includes('/')) {
    return {
      valid: false,
      error: '文件名不能包含路径分隔符 /',
    }
  }

  // 检查文件名长度（S3对象键名最大1024字节，但文件名部分应该更短）
  if (filename.length > 255) {
    return {
      valid: false,
      error: '文件名长度不能超过255个字符',
    }
  }

  // 检查是否为保留名称（Windows保留名称）
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  ]
  const nameWithoutExt = filename.split('.')[0].toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    return {
      valid: false,
      error: '文件名不能使用系统保留名称',
    }
  }

  // 检查是否以点结尾
  if (filename.endsWith('.')) {
    return {
      valid: false,
      error: '文件名不能以点结尾',
    }
  }

  return { valid: true }
}

/**
 * 从完整路径中提取文件名
 * @param path 完整路径
 * @returns 文件名
 */
export function getFilename(path: string): string {
  const normalized = normalizePath(path)
  const segments = normalized.split('/')
  return segments[segments.length - 1] || ''
}

/**
 * 从文件名中提取扩展名
 * @param filename 文件名
 * @returns 扩展名（不包含点），如果没有扩展名则返回空字符串
 */
export function getExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return ''
  }

  return filename.slice(lastDotIndex + 1).toLowerCase()
}

/**
 * 更改文件扩展名
 * @param filename 原文件名
 * @param newExtension 新扩展名（不包含点）
 * @returns 更改扩展名后的文件名
 */
export function changeExtension(filename: string, newExtension: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return `${filename}.${newExtension}`
  }

  return `${filename.slice(0, lastDotIndex)}.${newExtension}`
}

/**
 * 判断路径是否为根路径
 * @param path 路径
 * @returns 是否为根路径
 */
export function isRootPath(path: string): boolean {
  return normalizePath(path) === ''
}
