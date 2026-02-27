'use client'

import { useState } from 'react'
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ConvertResult {
  yaml: string
  count: number
  errors?: string[]
}

interface AdvancedState {
  include: string
  exclude: string
  renameRegex: string
  renameReplace: string
  emoji: boolean
  udp: boolean
  scert: boolean
  sort: string
}

const PRESETS = [
  { value: 'default', label: '默认 — 手动选择节点 + 自动测速' },
  { value: 'auto', label: '默认（自动测速） — 自动选择延迟最低的节点' },
  { value: 'acl4ssr-lite', label: 'ACL4SSR 精简 — 国内直连 + 广告拦截 + 国外代理' },
  { value: 'acl4ssr-full', label: 'ACL4SSR 全分组 — Google/YouTube/Netflix/Telegram 等分组' },
  { value: 'adblock', label: '去广告增强 — 默认规则 + 增强广告拦截' },
]

export default function SubConverterPage() {
  const [urls, setUrls] = useState('')
  const [preset, setPreset] = useState('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ConvertResult | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advanced, setAdvanced] = useState<AdvancedState>({
    include: '',
    exclude: '',
    renameRegex: '',
    renameReplace: '',
    emoji: false,
    udp: false,
    scert: false,
    sort: 'none',
  })
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const buildSubscriptionUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    let url = `${origin}/api/sub-converter?url=${encodeURIComponent(urls.trim())}&preset=${preset}`
    if (advanced.emoji) url += '&emoji=1'
    if (advanced.udp) url += '&udp=1'
    if (advanced.scert) url += '&scert=1'
    if (advanced.include) url += `&include=${encodeURIComponent(advanced.include)}`
    if (advanced.exclude) url += `&exclude=${encodeURIComponent(advanced.exclude)}`
    return url
  }

  const handleConvert = async () => {
    if (!urls.trim()) {
      setError('请输入订阅链接')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const body: Record<string, unknown> = { urls: urls.trim(), preset }

      // Build advanced options if any are set
      const adv: Record<string, unknown> = {}
      let hasAdvanced = false

      if (advanced.include) { adv.includeRegex = advanced.include; hasAdvanced = true }
      if (advanced.exclude) { adv.excludeRegex = advanced.exclude; hasAdvanced = true }
      if (advanced.renameRegex) { adv.renameRegex = advanced.renameRegex; adv.renameReplace = advanced.renameReplace; hasAdvanced = true }
      if (advanced.emoji) { adv.addEmoji = true; hasAdvanced = true }
      if (advanced.udp) { adv.udp = true; hasAdvanced = true }
      if (advanced.scert) { adv.skipCertVerify = true; hasAdvanced = true }
      if (advanced.sort === 'name') { adv.sort = true; hasAdvanced = true }

      if (hasAdvanced) body.advanced = adv

      const response = await fetch('/api/sub-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '转换失败')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result?.yaml) return
    const blob = new Blob([result.yaml], { type: 'text/yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clash-config.yaml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const ToggleSwitch = ({
    enabled,
    onToggle,
    label,
  }: {
    enabled: boolean
    onToggle: () => void
    label: string
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-purple-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <RefreshCw className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">订阅转换</h1>
        </div>
        <p className="text-gray-500 text-sm">
          将订阅地址转换为 Clash/FiClash 配置
        </p>
      </div>

      {/* 订阅链接 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          订阅链接
        </label>
        <textarea
          rows={3}
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="支持订阅链接或单节点链接，多个链接每行一个或用 | 分隔"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-base resize-none"
        />
      </div>

      {/* 远程配置 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          远程配置
        </label>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-base bg-white"
        >
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* 高级功能 */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 sm:px-6 text-sm font-medium text-gray-700"
        >
          高级功能
          {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showAdvanced && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t border-gray-100 pt-4">
            {/* 节点过滤（包含） */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                节点过滤（包含）
              </label>
              <input
                type="text"
                value={advanced.include}
                onChange={(e) => setAdvanced({ ...advanced, include: e.target.value })}
                placeholder="例: 香港|日本|HK|JP"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
              />
            </div>

            {/* 节点过滤（排除） */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                节点过滤（排除）
              </label>
              <input
                type="text"
                value={advanced.exclude}
                onChange={(e) => setAdvanced({ ...advanced, exclude: e.target.value })}
                placeholder="例: 过期|剩余"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
              />
            </div>

            {/* 节点重命名 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                节点重命名
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={advanced.renameRegex}
                  onChange={(e) => setAdvanced({ ...advanced, renameRegex: e.target.value })}
                  placeholder="匹配正则"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                />
                <input
                  type="text"
                  value={advanced.renameReplace}
                  onChange={(e) => setAdvanced({ ...advanced, renameReplace: e.target.value })}
                  placeholder="替换为"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Toggle switches */}
            <div className="grid grid-cols-2 gap-4">
              <ToggleSwitch
                enabled={advanced.emoji}
                onToggle={() => setAdvanced({ ...advanced, emoji: !advanced.emoji })}
                label="Emoji 国旗"
              />
              <ToggleSwitch
                enabled={advanced.udp}
                onToggle={() => setAdvanced({ ...advanced, udp: !advanced.udp })}
                label="UDP 转发"
              />
              <ToggleSwitch
                enabled={advanced.scert}
                onToggle={() => setAdvanced({ ...advanced, scert: !advanced.scert })}
                label="跳过证书验证"
              />
            </div>

            {/* 排序方式 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                排序方式
              </label>
              <select
                value={advanced.sort}
                onChange={(e) => setAdvanced({ ...advanced, sort: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm bg-white"
              >
                <option value="none">不排序</option>
                <option value="name">按节点名称</option>
                <option value="server">按服务器地址</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 转换按钮 */}
      <button
        onClick={handleConvert}
        disabled={loading}
        className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-4"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            转换中
          </>
        ) : (
          '生成订阅链接'
        )}
      </button>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* 结果区域 */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle size={18} />
            <span className="font-medium">转换成功，共 {result.count} 个节点</span>
          </div>

          {/* 部分解析错误警告 */}
          {result.errors && result.errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
              <p className="font-medium mb-1">部分节点解析失败：</p>
              <ul className="list-disc list-inside space-y-0.5">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              下载配置
            </button>
            <button
              onClick={() => copyToClipboard(result.yaml, setCopiedConfig)}
              className="py-3 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              {copiedConfig ? (
                <>
                  <Check size={18} className="text-green-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={18} />
                  复制配置
                </>
              )}
            </button>
            <button
              onClick={() => copyToClipboard(buildSubscriptionUrl(), setCopiedLink)}
              className="py-3 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check size={18} className="text-green-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={18} />
                  复制订阅链接
                </>
              )}
            </button>
          </div>

          {/* 订阅地址 */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">Clash 订阅地址</p>
            <p className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded-lg font-mono">
              {buildSubscriptionUrl()}
            </p>
          </div>

          {/* YAML 预览 */}
          <div>
            <p className="text-xs text-gray-400 mb-1">配置预览</p>
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg font-mono max-h-96 overflow-auto whitespace-pre-wrap break-all">
              {result.yaml}
            </pre>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-6 text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
        <p className="font-medium text-gray-700 mb-2">使用说明：</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>粘贴你的订阅链接到输入框，支持多个链接（每行一个或用 | 分隔）</li>
          <li>选择合适的远程配置预设（默认即可满足大多数需求）</li>
          <li>如需过滤节点或添加 Emoji 国旗，展开高级功能进行设置</li>
          <li>点击「生成订阅链接」，等待转换完成</li>
          <li>可直接下载配置文件，或复制订阅链接在 Clash/FiClash 中使用</li>
        </ol>
      </div>
    </div>
  )
}
