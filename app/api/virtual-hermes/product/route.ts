import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://www.hermes.cn'

function normalizeImage(url: string) {
  return url.startsWith('//') ? `https:${url}` : url
}

/** 代理抓取爱马仕 PDP 详情（描述、多图、尺码），供虚拟爱马仕前端按需补全。 */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path')
  if (!path?.startsWith('/cn/zh/product/')) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 })
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'User-Agent': 'quick-web-tools/hermes-proxy', Accept: 'text/html' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return NextResponse.json({ error: 'upstream' }, { status: res.status })
    const html = await res.text()

    const images = [
      ...new Set(
        [...html.matchAll(/\/\/assets\.hermes\.cn\/is\/image\/hermesproduct\/[^?"'\s]+/g)].map((m) =>
          normalizeImage(m[0]),
        ),
      ),
    ].filter((u) => u.includes('800-800') || u.includes('_worn') || u.includes('_front'))

    const descBlock = html.match(/产品描述[\s\S]{0,2000}?(?=产品编号|产品细节)/i)
    const description = descBlock
      ? descBlock[0]
          .replace(/<[^>]+>/g, ' ')
          .replace(/产品描述/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      : undefined

    const refMatch = html.match(/产品编号[：:\s]*([A-Z0-9]+)/i)
    const priceMatch = html.match(/价格\s*¥\s*([\d,]+)/)
    const sizes = [
      ...new Set([...html.matchAll(/>(\d{2}|XS|S|M|L|XL|XXL|均码)</g)].map((m) => m[1])),
    ]

    return NextResponse.json({
      images: images.slice(0, 10),
      description,
      productRef: refMatch?.[1],
      price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : undefined,
      sizes: sizes.length ? sizes : ['均码'],
    })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 })
  }
}