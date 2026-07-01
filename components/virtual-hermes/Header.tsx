'use client'

import { useState } from 'react'
import { Search, Menu, X, ShoppingBag } from 'lucide-react'
import Logo from './Logo'
import { TOP_NAV } from '@/lib/virtual-hermes/data'

const navLinkClass =
  'relative py-1 text-[11px] tracking-wide text-hermes-charcoal transition-colors hover:text-black after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-hermes-charcoal after:transition-transform after:duration-200 hover:after:scale-x-100'

const topLinkClass =
  'py-1 text-xs text-hermes-charcoal transition-colors hover:text-black hover:underline hover:underline-offset-4'

export default function Header({
  cartCount,
  onMenuOpen,
  onCartOpen,
  onHome,
  onCategory,
  onSearch,
  onFakeNav,
}: {
  cartCount: number
  onMenuOpen: () => void
  onCartOpen: () => void
  onHome: () => void
  onCategory: (categoryId: string) => void
  onSearch: () => void
  onFakeNav: (label: string) => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-hermes-cream">
      <div className="relative flex h-16 items-center px-4 text-hermes-charcoal md:px-8 lg:h-16">
        <button onClick={onMenuOpen} className={`mr-3 p-1 lg:hidden ${topLinkClass}`} aria-label="目录">
          <Menu size={20} strokeWidth={1.5} />
        </button>

        <div className="hidden flex-1 md:block md:max-w-md">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                placeholder="搜索"
                readOnly
                onFocus={onSearch}
                onClick={onSearch}
                className="w-full cursor-pointer border-b border-hermes-grey/40 bg-transparent py-1 text-xs text-hermes-charcoal outline-none placeholder:text-hermes-muted"
              />
              <button onClick={() => setSearchOpen(false)} className={topLinkClass} aria-label="关闭搜索">
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setSearchOpen(true)
                onSearch()
              }}
              className={`flex items-center gap-2 ${topLinkClass}`}
            >
              <Search size={16} strokeWidth={1.5} />
              <span>搜索</span>
            </button>
          )}
        </div>

        <button onClick={onHome} className="absolute left-1/2 -translate-x-1/2" aria-label="爱傌仕首页">
          <Logo className="h-9 w-[120px] md:h-10 md:w-[140px]" />
        </button>

        <div className="ml-auto flex items-center gap-4">
          <button onClick={() => onFakeNav('账户')} className={`hidden md:block ${topLinkClass}`}>
            账户, 离线
          </button>
          <button onClick={onCartOpen} className={`flex items-center gap-1 ${topLinkClass}`} aria-label="购物袋">
            <ShoppingBag size={18} strokeWidth={1.5} />
            <span className="hidden sm:inline">
              购物袋{cartCount > 0 ? `, ${cartCount} 件` : ', 空'}
            </span>
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-hermes-grey/30 lg:block">
        <ul className="flex flex-wrap justify-center gap-x-6 px-4 py-3">
          {TOP_NAV.map((item) => (
            <li key={item.label}>
              {item.categoryId ? (
                <button onClick={() => onCategory(item.categoryId!)} className={navLinkClass}>
                  {item.label}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const first = item.children?.find((c) => c.categoryId)
                    if (first?.categoryId) onCategory(first.categoryId)
                    else onFakeNav(item.label)
                  }}
                  className={navLinkClass}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}