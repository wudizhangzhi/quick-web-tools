import { NextRequest, NextResponse } from 'next/server'

interface VideoInfo {
  videoUrl: string
  poster?: string
  title?: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: '缺少 URL 参数' }, { status: 400 })
    }

    // 验证 URL 格式
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: '无效的 URL 格式' }, { status: 400 })
    }

    // 验证是否为虎扑域名
    const validDomains = ['hupu.com', 'hupucdn.com', 'hoopchina.com.cn']
    const isValidDomain = validDomains.some(domain => targetUrl.hostname.endsWith(domain))
    if (!isValidDomain) {
      return NextResponse.json({ error: '请输入虎扑链接' }, { status: 400 })
    }

    // 请求虎扑页面
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `请求失败: ${response.status}` },
        { status: 500 }
      )
    }

    const html = await response.text()

    // 提取 __NEXT_DATA__ 中的 JSON 数据
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/)

    if (!nextDataMatch) {
      return NextResponse.json(
        { error: '未找到页面数据，请确认链接正确' },
        { status: 404 }
      )
    }

    let nextData
    try {
      nextData = JSON.parse(nextDataMatch[1])
    } catch {
      return NextResponse.json(
        { error: '解析页面数据失败' },
        { status: 500 }
      )
    }

    // 从 JSON 中提取视频信息
    const videoInfo = extractVideoFromNextData(nextData)

    if (!videoInfo) {
      return NextResponse.json(
        { error: '未找到视频，该页面可能不包含视频内容' },
        { status: 404 }
      )
    }

    return NextResponse.json(videoInfo)
  } catch (error) {
    console.error('解析错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    )
  }
}

function extractVideoFromNextData(data: unknown): VideoInfo | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = (data as any)?.props?.pageProps
    if (!props) return null

    // 获取标题
    const title = props.replyDetail?.title || ''

    // 尝试从多个位置获取内容
    const contentSources = [
      props.replyDetail?.post?.content,
      props.replyDetail?.post?.dealContent,
      props.threadDetail?.post?.content,
      props.threadDetail?.post?.dealContent,
    ]

    for (const content of contentSources) {
      if (!content) continue

      // 解码 HTML 实体
      const decodedContent = decodeHtmlEntities(content)

      // 从 video 标签中提取 src 和 poster
      const videoMatch = decodedContent.match(/<video[^>]*\ssrc=['"]([^'"]+)['"][^>]*(?:\sposter=['"]([^'"]+)['"])?[^>]*>/)

      if (videoMatch && videoMatch[1]) {
        return {
          videoUrl: videoMatch[1],
          poster: videoMatch[2] || undefined,
          title: title || undefined,
        }
      }

      // 备用：尝试另一种属性顺序 (poster 在 src 前面)
      const videoMatch2 = decodedContent.match(/<video[^>]*\sposter=['"]([^'"]+)['"][^>]*\ssrc=['"]([^'"]+)['"][^>]*>/)
      if (videoMatch2 && videoMatch2[2]) {
        return {
          videoUrl: videoMatch2[2],
          poster: videoMatch2[1] || undefined,
          title: title || undefined,
        }
      }

      // 再次备用：只提取 src
      const srcMatch = decodedContent.match(/src=['"]([^'"]*\.mp4[^'"]*)['"]/i)
      if (srcMatch && srcMatch[1]) {
        const posterMatch = decodedContent.match(/poster=['"]([^'"]+)['"]/)
        return {
          videoUrl: srcMatch[1],
          poster: posterMatch?.[1] || undefined,
          title: title || undefined,
        }
      }
    }

    // 尝试从 replies 中查找视频
    const replies = props.replyDetail?.replies || props.threadDetail?.replies || []
    for (const reply of replies) {
      const content = reply.content || reply.dealContent
      if (!content) continue

      const decodedContent = decodeHtmlEntities(content)
      const srcMatch = decodedContent.match(/src=['"]([^'"]*\.mp4[^'"]*)['"]/i)
      if (srcMatch && srcMatch[1]) {
        const posterMatch = decodedContent.match(/poster=['"]([^'"]+)['"]/)
        return {
          videoUrl: srcMatch[1],
          poster: posterMatch?.[1] || undefined,
          title: title || undefined,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0026/g, '&')
    .replace(/\\u0027/g, "'")
    .replace(/\\u0022/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
