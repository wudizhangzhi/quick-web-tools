'use client'

export default function CookieBanner({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="max-w-lg rounded-sm bg-white p-6 shadow-xl">
        <p className="text-xs leading-relaxed text-black">
          本网站使用 Cookie 以改善您的浏览体验、提供个性化内容和广告、分析网站流量。点击「接受」即表示您同意我们使用
          Cookie。点击「接受」即表示您同意我们使用 Cookie。
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onAccept}
            className="bg-black px-6 py-2 text-[11px] uppercase tracking-wider text-white"
          >
            接受
          </button>
          <button
            onClick={onAccept}
            className="border border-black px-6 py-2 text-[11px] uppercase tracking-wider text-black"
          >
            拒绝
          </button>
        </div>
      </div>
    </div>
  )
}