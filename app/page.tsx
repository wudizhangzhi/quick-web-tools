import Link from 'next/link'
import { Video, ArrowRight, RefreshCw } from 'lucide-react'

const tools = [
  {
    name: '虎扑视频下载',
    href: '/tools/hupu-video',
    icon: Video,
    description: '粘贴虎扑分享链接，一键下载视频',
    color: 'bg-red-500',
  },
  {
    name: '订阅转换',
    href: '/tools/sub-converter',
    icon: RefreshCw,
    description: '将订阅地址转换为 Clash/FiClash 配置',
    color: 'bg-purple-500',
  },
]

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quick Web Tools</h1>
        <p className="text-gray-500 mt-1">实用小工具集合，让工作更高效</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
            >
              <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                {tool.name}
                <ArrowRight
                  size={16}
                  className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                />
              </h3>
              <p className="text-sm text-gray-500">{tool.description}</p>
            </Link>
          )
        })}

        {/* 占位卡片 - 更多工具即将推出 */}
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 flex items-center justify-center">
          <p className="text-sm text-gray-400">更多工具即将推出...</p>
        </div>
      </div>
    </div>
  )
}
