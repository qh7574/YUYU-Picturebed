import { Spin } from 'antd'
import { useLoadingStore } from '../stores/loadingStore'

/**
 * 全局加载指示器组件
 */
export function GlobalLoading() {
  const loading = useLoadingStore((state) => state.loading)
  const tip = useLoadingStore((state) => state.tip)

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
        <Spin size="large" tip={tip} />
      </div>
    </div>
  )
}
