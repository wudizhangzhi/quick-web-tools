import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HERMES 爱傌仕中国官方网站',
  description: '爱傌仕 — 顺应潮流，超越时代。配货员永远在路上。',
  icons: {
    icon: '/virtual-hermes/icon.webp',
    apple: '/virtual-hermes/icon.webp',
  },
}

export default function VirtualHermesLayout({ children }: { children: React.ReactNode }) {
  return children
}