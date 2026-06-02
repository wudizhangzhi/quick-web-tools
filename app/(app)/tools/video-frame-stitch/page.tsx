'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import {
  Film,
  Upload,
  Plus,
  X,
  Download,
  Copy,
  Check,
  GripVertical,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { event as gaEvent } from '@/lib/gtag'

interface Frame {
  id: string
  time: number
  canvas: HTMLCanvasElement
  thumbUrl: string
}

const MAX_PREVIEW_LONGEST_EDGE = 1200
const COLS_OPTIONS = [1, 2, 3, 4, 5, 6]
const LARGE_VIDEO_PIXELS = 1920 * 1080

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00.000'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds * 1000) % 1000)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

// SMPTE 工业标准：
//   3 段 mm:ss:ff       (分:秒:帧)
//   4 段 hh:mm:ss:ff    (时:分:秒:帧)
// 末段按位数自适应：1~2 位 = 帧 (需 fps)，3 位 = 毫秒 (例 00:01:123)
// 兼容旧式 1 段 (纯秒) / 2 段 mm:ss(.xxx)?
function parseTimeString(s: string, fps: number): number | null {
  const trimmed = s.trim()
  if (!trimmed) return null
  const parts = trimmed.split(':')
  if (parts.length === 0 || parts.length > 4) return null

  if (parts.length >= 3) {
    for (const p of parts) {
      if (!/^\d+$/.test(p)) return null
    }
    const nums = parts.map(Number)
    const h = parts.length === 4 ? nums[0] : 0
    const m = parts.length === 4 ? nums[1] : nums[0]
    const sec = parts.length === 4 ? nums[2] : nums[1]
    const lastStr = parts[parts.length - 1]
    const last = nums[nums.length - 1]
    // 3 位末段视为毫秒，否则视为帧
    let sub: number
    if (lastStr.length === 3) {
      if (last >= 1000) return null
      sub = last / 1000
    } else {
      if (fps <= 0 || last >= fps) return null
      sub = last / fps
    }
    return h * 3600 + m * 60 + sec + sub
  }

  for (const p of parts) {
    if (!/^\d+(\.\d+)?$/.test(p)) return null
  }
  const nums = parts.map(Number)
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null
  if (nums.length === 1) return nums[0]
  return nums[0] * 60 + nums[1]
}

function makeThumb(source: HTMLCanvasElement, maxEdge: number): string {
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(source.width * scale))
  c.height = Math.max(1, Math.round(source.height * scale))
  c.getContext('2d')!.drawImage(source, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.7)
}

function captureFrame(video: HTMLVideoElement, time: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const draw = () => {
      try {
        const c = document.createElement('canvas')
        c.width = video.videoWidth
        c.height = video.videoHeight
        const ctx = c.getContext('2d')
        if (!ctx) throw new Error('canvas context unavailable')
        ctx.drawImage(video, 0, 0)
        resolve(c)
      } catch (e) {
        reject(e)
      }
    }

    if (Math.abs(video.currentTime - time) < 0.001) {
      draw()
      return
    }

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      draw()
    }
    const onError = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      reject(new Error('视频 seek 失败'))
    }
    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.currentTime = time
  })
}

function drawStitch(
  out: HTMLCanvasElement,
  frames: Frame[],
  cols: number,
  cellW: number,
  cellH: number,
  opts: { showIndex: boolean; showTimestamp: boolean },
) {
  const rows = Math.ceil(frames.length / cols)
  out.width = cellW * cols
  out.height = cellH * rows

  const ctx = out.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, out.width, out.height)

  const fontSize = Math.max(10, Math.min(24, Math.round(cellH * 0.028)))
  const padX = Math.round(fontSize * 0.5)
  const padY = Math.round(fontSize * 0.25)
  const offset = Math.round(fontSize * 0.5)

  frames.forEach((f, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = col * cellW
    const y = row * cellH
    ctx.drawImage(f.canvas, x, y, cellW, cellH)

    const parts: string[] = []
    if (opts.showIndex) parts.push(`#${i + 1}`)
    if (opts.showTimestamp) parts.push(formatTime(f.time))
    if (parts.length === 0) return

    const labelText = parts.join('  ')
    ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
    const metrics = ctx.measureText(labelText)
    const boxW = Math.round(metrics.width + padX * 2)
    const boxH = Math.round(fontSize + padY * 2)
    const boxX = x + offset
    const boxY = y + offset
    const r = Math.min(8, Math.round(boxH * 0.3))

    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.beginPath()
    ctx.moveTo(boxX + r, boxY)
    ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + boxH, r)
    ctx.arcTo(boxX + boxW, boxY + boxH, boxX, boxY + boxH, r)
    ctx.arcTo(boxX, boxY + boxH, boxX, boxY, r)
    ctx.arcTo(boxX, boxY, boxX + boxW, boxY, r)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'middle'
    ctx.fillText(labelText, boxX + padX, boxY + boxH / 2 + 1)
  })
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function VideoFrameStitchPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const captureQueueRef = useRef<Promise<unknown>>(Promise.resolve())
  const dragFromRef = useRef<number | null>(null)

  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoDim, setVideoDim] = useState<{ w: number; h: number } | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [frames, setFrames] = useState<Frame[]>([])
  const [cols, setCols] = useState(3)
  const [frameScale, setFrameScale] = useState(80)
  const [quality, setQuality] = useState(85)
  const [showIndex, setShowIndex] = useState(true)
  const [showTimestamp, setShowTimestamp] = useState(false)
  const [fps, setFps] = useState(30)
  const [capturing, setCapturing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [batchError, setBatchError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [canCopyImage, setCanCopyImage] = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => {
    setCanCopyImage(
      typeof window !== 'undefined' &&
        typeof ClipboardItem !== 'undefined' &&
        !!navigator.clipboard?.write,
    )
  }, [])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('请选择视频文件')
      return
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
    }
    const url = URL.createObjectURL(file)
    blobUrlRef.current = url
    setError('')
    setFrames([])
    setVideoDim(null)
    setVideoReady(false)
    setCurrentTime(0)
    setVideoUrl(url)
  }, [])

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  const enqueueCapture = useCallback((t: number) => {
    const video = videoRef.current
    if (!video || !videoReady) return
    setCapturing(true)
    captureQueueRef.current = captureQueueRef.current.then(async () => {
      try {
        const canvas = await captureFrame(video, t)
        const thumbUrl = makeThumb(canvas, 240)
        setFrames((prev) => {
          const next = [...prev, { id: nanoid(8), time: t, canvas, thumbUrl }]
          gaEvent('frame_stitch_add', { frame_count: next.length })
          return next
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : '抓帧失败'
        setError(msg)
      } finally {
        setCapturing(false)
      }
    })
  }, [videoReady])

  const handleAddFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !videoReady) return
    setError('')
    enqueueCapture(video.currentTime)
  }, [videoReady, enqueueCapture])

  const handleBatchAdd = useCallback(() => {
    const video = videoRef.current
    if (!video || !videoReady) return
    setBatchError('')

    const entries = batchInput
      .split(/[,，\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (entries.length === 0) {
      setBatchError('请输入至少一个时间')
      return
    }

    const duration = Number.isFinite(video.duration) ? video.duration : Infinity
    const times: number[] = []
    const invalid: string[] = []
    for (const e of entries) {
      const t = parseTimeString(e, fps)
      if (t === null || t < 0 || t > duration) {
        invalid.push(e)
      } else {
        times.push(t)
      }
    }

    if (invalid.length > 0) {
      setBatchError(`无法解析或超出时长：${invalid.slice(0, 3).join('、')}${invalid.length > 3 ? '…' : ''}`)
      return
    }

    setError('')
    times.forEach((t) => enqueueCapture(t))
    setBatchInput('')
  }, [batchInput, videoReady, enqueueCapture, fps])

  const handleFrameClick = (time: number) => {
    const video = videoRef.current
    if (!video || !videoReady) return
    video.currentTime = time
  }

  const handleRemove = (id: string) => {
    setFrames((prev) => prev.filter((f) => f.id !== id))
  }

  const handleClearAll = () => {
    setFrames([])
  }

  const handleDragStart = (idx: number) => () => {
    dragFromRef.current = idx
  }

  const handleDragOverItem = (idx: number) => (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDropItem = (idx: number) => (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault()
    const from = dragFromRef.current
    dragFromRef.current = null
    setDragOverIdx(null)
    if (from === null || from === idx) return
    setFrames((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(idx, 0, moved)
      return next
    })
  }

  const handleDragEnd = () => {
    dragFromRef.current = null
    setDragOverIdx(null)
  }

  const onVideoLoaded = () => {
    const v = videoRef.current
    if (!v) return
    setVideoReady(true)
    setVideoDim({ w: v.videoWidth, h: v.videoHeight })
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
  }

  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    if (frames.length === 0 || !videoDim) {
      canvas.width = 0
      canvas.height = 0
      return
    }
    const rows = Math.ceil(frames.length / cols)
    const userScale = frameScale / 100
    const effW = videoDim.w * userScale
    const effH = videoDim.h * userScale
    const totalW = effW * cols
    const totalH = effH * rows
    const previewScale = Math.min(1, MAX_PREVIEW_LONGEST_EDGE / Math.max(totalW, totalH))
    const cellW = Math.max(1, Math.round(effW * previewScale))
    const cellH = Math.max(1, Math.round(effH * previewScale))

    const handle = window.setTimeout(() => {
      drawStitch(canvas, frames, cols, cellW, cellH, { showIndex, showTimestamp })
    }, 80)
    return () => window.clearTimeout(handle)
  }, [frames, cols, videoDim, frameScale, showIndex, showTimestamp])

  const runExport = async (
    kind: 'download_png' | 'download_jpeg' | 'copy',
  ) => {
    if (frames.length === 0 || !videoDim || exporting) return

    if (
      videoDim.w * videoDim.h > LARGE_VIDEO_PIXELS &&
      typeof window !== 'undefined' &&
      !window.confirm('视频分辨率较高，导出可能耗时较长。继续吗？')
    ) {
      return
    }

    setExporting(true)
    setError('')
    try {
      const out = document.createElement('canvas')
      const userScale = frameScale / 100
      const exportCellW = Math.max(1, Math.round(videoDim.w * userScale))
      const exportCellH = Math.max(1, Math.round(videoDim.h * userScale))
      drawStitch(out, frames, cols, exportCellW, exportCellH, { showIndex, showTimestamp })

      if (kind === 'download_png') {
        await new Promise<void>((resolve, reject) => {
          out.toBlob((b) => {
            if (!b) return reject(new Error('生成 PNG 失败'))
            triggerDownload(b, `frame-stitch-${Date.now()}.png`)
            resolve()
          }, 'image/png')
        })
      } else if (kind === 'download_jpeg') {
        await new Promise<void>((resolve, reject) => {
          out.toBlob(
            (b) => {
              if (!b) return reject(new Error('生成 JPEG 失败'))
              triggerDownload(b, `frame-stitch-${Date.now()}.jpg`)
              resolve()
            },
            'image/jpeg',
            quality / 100,
          )
        })
      } else {
        const blob = await new Promise<Blob>((resolve, reject) => {
          out.toBlob((b) => (b ? resolve(b) : reject(new Error('生成图片失败'))), 'image/png')
        })
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }

      gaEvent('frame_stitch_share', {
        status: kind,
        frame_count: frames.length,
        cols,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导出失败'
      setError(msg)
    } finally {
      setExporting(false)
    }
  }

  const rowsForGrid = useMemo(
    () => (frames.length ? Math.ceil(frames.length / cols) : 0),
    [frames.length, cols],
  )

  const hasFrames = frames.length > 0

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Film className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">视频帧拼图</h1>
        </div>
        <p className="text-gray-500 text-sm">
          拖入视频，选取若干个时间点，实时拼出带序号与时间戳的网格大图。视频不会上传，全程在浏览器中完成。
        </p>
      </div>

      {!videoUrl && (
        <label
          htmlFor="video-frame-stitch-file"
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`block cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/50'
          }`}
        >
          <input
            id="video-frame-stitch-file"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileInput}
          />
          <Upload className="mx-auto text-gray-400 mb-3" size={36} />
          <p className="text-gray-700 font-medium">拖入视频文件，或点击选择</p>
          <p className="text-sm text-gray-400 mt-1">
            支持 MP4 / WebM / MOV 等浏览器原生支持的格式
          </p>
        </label>
      )}

      {videoUrl && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_minmax(0,1.3fr)] md:items-start">
            {/* 左列：视频 + 设置 + 导出 */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  playsInline
                  onLoadedMetadata={onVideoLoaded}
                  onTimeUpdate={onTimeUpdate}
                  onSeeked={onTimeUpdate}
                  className="w-full rounded-lg bg-black max-h-[50vh]"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddFrame}
                    disabled={!videoReady || capturing}
                    className="flex-1 min-w-[180px] px-3 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Plus size={16} />
                    添加这一帧 @ {formatTime(currentTime)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
                      blobUrlRef.current = null
                      setVideoUrl(null)
                      setFrames([])
                      setVideoDim(null)
                      setVideoReady(false)
                      setCurrentTime(0)
                      setError('')
                    }}
                    className="px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    换视频
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-stretch gap-2">
                    <input
                      type="text"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleBatchAdd()
                        }
                      }}
                      placeholder="批量时间：00:01:12 (分:秒:帧) 或 00:01:123 (分:秒:毫秒)"
                      className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                      FPS
                      <input
                        type="number"
                        min={1}
                        max={240}
                        step={1}
                        value={fps}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          if (Number.isFinite(n) && n > 0) setFps(n)
                        }}
                        className="w-14 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleBatchAdd}
                      disabled={!videoReady || !batchInput.trim()}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      批量添加
                    </button>
                  </div>
                  {batchError && (
                    <p className="text-xs text-red-600">{batchError}</p>
                  )}
                </div>

                {videoDim && (
                  <p className="text-xs text-gray-400">
                    视频尺寸：{videoDim.w} × {videoDim.h}
                  </p>
                )}
              </div>

              {/* 设置 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="shrink-0 w-20">列数：</span>
                  <select
                    value={cols}
                    onChange={(e) => setCols(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {COLS_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {hasFrames && rowsForGrid > 0 && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({cols} × {rowsForGrid})
                    </span>
                  )}
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="shrink-0 w-20">缩放比例：</span>
                  <input
                    type="range"
                    min={25}
                    max={100}
                    step={5}
                    value={frameScale}
                    onChange={(e) => setFrameScale(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="font-mono text-gray-500 w-12 text-right shrink-0">
                    {frameScale}%
                  </span>
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="shrink-0 w-20">JPEG 质量：</span>
                  <input
                    type="range"
                    min={60}
                    max={95}
                    step={5}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="font-mono text-gray-500 w-12 text-right shrink-0">
                    {quality}
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                  <span className="shrink-0 w-20">标签：</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showIndex}
                      onChange={(e) => setShowIndex(e.target.checked)}
                      className="accent-emerald-600"
                    />
                    序号
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTimestamp}
                      onChange={(e) => setShowTimestamp(e.target.checked)}
                      className="accent-emerald-600"
                    />
                    时间戳
                  </label>
                </div>

                {videoDim && hasFrames && (
                  <p className="text-xs text-gray-400">
                    导出尺寸：
                    {Math.round(videoDim.w * (frameScale / 100)) * cols} ×{' '}
                    {Math.round(videoDim.h * (frameScale / 100)) * rowsForGrid} px
                  </p>
                )}
              </div>

              {/* 导出 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runExport('download_png')}
                  disabled={!hasFrames || exporting}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Download size={16} />
                  下载 PNG
                </button>
                <button
                  type="button"
                  onClick={() => runExport('download_jpeg')}
                  disabled={!hasFrames || exporting}
                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Download size={16} />
                  下载 JPEG
                </button>
                <button
                  type="button"
                  onClick={() => runExport('copy')}
                  disabled={!hasFrames || exporting || !canCopyImage}
                  title={canCopyImage ? '' : '当前浏览器不支持图片剪贴板写入'}
                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-emerald-600" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      复制到剪贴板
                    </>
                  )}
                </button>
                {exporting && (
                  <span className="text-sm text-gray-500 self-center">导出中…</span>
                )}
              </div>
            </div>

            {/* 中：已选帧（窄列） */}
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-700">
                  已选帧 ({frames.length})
                </h2>
                {hasFrames && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    清空
                  </button>
                )}
              </div>

              {frames.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  在视频中挑一个时刻，点「添加这一帧」
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  {frames.map((f, idx) => (
                    <li
                      key={f.id}
                      draggable
                      onDragStart={handleDragStart(idx)}
                      onDragOver={handleDragOverItem(idx)}
                      onDrop={handleDropItem(idx)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleFrameClick(f.time)}
                      title="点击跳转到此时间"
                      className={`flex items-center gap-1.5 p-1.5 rounded-md border transition-colors cursor-pointer ${
                        dragOverIdx === idx
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'
                      }`}
                    >
                      <GripVertical
                        size={12}
                        className="text-gray-300 shrink-0 cursor-grab"
                      />
                      <span className="text-[11px] font-mono text-gray-500 shrink-0 w-4">
                        {idx + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.thumbUrl}
                        alt={`frame ${idx + 1}`}
                        className="w-10 h-6 object-cover rounded bg-gray-100 shrink-0"
                      />
                      <span className="text-[11px] font-mono text-gray-600 flex-1 truncate">
                        {formatTime(f.time)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(f.id)
                        }}
                        className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0"
                        aria-label="删除"
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 右：实时预览 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">实时预览</h2>
              {hasFrames ? (
                <div className="bg-gray-50 rounded-lg p-2">
                  <canvas
                    ref={previewCanvasRef}
                    className="block max-w-full h-auto mx-auto"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-12 text-center bg-gray-50 rounded-lg">
                  先添加一帧…
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
