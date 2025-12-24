import { describe, it, expect } from 'vitest'
import {
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
} from './pathUtils'

describe('replacePathVariables', () => {
  it('应该替换 {year} 变量', () => {
    const date = new Date(2024, 5, 15) // 2024年6月15日
    const result = replacePathVariables('images/{year}/photo.jpg', date)
    expect(result).toBe('images/2024/photo.jpg')
  })

  it('应该替换 {month} 变量（带前导零）', () => {
    const date = new Date(2024, 5, 15) // 6月
    const result = replacePathVariables('images/{month}/photo.jpg', date)
    expect(result).toBe('images/06/photo.jpg')
  })

  it('应该替换 {day} 变量（带前导零）', () => {
    const date = new Date(2024, 5, 5) // 5日
    const result = replacePathVariables('images/{day}/photo.jpg', date)
    expect(result).toBe('images/05/photo.jpg')
  })

  it('应该同时替换多个变量', () => {
    const date = new Date(2024, 11, 25) // 2024年12月25日
    const result = replacePathVariables('{year}/{month}/{day}/photo.jpg', date)
    expect(result).toBe('2024/12/25/photo.jpg')
  })

  it('应该忽略大小写', () => {
    const date = new Date(2024, 0, 1)
    const result = replacePathVariables('{YEAR}/{Month}/{DAY}', date)
    expect(result).toBe('2024/01/01')
  })

  it('没有变量时应该返回原路径', () => {
    const result = replacePathVariables('images/photo.jpg')
    expect(result).toBe('images/photo.jpg')
  })
})

describe('normalizePath', () => {
  it('应该移除多余的斜杠', () => {
    expect(normalizePath('images//photos///test')).toBe('images/photos/test')
  })

  it('应该移除开头的斜杠', () => {
    expect(normalizePath('/images/photos')).toBe('images/photos')
  })

  it('应该移除结尾的斜杠', () => {
    expect(normalizePath('images/photos/')).toBe('images/photos')
  })

  it('应该处理空字符串', () => {
    expect(normalizePath('')).toBe('')
  })

  it('应该处理只有斜杠的路径', () => {
    expect(normalizePath('///')).toBe('')
  })

  it('应该处理正常路径', () => {
    expect(normalizePath('images/photos/2024')).toBe('images/photos/2024')
  })
})

describe('parsePath', () => {
  it('应该将路径分割为段', () => {
    expect(parsePath('images/photos/2024')).toEqual(['images', 'photos', '2024'])
  })

  it('应该处理空路径', () => {
    expect(parsePath('')).toEqual([])
  })

  it('应该处理单段路径', () => {
    expect(parsePath('images')).toEqual(['images'])
  })

  it('应该规范化后再分割', () => {
    expect(parsePath('//images//photos//')).toEqual(['images', 'photos'])
  })
})

describe('getPathAtSegment', () => {
  it('应该返回指定段的完整路径', () => {
    expect(getPathAtSegment('images/photos/2024', 0)).toBe('images')
    expect(getPathAtSegment('images/photos/2024', 1)).toBe('images/photos')
    expect(getPathAtSegment('images/photos/2024', 2)).toBe('images/photos/2024')
  })

  it('索引超出范围时应该返回空字符串', () => {
    expect(getPathAtSegment('images/photos', 5)).toBe('')
    expect(getPathAtSegment('images/photos', -1)).toBe('')
  })
})

describe('getParentPath', () => {
  it('应该返回父路径', () => {
    expect(getParentPath('images/photos/2024')).toBe('images/photos')
  })

  it('单段路径应该返回空字符串', () => {
    expect(getParentPath('images')).toBe('')
  })

  it('空路径应该返回空字符串', () => {
    expect(getParentPath('')).toBe('')
  })
})

describe('joinPath', () => {
  it('应该连接两个路径', () => {
    expect(joinPath('images', 'photos')).toBe('images/photos')
  })

  it('应该处理空的基础路径', () => {
    expect(joinPath('', 'photos')).toBe('photos')
  })

  it('应该处理空的相对路径', () => {
    expect(joinPath('images', '')).toBe('images')
  })

  it('应该规范化结果', () => {
    expect(joinPath('images/', '/photos')).toBe('images/photos')
  })
})

describe('validateFilename', () => {
  it('有效文件名应该通过验证', () => {
    expect(validateFilename('photo.jpg')).toEqual({ valid: true })
    expect(validateFilename('my-image_2024.png')).toEqual({ valid: true })
  })

  it('空文件名应该失败', () => {
    const result = validateFilename('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('包含非法字符应该失败', () => {
    expect(validateFilename('photo<test>.jpg').valid).toBe(false)
    expect(validateFilename('photo:test.jpg').valid).toBe(false)
    expect(validateFilename('photo|test.jpg').valid).toBe(false)
  })

  it('包含路径分隔符应该失败', () => {
    expect(validateFilename('path/photo.jpg').valid).toBe(false)
  })

  it('以空格开头或结尾应该失败', () => {
    expect(validateFilename(' photo.jpg').valid).toBe(false)
    expect(validateFilename('photo.jpg ').valid).toBe(false)
  })

  it('以点结尾应该失败', () => {
    expect(validateFilename('photo.').valid).toBe(false)
  })
})

describe('getFilename', () => {
  it('应该从路径中提取文件名', () => {
    expect(getFilename('images/photos/photo.jpg')).toBe('photo.jpg')
  })

  it('应该处理只有文件名的情况', () => {
    expect(getFilename('photo.jpg')).toBe('photo.jpg')
  })

  it('应该处理空路径', () => {
    expect(getFilename('')).toBe('')
  })
})

describe('getExtension', () => {
  it('应该提取扩展名', () => {
    expect(getExtension('photo.jpg')).toBe('jpg')
    expect(getExtension('photo.PNG')).toBe('png')
  })

  it('没有扩展名应该返回空字符串', () => {
    expect(getExtension('photo')).toBe('')
  })

  it('隐藏文件应该返回空字符串', () => {
    expect(getExtension('.gitignore')).toBe('')
  })

  it('多个点应该返回最后一个扩展名', () => {
    expect(getExtension('photo.backup.jpg')).toBe('jpg')
  })
})

describe('changeExtension', () => {
  it('应该更改扩展名', () => {
    expect(changeExtension('photo.jpg', 'webp')).toBe('photo.webp')
  })

  it('没有扩展名应该添加扩展名', () => {
    expect(changeExtension('photo', 'jpg')).toBe('photo.jpg')
  })

  it('多个点应该只更改最后一个', () => {
    expect(changeExtension('photo.backup.jpg', 'png')).toBe('photo.backup.png')
  })
})

describe('isRootPath', () => {
  it('空路径应该是根路径', () => {
    expect(isRootPath('')).toBe(true)
  })

  it('只有斜杠应该是根路径', () => {
    expect(isRootPath('/')).toBe(true)
    expect(isRootPath('//')).toBe(true)
  })

  it('有内容的路径不是根路径', () => {
    expect(isRootPath('images')).toBe(false)
    expect(isRootPath('images/photos')).toBe(false)
  })
})
