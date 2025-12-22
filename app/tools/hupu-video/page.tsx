'use client'

import { useState } from 'react'
import { Video, Download, Loader2, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react'

interface VideoInfo {
  videoUrl: string
  poster?: string
  title?: string
  username?: string
}

export default function HupuVideoPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [copied, setCopied] = useState(false)

  const handleParse = async () => {
    if (!url.trim()) {
      setError('请输入虎扑分享链接')
      return
    }

    // 简单校验是否为虎扑链接
    if (!url.includes('hupu.com') && !url.includes('hoopchina')) {
      setError('请输入有效的虎扑链接')
      return
    }

    setLoading(true)
    setError('')
    setVideoInfo(null)

    try {
      const response = await fetch('/api/hupu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '解析失败')
      }

      if (data.videoUrl) {
        setVideoInfo(data)
      } else {
        setError('未找到视频地址，请确认链接包含视频')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!videoInfo?.videoUrl) return
    try {
      await navigator.clipboard.writeText(videoInfo.videoUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = videoInfo.videoUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <Video className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">虎扑视频下载</h1>
        </div>
        <p className="text-gray-500 text-sm">
          粘贴虎扑帖子或视频分享链接，解析并下载其中的视频
        </p>
      </div>

      {/* 输入区域 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          虎扑链接
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://m.hupu.com/reply/..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleParse()}
          />
          <button
            onClick={handleParse}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                解析中
              </>
            ) : (
              '解析'
            )}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* 结果区域 */}
      {videoInfo && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle size={18} />
            <span className="font-medium">解析成功</span>
          </div>

          {/* 发布者和标题 */}
          <div className="mb-4">
            {videoInfo.username && (
              <p className="text-sm text-gray-500 mb-1">
                发布者：<span className="text-gray-700">{videoInfo.username}</span>
              </p>
            )}
            {videoInfo.title && (
              <p className="text-gray-700 font-medium">{videoInfo.title}</p>
            )}
          </div>

          {/* 封面图 */}
          {videoInfo.poster && (
            <div className="mb-4 rounded-lg overflow-hidden bg-black">
              <img
                src={videoInfo.poster}
                alt="视频封面"
                className="w-full max-h-[300px] object-contain"
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 mb-4">
            <a
              href={videoInfo.videoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              下载视频
            </a>
            <button
              onClick={handleCopyUrl}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-green-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={18} />
                  复制链接
                </>
              )}
            </button>
          </div>

          {/* 视频地址 */}
          <div>
            <p className="text-xs text-gray-400 mb-1">视频地址：</p>
            <p className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded-lg font-mono">
              {videoInfo.videoUrl}
            </p>
          </div>

          {/* 下载提示 */}
          <p className="text-xs text-gray-400 mt-3">
            提示：点击下载视频后，在新标签页右键选择「另存为」即可保存
          </p>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-6 text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
        <p className="font-medium text-gray-700 mb-2">使用说明：</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>在虎扑 App 中找到包含视频的帖子</li>
          <li>点击分享，复制帖子链接（如 https://m.hupu.com/reply/...）</li>
          <li>粘贴到上方输入框，点击解析</li>
          <li>解析成功后可预览视频或点击下载按钮保存</li>
        </ol>
      </div>
    </div>
  )
}
