import { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Result } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的JavaScript错误，显示友好的错误界面
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新状态以显示错误UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    console.error('错误边界捕获到错误:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = (): void => {
    // 重置错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    // 刷新页面
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Result
            status="error"
            title="应用程序遇到错误"
            subTitle="抱歉，应用程序遇到了一个意外错误。请尝试刷新页面。"
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReset}>
                刷新页面
              </Button>,
            ]}
          >
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 text-left">
                <details className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                  <summary className="cursor-pointer font-semibold mb-2">
                    错误详情（仅开发环境显示）
                  </summary>
                  <pre className="text-xs overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
