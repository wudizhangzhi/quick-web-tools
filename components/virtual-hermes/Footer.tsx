'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BRAND_NAME, FOOTER_GROUPS } from '@/lib/virtual-hermes/data'

export default function Footer({ onFake }: { onFake: (label: string) => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  return (
    <footer className="bg-hermes-cream-light text-black">
      <div className="mx-auto max-w-hermes px-[6.875%] py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {FOOTER_GROUPS.map((g) => (
            <div key={g.title}>
              <button
                className="flex w-full items-center justify-between text-sm font-medium lg:pointer-events-none"
                onClick={() => setOpenGroup(openGroup === g.title ? null : g.title)}
              >
                {g.title}
                <ChevronDown size={16} className="lg:hidden" />
              </button>
              <ul
                className={`mt-3 space-y-2 text-xs text-hermes-muted ${
                  openGroup === g.title ? 'block' : 'hidden lg:block'
                }`}
              >
                {g.links.map((link) => (
                  <li key={link}>
                    <button onClick={() => onFake(link)} className="hover:text-black hover:underline">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 border-t border-hermes-grey/30 pt-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium">请联系客服</p>
            <p className="mt-1 text-xs text-hermes-muted">周一至周日 10:00 - 22:00</p>
            <p className="mt-1 text-xs">400 090 6610</p>
          </div>
          <div>
            <p className="text-sm font-medium">电子报</p>
            <p className="mt-1 text-xs text-hermes-muted">订阅{BRAND_NAME}电子报，获取最新资讯。</p>
            <button
              onClick={() => onFake('订阅电子报')}
              className="mt-2 border-b border-hermes-muted text-xs uppercase tracking-wider"
            >
              订阅 电子报
            </button>
          </div>
          <div>
            <p className="text-sm font-medium">关注我们</p>
            <div className="mt-2 flex gap-4 text-xs text-hermes-muted">
              <button onClick={() => onFake('WeChat')}>WeChat</button>
              <button onClick={() => onFake('Weibo')}>Weibo</button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-hermes-grey/30 px-[6.875%] py-4 text-xs text-hermes-muted">
        配送至 : 中国内地 ,{' '}
        <button onClick={() => onFake('更改位置')} className="underline">
          更改您的位置
        </button>
      </div>

      <div className="border-t border-hermes-grey/30 px-[6.875%] py-4 text-[10px] text-hermes-muted">
        <p>© {new Date().getFullYear()} {BRAND_NAME}</p>
      </div>
    </footer>
  )
}