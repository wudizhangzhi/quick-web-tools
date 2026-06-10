'use client'

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import {
  FileText,
  Upload,
  Copy,
  Check,
  Download,
  X,
  Columns,
  Eye,
  ClipboardPaste,
  RotateCcw,
  AlertCircle,
  Edit2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { event as gaEvent } from '@/lib/gtag'

type ViewMode = 'split' | 'preview'

const SAMPLE = `# Markdown 预览

欢迎使用 Markdown 预览工具！

## 基础语法

- **加粗** 使用 \`**text**\`
- *斜体* 使用 \`*text*\`
- ~~删除线~~ 使用 \`~~text~~\`
- [链接](https://example.com)
- 行内 \`code\`

## 列表

1. 有序列表第一项
2. 第二项
   - 嵌套无序项 A
   - 嵌套无序项 B

- [x] 已完成任务
- [ ] 待办任务

## 表格 (GFM)

| 功能 | 描述 | 支持 |
|------|------|------|
| 标题 | 各级标题 | ✅ |
| 表格 | GFM 表格 | ✅ |
| 代码块 | 语法高亮风格 | ✅ |
| 任务列表 | 复选框 | ✅ |

## 引用

> 这是一段引用文本。
> 可以有多行。

## 代码块

\`\`\`ts
function greet(name: string) {
  console.log(\`Hello, \${name}!\`)
}
\`\`\`

---

拖拽 .md 文件到编辑区即可加载，或点击上方按钮操作。支持实时预览与分屏切换。
`

export default function MarkdownPreviewPage() {
  const [markdown, setMarkdown] = useState('')
  const [fileName, setFileName] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [dragOver, setDragOver] = useState(false)
  const [copied, setCopied] = useState<'source' | 'html' | null>(null)
  const [error, setError] = useState('')

  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadContent = useCallback((content: string, name?: string, source: 'file' | 'clipboard' | 'sample' = 'file') => {
    setMarkdown(content)
    setFileName(name || 'untitled.md')
    setError('')
    // 加载后默认切到分屏，便于继续编辑
    setViewMode('split')
    if (source !== 'sample') {
      gaEvent('markdown_preview_load', { source })
    }
  }, [])

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) || ''
      loadContent(text, file.name, 'file')
    }
    reader.onerror = () => {
      setError('读取文件失败')
    }
    reader.readAsText(file, 'utf-8')
  }, [loadContent])

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const onDragOver = (e: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = () => setDragOver(false)

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        loadContent(text, 'clipboard.md', 'clipboard')
      } else {
        setError('剪贴板没有文本内容')
      }
    } catch {
      setError('无法访问剪贴板，请直接在编辑区粘贴内容')
    }
  }

  const loadSample = () => {
    loadContent(SAMPLE, 'example.md', 'sample')
  }

  const clearAll = () => {
    setMarkdown('')
    setFileName('')
    setError('')
    setCopied(null)
  }

  const copySource = async () => {
    if (!markdown.trim()) return
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied('source')
      setTimeout(() => setCopied(null), 1800)
      gaEvent('markdown_preview_share', { status: 'copy_source' })
    } catch {
      // 降级
      const ta = document.createElement('textarea')
      ta.value = markdown
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied('source')
      setTimeout(() => setCopied(null), 1800)
      gaEvent('markdown_preview_share', { status: 'copy_source' })
    }
  }

  const downloadMd = () => {
    if (!markdown.trim()) return
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'document.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 800)
    gaEvent('markdown_preview_share', { status: 'download_md' })
  }

  const copyRenderedHtml = async () => {
    const el = previewRef.current
    if (!el) return
    try {
      const html = el.innerHTML
      await navigator.clipboard.writeText(html)
      setCopied('html')
      setTimeout(() => setCopied(null), 1800)
      gaEvent('markdown_preview_share', { status: 'copy_html' })
    } catch {
      setError('复制 HTML 失败')
    }
  }

  // 自定义渲染组件，美化预览
  const mdComponents: Components = {
    h1: ({ children, ...props }) => (
      <h1 className="text-2xl font-bold mt-6 mb-3 pb-1 border-b border-gray-200" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-xl font-semibold mt-5 mb-2" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-lg font-semibold mt-4 mb-1.5" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-base font-semibold mt-3 mb-1" {...props}>{children}</h4>
    ),
    p: ({ children, ...props }) => (
      <p className="my-2 leading-relaxed text-[15px]" {...props}>{children}</p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-5 my-2 space-y-0.5" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-5 my-2 space-y-0.5" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li className="my-0.5" {...props}>{children}</li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 pr-2 py-1 my-3 text-gray-600 italic bg-gray-50 rounded-r" {...props}>
        {children}
      </blockquote>
    ),
    hr: (props) => <hr className="my-6 border-gray-200" {...props} />,
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-violet-600 hover:underline break-all"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    img: ({ alt, src, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={alt || ''}
        src={src}
        className="max-w-full h-auto rounded-lg my-2 border border-gray-100"
        {...props}
      />
    ),
    pre: ({ children, ...props }) => (
      <pre className="bg-gray-900 text-gray-100 p-3.5 rounded-xl overflow-x-auto my-3 text-sm leading-relaxed" {...props}>
        {children}
      </pre>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-[0.9em] font-mono"
            {...props}
          >
            {children}
          </code>
        )
      }
      // block code inside pre
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    table: ({ children, ...props }) => (
      <div className="my-3 overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-gray-100" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold align-top" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-gray-300 px-3 py-1.5 align-top" {...props}>{children}</td>
    ),
  }

  const hasContent = markdown.trim().length > 0

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
            <FileText className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Markdown 预览</h1>
        </div>
        <p className="text-gray-500 text-sm">
          拖拽 .md 文件或粘贴内容，实时查看格式化效果。支持全预览和分屏（源码 + 预览）两种模式。
        </p>
      </div>

      {/* 顶部操作栏 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* 加载操作 */}
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border cursor-pointer transition-colors ${
            dragOver ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-300 bg-white hover:bg-gray-50'
          }`}
        >
          <Upload size={15} />
          <span>加载文件</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>

        <button
          type="button"
          onClick={pasteFromClipboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
        >
          <ClipboardPaste size={15} />
          从剪贴板
        </button>

        <button
          type="button"
          onClick={loadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
        >
          示例
        </button>

        <div className="flex-1" />

        {/* 视图切换 */}
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              viewMode === 'split'
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Columns size={15} />
            分屏
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-l transition-colors ${
              viewMode === 'preview'
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Eye size={15} />
            全预览
          </button>
        </div>

        {/* 分享操作 */}
        {hasContent && (
          <>
            <button
              type="button"
              onClick={copySource}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {copied === 'source' ? (
                <>
                  <Check size={15} className="text-green-600" /> 已复制
                </>
              ) : (
                <>
                  <Copy size={15} /> 复制源码
                </>
              )}
            </button>

            <button
              type="button"
              onClick={downloadMd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Download size={15} />
              下载 .md
            </button>

            <button
              type="button"
              onClick={copyRenderedHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              title="复制渲染后的 HTML 片段"
            >
              {copied === 'html' ? (
                <>
                  <Check size={15} className="text-green-600" /> 已复制
                </>
              ) : (
                <>
                  <Copy size={15} /> 复制 HTML
                </>
              )}
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-red-600"
            >
              <X size={15} /> 清空
            </button>
          </>
        )}
      </div>

      {/* 空状态：大拖拽区 */}
      {!hasContent && (
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`block cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            dragOver
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-300 bg-white hover:border-violet-300 hover:bg-violet-50/30'
          }`}
        >
          <input
            type="file"
            accept=".md,.markdown,text/*"
            className="hidden"
            onChange={handleFileInput}
          />
          <Upload className="mx-auto text-gray-400 mb-4" size={42} />
          <p className="text-gray-700 font-medium">拖拽 Markdown 文件到此处，或点击选择</p>
          <p className="text-sm text-gray-500 mt-1">支持 .md / .markdown / 纯文本文件</p>
          <div className="mt-4 flex justify-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-gray-100 rounded">或使用上方「从剪贴板」</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded">或「示例」</span>
          </div>
        </label>
      )}

      {/* 有内容：分屏或全预览 */}
      {hasContent && (
        <>
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 源码编辑 */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`bg-white rounded-xl border ${dragOver ? 'border-violet-400 ring-1 ring-violet-200' : 'border-gray-200'} overflow-hidden`}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b text-xs text-gray-500 bg-gray-50">
                  <span className="font-medium">
                    Markdown 源码 {fileName ? `· ${fileName}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="hover:text-red-600 flex items-center gap-1"
                  >
                    <RotateCcw size={13} /> 重置
                  </button>
                </div>
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="在此输入或编辑 Markdown..."
                  className="w-full min-h-[420px] lg:min-h-[62vh] p-4 font-mono text-[13.5px] leading-relaxed resize-y outline-none"
                  spellCheck={false}
                />
              </div>

              {/* 实时预览 */}
              <div>
                <div className="text-xs text-gray-500 mb-1.5 px-1 flex items-center justify-between">
                  <span>预览</span>
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className="flex items-center gap-1 text-violet-600 hover:text-violet-700"
                  >
                    <Eye size={14} /> 全屏预览
                  </button>
                </div>
                <div
                  ref={previewRef}
                  className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 min-h-[420px] lg:min-h-[62vh] overflow-auto shadow-sm"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            /* 全预览模式 */
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm text-gray-600">
                  预览 {fileName ? `· ${fileName}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                >
                  <Edit2 size={15} /> 返回编辑
                </button>
              </div>
              <div
                ref={previewRef}
                className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 min-h-[68vh] overflow-auto shadow-sm"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* 底部提示 */}
      <div className="mt-8 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-4">
        <p className="font-medium text-gray-600 mb-1">支持特性</p>
        <ul className="list-disc list-inside space-y-0.5 text-gray-500">
          <li>GFM：表格、任务列表、删除线、自动链接</li>
          <li>实时预览：编辑源码立即更新右侧/下方预览</li>
          <li>拖拽或从剪贴板加载文件内容（不会上传到服务器）</li>
          <li>分屏适合对照编辑，全预览适合阅读与演示</li>
        </ul>
      </div>
    </div>
  )
}
