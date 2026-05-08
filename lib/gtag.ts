export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

export const isGAEnabled =
  process.env.NODE_ENV === 'production' && GA_ID.length > 0

export function pageview(url: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return
  window.gtag('config', GA_ID, {
    page_path: url,
    page_title: title ?? document.title,
  })
}

export function event(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params)
}
