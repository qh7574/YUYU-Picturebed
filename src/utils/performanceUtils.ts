/**
 * 性能优化工具函数
 */

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    const context = this

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func.apply(context, args)
      timeout = null
    }, wait)
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastResult: ReturnType<T>

  return function (this: any, ...args: Parameters<T>) {
    const context = this

    if (!inThrottle) {
      lastResult = func.apply(context, args)
      inThrottle = true

      setTimeout(() => {
        inThrottle = false
      }, limit)
    }

    return lastResult
  }
}

/**
 * 请求动画帧节流
 * 用于优化滚动等高频事件
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null

  return function (this: any, ...args: Parameters<T>) {
    const context = this

    if (rafId !== null) {
      return
    }

    rafId = requestAnimationFrame(() => {
      func.apply(context, args)
      rafId = null
    })
  }
}

/**
 * 批量处理函数
 * 将多个调用合并为一次批量处理
 */
export function batchProcess<T>(
  processor: (items: T[]) => void,
  delay: number = 100
): (item: T) => void {
  let batch: T[] = []
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (item: T) => {
    batch.push(item)

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      processor(batch)
      batch = []
      timeout = null
    }, delay)
  }
}
