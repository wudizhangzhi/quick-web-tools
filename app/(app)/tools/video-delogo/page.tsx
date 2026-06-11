'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  Eraser,
  Crop,
  Upload,
  X,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  Play,
  Pause,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { event as gaEvent } from '@/lib/gtag'
import {
  buildCommand,
  defaultOutputName,
  wasClamped,
  type Region,
} from '@/lib/video-delogo/command'
import { pointerToReal, toPercent } from '@/lib/video-delogo/geometry'

interface UIRegion extends Region {
  id: string
}

type Mode = 'create' | 'move' | 'resize'

interface Interaction {
  mode: Mode
  id?: string
  startX: number
  startY: number
  orig?: Region
}

const MIN_SIZE = 4 // real px; ignore stray clicks / tiny boxes

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00.0'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const d = Math.floor((seconds * 10) % 10)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${d}`
}

export default function VideoDelogoPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const interactionRef = useRef<Interaction | null>(null)
  const draftRef = useRef<Region | null>(null)

  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoSize, setVideoSize] = useState<{ w: number; h: number } | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [regions, setRegions] = useState<UIRegion[]>([])
  const [draft, setDraft] = useState<Region | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [inputName, setInputName] = useState('input.mp4')
  const [outputName, setOutputName] = useState('input_delogo.mp4')
  const [reduceQuality, setReduceQuality] = useState(false)
  const [mode, setMode] = useState<'delogo' | 'crop'>('delogo')
  const [dragOver, setDragOver] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('请选择视频文件')
      return
    }
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    const url = URL.createObjectURL(file)
    blobUrlRef.current = url
    setError('')
    setRegions([])
    setDraft(null)
    setActiveId(null)
    setVideoSize(null)
    setDuration(0)
    setCurrentTime(0)
    setPlaying(false)
    setVideoUrl(url)
    setInputName(file.name)
    setOutputName(defaultOutputName(file.name, mode))
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

  const resetVideo = () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = null
    setVideoUrl(null)
    setRegions([])
    setDraft(null)
    setActiveId(null)
    setVideoSize(null)
    setDuration(0)
    setCurrentTime(0)
    setPlaying(false)
    setError('')
  }

  const onLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    setVideoSize({ w: v.videoWidth, h: v.videoHeight })
    setDuration(Number.isFinite(v.duration) ? v.duration : 0)
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }

  const onSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Number(e.target.value)
  }

  // Convert a pointer event into real video-pixel coordinates.
  const realFromEvent = useCallback(
    (e: ReactPointerEvent): { x: number; y: number } => {
      const overlay = overlayRef.current
      if (!overlay || !videoSize) return { x: 0, y: 0 }
      const rect = overlay.getBoundingClientRect()
      return pointerToReal(e.clientX, e.clientY, rect, videoSize.w, videoSize.h)
    },
    [videoSize],
  )

  const onOverlayPointerDown = (e: ReactPointerEvent) => {
    if (!videoSize) return
    videoRef.current?.pause()
    const p = realFromEvent(e)
    interactionRef.current = { mode: 'create', startX: p.x, startY: p.y }
    setActiveId(null)
    const start = { x: p.x, y: p.y, w: 0, h: 0 }
    draftRef.current = start
    setDraft(start)
    overlayRef.current?.setPointerCapture(e.pointerId)
  }

  const onRegionPointerDown = (id: string) => (e: ReactPointerEvent) => {
    e.stopPropagation()
    if (!videoSize) return
    const r = regions.find((x) => x.id === id)
    if (!r) return
    const p = realFromEvent(e)
    interactionRef.current = { mode: 'move', id, startX: p.x, startY: p.y, orig: { ...r } }
    setActiveId(id)
    overlayRef.current?.setPointerCapture(e.pointerId)
  }

  const onResizePointerDown = (id: string) => (e: ReactPointerEvent) => {
    e.stopPropagation()
    if (!videoSize) return
    const r = regions.find((x) => x.id === id)
    if (!r) return
    const p = realFromEvent(e)
    interactionRef.current = { mode: 'resize', id, startX: p.x, startY: p.y, orig: { ...r } }
    setActiveId(id)
    overlayRef.current?.setPointerCapture(e.pointerId)
  }

  const onOverlayPointerMove = (e: ReactPointerEvent) => {
    const it = interactionRef.current
    if (!it || !videoSize) return
    const p = realFromEvent(e)
    if (it.mode === 'create') {
      const next = {
        x: Math.min(it.startX, p.x),
        y: Math.min(it.startY, p.y),
        w: Math.abs(p.x - it.startX),
        h: Math.abs(p.y - it.startY),
      }
      draftRef.current = next
      setDraft(next)
    } else if (it.mode === 'move' && it.orig && it.id) {
      const dx = p.x - it.startX
      const dy = p.y - it.startY
      const nx = Math.min(Math.max(0, it.orig.x + dx), videoSize.w - it.orig.w)
      const ny = Math.min(Math.max(0, it.orig.y + dy), videoSize.h - it.orig.h)
      setRegions((prev) => prev.map((r) => (r.id === it.id ? { ...r, x: nx, y: ny } : r)))
    } else if (it.mode === 'resize' && it.orig && it.id) {
      const nw = Math.min(Math.max(MIN_SIZE, it.orig.w + (p.x - it.startX)), videoSize.w - it.orig.x)
      const nh = Math.min(Math.max(MIN_SIZE, it.orig.h + (p.y - it.startY)), videoSize.h - it.orig.y)
      setRegions((prev) => prev.map((r) => (r.id === it.id ? { ...r, w: nw, h: nh } : r)))
    }
  }

  const onOverlayPointerUp = (e: ReactPointerEvent) => {
    const it = interactionRef.current
    interactionRef.current = null
    overlayRef.current?.releasePointerCapture(e.pointerId)
    if (it?.mode === 'create') {
      const d = draftRef.current
      if (d && d.w >= MIN_SIZE && d.h >= MIN_SIZE) {
        const region = { id: nanoid(6), ...d }
        if (mode === 'crop') {
          // crop: only one region allowed (replaces)
          setRegions([region])
        } else {
          setRegions((prev) => [...prev, region])
        }
        setActiveId(region.id)
      } else if (mode === 'crop') {
        setRegions([])
        setActiveId(null)
      }
      draftRef.current = null
      setDraft(null)
    }
  }

  const removeRegion = (id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id))
    if (activeId === id) setActiveId(null)
  }

  // Set or clear time bounds on the currently active region (delogo only).
  // These are explicit user decisions about the main output → we emit gaEvent.
  const setActiveRegionTime = (which: 'start' | 'end' | 'clear') => {
    if (!activeId) return
    setRegions((prev) =>
      prev.map((r) => {
        if (r.id !== activeId) return r
        if (which === 'clear') {
          const { startSec: _s, endSec: _e, ...rest } = r
          return rest as UIRegion
        }
        const t = Math.max(0, Math.round(currentTime * 100) / 100) // 2 decimals is plenty
        return { ...r, [which === 'start' ? 'startSec' : 'endSec']: t }
      }),
    )
    gaEvent('video_delogo_time', { action: which === 'clear' ? 'clear' : `set_${which}`, mode: 'delogo' })
  }

  const command = useMemo(() => {
    if (!videoSize) return ''
    return buildCommand({ inputName, outputName, regions, videoW: videoSize.w, videoH: videoSize.h, mode, reduceQuality })
  }, [inputName, outputName, regions, videoSize, mode, reduceQuality])

  const edgeWarning = useMemo(() => {
    if (!videoSize || mode !== 'delogo') return false
    return regions.some((r) => wasClamped(r, videoSize.w, videoSize.h, mode))
  }, [regions, videoSize, mode])

  const timedRegionsCount = useMemo(
    () => regions.filter((r) => r.startSec != null || r.endSec != null).length,
    [regions],
  )

  const activeRegion = useMemo(
    () => regions.find((r) => r.id === activeId) ?? null,
    [regions, activeId],
  )

  const copyCommand = async () => {
    if (!command) return
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      gaEvent('video_delogo_share', {
        status: 'copy_command',
        regions: regions.length,
        mode,
        timedRegions: regions.filter((r) => r.startSec != null || r.endSec != null).length,
      })
    } catch {
      setError('复制失败，请手动选择命令复制')
    }
  }

  // Render a region (real px) as percentage box over the overlay.
  const boxStyle = (r: Region) =>
    videoSize
      ? {
          left: `${toPercent(r.x, videoSize.w)}%`,
          top: `${toPercent(r.y, videoSize.h)}%`,
          width: `${toPercent(r.w, videoSize.w)}%`,
          height: `${toPercent(r.h, videoSize.h)}%`,
        }
      : {}

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
            {mode === 'delogo' ? <Eraser className="text-white" size={20} /> : <Crop className="text-white" size={20} />}
          </div>
          <h1 className="text-xl font-bold text-gray-900">视频去台标 / 裁切命令</h1>
        </div>
        <p className="text-gray-500 text-sm">
          选视频、在画面上框选区域，生成 ffmpeg <code className="px-1 bg-gray-100 rounded text-gray-700">delogo</code>（去水印，可多框、可分别控制时间段）或 <code className="px-1 bg-gray-100 rounded text-gray-700">crop</code>（裁切保留区域）命令拿去本地跑。视频不会上传，全程在浏览器中完成。
        </p>
      </div>

      {!videoUrl && (
        <label
          htmlFor="video-delogo-file"
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`block cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver
              ? 'border-sky-500 bg-sky-50'
              : 'border-gray-300 bg-white hover:border-sky-400 hover:bg-sky-50/50'
          }`}
        >
          <input
            id="video-delogo-file"
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
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-start">
          {/* 左：取帧 + 框选 */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
              {/* w-fit + max-w-full shrink-wraps the wrapper to the video's
                  real displayed rect (intrinsic aspect preserved), so the
                  absolute overlay coincides exactly with the visible frame. */}
              <div className="relative select-none w-fit max-w-full mx-auto bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  playsInline
                  onLoadedMetadata={onLoadedMetadata}
                  onTimeUpdate={() => {
                    const v = videoRef.current
                    if (v) setCurrentTime(v.currentTime)
                  }}
                  onSeeked={() => {
                    const v = videoRef.current
                    if (v) setCurrentTime(v.currentTime)
                  }}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  className="block max-w-full max-h-[55vh] h-auto"
                />
                {/* 绘制覆盖层 */}
                <div
                  ref={overlayRef}
                  onPointerDown={onOverlayPointerDown}
                  onPointerMove={onOverlayPointerMove}
                  onPointerUp={onOverlayPointerUp}
                  className="absolute inset-0 cursor-crosshair touch-none"
                >
                  {regions.map((r) => (
                    <div
                      key={r.id}
                      onPointerDown={onRegionPointerDown(r.id)}
                      style={boxStyle(r)}
                      className={`absolute cursor-move border-2 backdrop-blur-md ${
                        activeId === r.id
                          ? 'border-sky-400 bg-sky-400/10'
                          : 'border-sky-300/80 bg-white/5'
                      }`}
                    >
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeRegion(r.id)
                        }}
                        className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white text-gray-700 rounded-full shadow flex items-center justify-center hover:bg-red-500 hover:text-white"
                        aria-label="删除区域"
                      >
                        <X size={12} />
                      </button>
                      {/* 缩放手柄 */}
                      <div
                        onPointerDown={onResizePointerDown(r.id)}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-sky-400 border-2 border-white rounded-sm cursor-nwse-resize"
                      />
                    </div>
                  ))}
                  {/* 正在绘制的临时框 */}
                  {draft && draft.w > 0 && draft.h > 0 && (
                    <div
                      style={boxStyle(draft)}
                      className="absolute border-2 border-dashed border-sky-400 bg-sky-400/10 pointer-events-none"
                    />
                  )}
                </div>
              </div>

              {/* 自定义播放控制（覆盖层会挡住原生 controls，故自带） */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 shrink-0"
                  aria-label={playing ? '暂停' : '播放'}
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.01}
                  value={currentTime}
                  onChange={onSeek}
                  className="flex-1 accent-sky-600"
                />
                <span className="text-xs font-mono text-gray-500 shrink-0 w-24 text-right">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {videoSize ? `视频尺寸：${videoSize.w} × ${videoSize.h}` : '加载中…'}
                  {regions.length > 0 && (
                    mode === 'crop'
                      ? ' · 已选裁切区域'
                      : ` · ${regions.length} 个区域${timedRegionsCount > 0 ? `（${timedRegionsCount} 个带时间限制）` : ''}`
                  )}
                </span>
                <button
                  type="button"
                  onClick={resetVideo}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-900"
                >
                  <RotateCcw size={12} />
                  换视频
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 px-1">
              {mode === 'delogo'
                ? '拖拽画框选择要抹掉的区域（支持多个框，链式处理；可分别为每个框设置生效时间段）；拖动/缩放/删除。'
                : '拖拽画框选择要保留的区域（仅单个区域，新框替换旧框）；拖动/缩放/删除。'}
            </p>
          </div>

          {/* 右：命令 + 文件名 */}
          <div className="space-y-4">
            {/* 模式切换 */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex">
              <button
                type="button"
                onClick={() => {
                  const newMode: 'delogo' | 'crop' = 'delogo'
                  if (newMode !== mode) {
                    setMode(newMode)
                    if (inputName) setOutputName(defaultOutputName(inputName, newMode))
                    if (regions.length > 1) {
                      setRegions([regions[0]])
                      setActiveId(regions[0].id)
                    }
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  mode === 'delogo' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eraser size={14} /> 去台标 (delogo)
              </button>
              <button
                type="button"
                onClick={() => {
                  const newMode: 'delogo' | 'crop' = 'crop'
                  if (newMode !== mode) {
                    setMode(newMode)
                    if (inputName) setOutputName(defaultOutputName(inputName, newMode))
                    if (regions.length > 1) {
                      setRegions([regions[0]])
                      setActiveId(regions[0].id)
                    }
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  mode === 'crop' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Crop size={14} /> 裁切区域 (crop)
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h2 className="text-sm font-medium text-gray-700">文件名</h2>
              <label className="block text-xs text-gray-500">
                输入
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-mono"
                />
              </label>
              <label className="block text-xs text-gray-500">
                输出
                <input
                  type="text"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-mono"
                />
              </label>
            </div>

            {/* 时间范围控制 —— 仅 delogo 模式 + 有区域时显示。针对当前选中的区域（activeId）。 */}
            {mode === 'delogo' && regions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div>
                  <h2 className="text-sm font-medium text-gray-700">时间范围（可选）</h2>
                  <p className="text-xs text-gray-500 mt-0.5">仅对「去台标」生效。留空 = 全程。点击画面中的框来编辑对应区域。</p>
                </div>

                {activeRegion ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-xs text-gray-500">
                        开始（秒）
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={activeRegion.startSec ?? ''}
                          onChange={(e) => {
                            const v = e.target.value.trim()
                            const num = v === '' ? undefined : parseFloat(v)
                            const safe = Number.isFinite(num as number) ? (num as number) : undefined
                            setRegions((prev) =>
                              prev.map((r) => (r.id === activeId ? { ...r, startSec: safe } : r)),
                            )
                            // 表单 onChange 按规范不埋点
                          }}
                          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-mono"
                          placeholder="从头"
                        />
                      </label>
                      <label className="block text-xs text-gray-500">
                        结束（秒）
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={activeRegion.endSec ?? ''}
                          onChange={(e) => {
                            const v = e.target.value.trim()
                            const num = v === '' ? undefined : parseFloat(v)
                            const safe = Number.isFinite(num as number) ? (num as number) : undefined
                            setRegions((prev) =>
                              prev.map((r) => (r.id === activeId ? { ...r, endSec: safe } : r)),
                            )
                          }}
                          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-mono"
                          placeholder="到尾"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveRegionTime('start')}
                        className="px-2.5 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center gap-1"
                      >
                        用当前时刻作起点
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveRegionTime('end')}
                        className="px-2.5 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center gap-1"
                      >
                        用当前时刻作终点
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveRegionTime('clear')}
                        className="px-2.5 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700"
                      >
                        清除时间限制
                      </button>
                    </div>

                    <div className="text-xs text-gray-500 font-mono">
                      {activeRegion.startSec != null || activeRegion.endSec != null
                        ? `生效：${activeRegion.startSec != null ? formatTime(activeRegion.startSec) : '00:00.0'} → ${activeRegion.endSec != null ? formatTime(activeRegion.endSec) : '结束'}`
                        : '生效：全程'}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 py-1">点击左侧画面上的一个区域来设置它的时间范围。</p>
                )}

                {timedRegionsCount > 0 && (
                  <p className="text-[10px] text-amber-600">已为 {timedRegionsCount} 个区域设置了时间限制（ffmpeg enable）。</p>
                )}
              </div>
            )}

            {/* crop 模式提示：不提供时间控制 */}
            {mode === 'crop' && regions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-xs text-gray-500">
                crop 模式暂不支持时间段限制（中途分辨率变化会导致播放问题）。需要只处理片段时，可在命令前自行加上 <code className="px-1 bg-gray-100">-ss 起始 -t 时长</code>。
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-700">ffmpeg 命令</h2>
                <button
                  type="button"
                  onClick={copyCommand}
                  disabled={!command}
                  className="px-3 py-1.5 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制命令'}
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={reduceQuality}
                  onChange={(e) => setReduceQuality(e.target.checked)}
                  className="h-4 w-4 accent-sky-600 rounded border-gray-300"
                />
                降低视频质量（默认编码，文件更小，画质通常会下降）
              </label>

              {command ? (
                <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                  {command}
                </pre>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
                  {mode === 'delogo' ? '在左侧画面上框选至少一个区域' : '在左侧画面上框选一个区域'}
                </p>
              )}
              {edgeWarning && (
                <p className="text-xs text-amber-600 flex items-start gap-1.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  有区域贴近画面边缘，已自动收进 1px 边距（delogo 需要区域外一圈像素做插值）。
                </p>
              )}
              <p className="text-xs text-gray-400">
                {reduceQuality
                  ? '未指定编码参数，ffmpeg 默认重新编码（CRF ~23），画质通常会下降。'
                  : '默认使用 -c:v libx264 -crf 18 -preset slow -c:a copy 保留较高画质（文件体积可能更大）。'}
                {mode === 'delogo'
                  ? ' delogo 抹掉选定区域（可多个，用逗号链式；可各自加 :enable 时间段）；输出分辨率不变。'
                  : ' crop 将输出裁切为选定区域尺寸（仅用第一个框）；必须重新编码视频。'}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  )
}
