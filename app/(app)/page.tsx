import Link from 'next/link'
import { Video, ArrowRight, RefreshCw, EyeOff, HeartHandshake, Film, Trophy, Eraser, FileText } from 'lucide-react'

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
  {
    name: '隐形 Unicode 文本',
    href: '/tools/invisible-unicode',
    icon: EyeOff,
    description: '使用零宽字符隐藏文本、检测隐藏内容',
    color: 'bg-indigo-500',
  },
  {
    name: 'Markdown 预览',
    href: '/tools/markdown-preview',
    icon: FileText,
    description: '拖拽或粘贴 Markdown 文件，实时预览格式化内容，支持分屏与全预览',
    color: 'bg-violet-500',
  },
  {
    name: '钦定 yes',
    href: '/tools/force-yes',
    icon: HeartHandshake,
    description: '生成强制选中 yes 的整蛊链接',
    color: 'bg-pink-500',
  },
  {
    name: '视频帧拼图',
    href: '/tools/video-frame-stitch',
    icon: Film,
    description: '从视频中抽取多个时间点的帧，拼成一张带序号的网格大图',
    color: 'bg-emerald-500',
  },
  {
    name: '世界杯竞猜',
    href: '/tools/world-cup-predict',
    icon: Trophy,
    description: '随机猜比赛胜平负，统计命中率，生成专属晋级树分享',
    color: 'bg-amber-500',
  },
  {
    name: '视频去台标 / 裁切',
    href: '/tools/video-delogo',
    icon: Eraser,
    description: '选视频、框选区域，生成 ffmpeg delogo（去水印）或 crop（裁切保留区域）命令',
    color: 'bg-sky-500',
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
