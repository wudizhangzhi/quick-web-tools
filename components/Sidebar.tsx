'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Video, Home } from 'lucide-react'

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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">Q</span>
        </div>
        <span className="font-semibold text-gray-900">Quick Tools</span>
      </Link>

      <nav className="space-y-1">
        <Link
          href="/"
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
  )
}
