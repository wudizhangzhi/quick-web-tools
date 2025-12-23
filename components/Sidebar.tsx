'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Video, Home, Menu, X } from 'lucide-react'

const tools = [
  {
    name: '虎扑视频下载',
    href: '/tools/hupu-video',
    icon: Video,
    description: '下载虎扑分享链接中的视频',
  },
  // 未来在这里添加更多工具
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* 移动端汉堡菜单按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        aria-label="菜单"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 移动端遮罩层 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200 p-4
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Link href="/" className="flex items-center gap-2 mb-8 px-2" onClick={closeSidebar}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <span className="font-semibold text-gray-900">Quick Tools</span>
        </Link>

        <nav className="space-y-1">
          <Link
            href="/"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === '/'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home size={18} />
            <span>首页</span>
          </Link>

          <div className="pt-4">
            <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              工具列表
            </p>
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = pathname === tool.href
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tool.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>
    </>
  )
}
