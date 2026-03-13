'use client'

import { useState } from 'react'
import { EyeOff, Eye, Copy, Check, AlertCircle, Search, ArrowRightLeft } from 'lucide-react'
import { encode, decode, detect, embed } from './unicode-steganography'

type Mode = 'encode' | 'decode' | 'detect' | 'embed'

interface DetectResult {
  hasInvisible: boolean
  invisibleCount: number
  hiddenText: string
  cleanText: string
}

export default function InvisibleUnicodePage() {
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [carrier, setCarrier] = useState('')
  const [output, setOutput] = useState('')
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 降级方案
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

  const handleExecute = () => {
    setError('')
    setOutput('')
    setDetectResult(null)

    if (!input.trim()) {
      setError('请输入内容')
      return
    }

    try {
      switch (mode) {
        case 'encode': {
          const result = encode(input)
          setOutput(result)
          break
        }
        case 'decode': {
          const result = decode(input)
          if (!result) {
            setError('未检测到有效的隐藏内容，请确认输入包含编码后的不可见字符')
            return
          }
          setOutput(result)
          break
        }
        case 'detect': {
          const result = detect(input)
          setDetectResult(result)
          break
        }
        case 'embed': {
          if (!carrier.trim()) {
            setError('请输入载体文本')
            return
          }
          const result = embed(carrier, input)
          setOutput(result)
          setDetectResult(detect(result))
          break
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请检查输入内容')
    }
  }

  const modes: { key: Mode; label: string; icon: React.ReactNode }[] = [
    { key: 'encode', label: '编码', icon: <EyeOff size={16} /> },
    { key: 'decode', label: '解码', icon: <Eye size={16} /> },
    { key: 'detect', label: '检测', icon: <Search size={16} /> },
    { key: 'embed', label: '嵌入', icon: <ArrowRightLeft size={16} /> },
  ]

  const getInputLabel = () => {
    switch (mode) {
      case 'encode': return '要隐藏的文本'
      case 'decode': return '包含不可见字符的文本'
      case 'detect': return '要检测的文本'
      case 'embed': return '要隐藏的秘密文本'
    }
  }

  const getInputPlaceholder = () => {
    switch (mode) {
      case 'encode': return '输入你想隐藏的文本内容...'
      case 'decode': return '粘贴包含不可见字符的文本...'
      case 'detect': return '粘贴要检测的文本，查看是否包含隐藏内容...'
      case 'embed': return '输入你想要隐藏的秘密信息...'
    }
  }

  const getButtonLabel = () => {
    switch (mode) {
      case 'encode': return '编码'
      case 'decode': return '解码'
      case 'detect': return '检测'
      case 'embed': return '嵌入'
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
            <EyeOff className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">不可见 Unicode 隐写</h1>
        </div>
        <p className="text-gray-500 text-sm">
          使用不可见 Unicode 字符隐藏、解码、检测或嵌入秘密文本
        </p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key)
              setOutput('')
              setDetectResult(null)
              setError('')
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              mode === m.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* 输入区域 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4">
        {mode === 'embed' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              载体文本
            </label>
            <textarea
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="输入用来承载隐藏信息的正常文本..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base resize-vertical"
            />
          </div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getInputLabel()}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getInputPlaceholder()}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base resize-vertical mb-3"
        />

        <button
          onClick={handleExecute}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          {getButtonLabel()}
        </button>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* 编码结果 */}
      {mode === 'encode' && output && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 text-indigo-600 mb-4">
            <EyeOff size={18} />
            <span className="font-medium">编码成功</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg mb-3">
            <p className="text-sm text-gray-500 font-mono">
              [此处包含 {output.length} 个不可见字符]
            </p>
          </div>
          <button
            onClick={() => handleCopy(output)}
            className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" />
                已复制
              </>
            ) : (
              <>
                <Copy size={16} />
                复制不可见文本
              </>
            )}
          </button>
        </div>
      )}

      {/* 解码结果 */}
      {mode === 'decode' && output && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 text-indigo-600 mb-4">
            <Eye size={18} />
            <span className="font-medium">解码成功</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-base text-gray-900 font-mono break-all">{output}</p>
          </div>
        </div>
      )}

      {/* 嵌入结果 */}
      {mode === 'embed' && output && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 text-indigo-600 mb-4">
            <ArrowRightLeft size={18} />
            <span className="font-medium">嵌入成功</span>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">可见效果：</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-base text-gray-900">{detectResult?.cleanText}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            隐藏了 {detectResult?.invisibleCount} 个不可见字符
          </p>

          <button
            onClick={() => handleCopy(output)}
            className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" />
                已复制
              </>
            ) : (
              <>
                <Copy size={16} />
                复制嵌入后的文本
              </>
            )}
          </button>
        </div>
      )}

      {/* 检测结果 */}
      {detectResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4">
          {detectResult.hasInvisible ? (
            <>
              <div className="flex items-center gap-2 text-amber-600 mb-4">
                <AlertCircle size={18} />
                <span className="font-medium">检测到不可见字符</span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                发现 <span className="font-medium text-amber-600">{detectResult.invisibleCount}</span> 个不可见字符
              </p>

              {detectResult.hiddenText && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">隐藏内容：</p>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                    <p className="text-base text-amber-900 font-mono break-all">
                      {detectResult.hiddenText}
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">清理后的文本：</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-base text-gray-900 break-all">
                    {detectResult.cleanText || '（无可见文本）'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleCopy(detectResult.cleanText)}
                className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-600" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    复制清理后的文本
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <Check size={18} />
              <span className="font-medium">文本干净，未检测到不可见字符</span>
            </div>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-6 text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
        <p className="font-medium text-gray-700 mb-2">使用说明：</p>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>编码</strong> — 将普通文本转换为不可见的 Unicode 字符序列</li>
          <li><strong>解码</strong> — 将不可见 Unicode 字符还原为可读文本</li>
          <li><strong>检测</strong> — 检查文本中是否隐藏了不可见字符，并提取隐藏内容</li>
          <li><strong>嵌入</strong> — 将秘密信息藏在正常文本中，外观不变但包含隐藏数据</li>
        </ol>
      </div>
    </div>
  )
}
