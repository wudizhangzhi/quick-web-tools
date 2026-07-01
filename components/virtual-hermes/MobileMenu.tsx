'use client'

import { X } from 'lucide-react'
import { TOP_NAV } from '@/lib/virtual-hermes/data'

export default function MobileMenu({
  open,
  onClose,
  onCategory,
  onSearch,
  onFakeNav,
}: {
  open: boolean
  onClose: () => void
  onCategory: (categoryId: string) => void
  onSearch: () => void
  onFakeNav: (label: string) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={onClose}>
      <div
        className="flex h-full w-[min(100%,320px)] flex-col bg-hermes-cream-light"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hermes-grey/30 px-4 py-4">
          <span className="text-sm font-medium">目录</span>
          <button onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2">
          <div className="border-b border-hermes-grey/20 py-3">
            <button
              onClick={() => {
                onSearch()
                onClose()
              }}
              className="text-sm text-black"
            >
              搜索
            </button>
          </div>
          {TOP_NAV.map((item) => (
            <div key={item.label} className="border-b border-hermes-grey/20 py-3">
              <button
                onClick={() => {
                  if (item.categoryId) {
                    onCategory(item.categoryId)
                    onClose()
                  } else {
                    const first = item.children?.find((c) => c.categoryId)
                    if (first?.categoryId) {
                      onCategory(first.categoryId)
                      onClose()
                    } else onFakeNav(item.label)
                  }
                }}
                className="text-sm text-black"
              >
                {item.label}
              </button>
              {item.children && (
                <ul className="mt-2 space-y-1 pl-3">
                  {item.children.map((c) => (
                    <li key={c.label}>
                      <button
                        onClick={() => {
                          if (c.categoryId) {
                            onCategory(c.categoryId)
                            onClose()
                          } else onFakeNav(c.label)
                        }}
                        className="text-xs text-hermes-muted"
                      >
                        {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-hermes-grey/30 px-4 py-4 text-xs text-hermes-muted">
          <button onClick={() => onFakeNav('爱傌仕专卖店')}>爱傌仕专卖店</button>
          <button onClick={() => onFakeNav('账户')} className="block">
            账户
          </button>
          <button onClick={() => onFakeNav('联系我们')} className="block">
            联系我们
          </button>
        </div>
      </div>
    </div>
  )
}