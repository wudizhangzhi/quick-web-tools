'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { CatalogProduct } from '@/lib/virtual-hermes/types'
import { formatPrice } from '@/lib/virtual-hermes/data'
import { event as gaEvent } from '@/lib/gtag'

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL']

export default function ProductDetailView({
  product,
  onBack,
  onAdd,
}: {
  product: CatalogProduct
  onBack: () => void
  onAdd: (productId: string, size: string) => void
}) {
  const [activeImg, setActiveImg] = useState(0)
  const [size, setSize] = useState('')
  const [detail, setDetail] = useState<Partial<CatalogProduct>>({})
  const [openSection, setOpenSection] = useState<string | null>('desc')

  const images = detail.images?.length ? detail.images : [product.image]
  const sizes = detail.sizes?.length ? detail.sizes : product.sizes?.length ? product.sizes : DEFAULT_SIZES
  const description =
    detail.description ??
    product.description ??
    '全棉/皮革/匠心工艺。意大利制造。购买后配货员永远在路上。'

  useEffect(() => {
    setActiveImg(0)
    setSize('')
    if (product.description && product.images?.length) return
    fetch(`/api/virtual-hermes/product?path=${encodeURIComponent(product.path)}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(() => {})
  }, [product])

  function handleAdd() {
    const picked = size || sizes[0]
    gaEvent('virtual_hermes_cart', { status: 'add' })
    onAdd(product.id, picked)
  }

  return (
    <div className="bg-hermes-cream">
      <div className="border-b border-hermes-grey/30 px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-hermes-muted hover:text-black">
          <ChevronLeft size={16} /> 返回
        </button>
      </div>

      <div className="mx-auto max-w-hermes lg:grid lg:grid-cols-2 lg:gap-8 lg:px-[6.875%] lg:py-8">
        {/* 图库 */}
        <div>
          <div className="aspect-square bg-hermes-cream-light">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[activeImg]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-1 overflow-x-auto p-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-16 flex-shrink-0 border ${i === activeImg ? 'border-black' : 'border-transparent'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="px-4 py-6 lg:px-0">
          <h1 className="text-xl font-light md:text-2xl" style={{ fontWeight: 440 }}>
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-hermes-muted">
            价格 {formatPrice(detail.price ?? product.price)}
          </p>
          {product.color && (
            <p className="mt-1 text-xs text-hermes-muted">颜色 , {product.color}</p>
          )}

          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider">选择尺码</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-[3rem] border px-3 py-2 text-xs ${
                    (size || sizes[0]) === s ? 'border-black bg-black text-white' : 'border-hermes-grey text-black'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="mt-8 w-full bg-black py-4 text-xs uppercase tracking-[0.15em] text-white hover:bg-hermes-charcoal"
          >
            加入购物袋
          </button>

          {product.comingSoon && (
            <p className="mt-2 text-center text-xs text-hermes-muted">即将上市</p>
          )}

          {/* 手风琴 */}
          <div className="mt-8 border-t border-hermes-grey/30">
            {[
              { key: 'desc', title: '产品描述', body: description },
              {
                key: 'ship',
                title: '送货与退货',
                body: '免费标准配送。订单预计 2-10 个工作日到达（实际：永远在路上）。7天无理由退货（退货单已迷路）。',
              },
              { key: 'care', title: '保养', body: '请阅读内里洗标。建议交给爱傌仕专卖店或专业人员保养。' },
            ].map((sec) => (
              <div key={sec.key} className="border-b border-hermes-grey/30">
                <button
                  onClick={() => setOpenSection(openSection === sec.key ? null : sec.key)}
                  className="flex w-full items-center justify-between py-4 text-left text-sm"
                >
                  {sec.title}
                  <span className="text-hermes-muted">{openSection === sec.key ? '−' : '+'}</span>
                </button>
                {openSection === sec.key && (
                  <p className="pb-4 text-xs leading-relaxed text-hermes-muted">{sec.body}</p>
                )}
              </div>
            ))}
          </div>

          {product.productRef && (
            <p className="mt-4 text-[10px] text-hermes-grey">产品编号：{product.productRef}</p>
          )}
        </div>
      </div>
    </div>
  )
}