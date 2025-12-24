import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

// 创建一个会抛出错误的组件
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('测试错误')
  }
  return <div>正常内容</div>
}

describe('ErrorBoundary组件', () => {
  // 抑制控制台错误输出
  const originalError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  it('应该正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div>测试内容</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('测试内容')).toBeInTheDocument()
  })

  it('应该捕获错误并显示错误界面', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('应用程序遇到错误')).toBeInTheDocument()
    expect(screen.getByText(/抱歉，应用程序遇到了一个意外错误/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新页面' })).toBeInTheDocument()
  })

  it('应该在点击刷新按钮时重新加载页面', () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: '刷新页面' })
    fireEvent.click(reloadButton)

    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})
