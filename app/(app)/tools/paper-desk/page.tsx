import type { Metadata } from 'next'
import PaperDesk from '@/components/paper-desk/PaperDesk'

export const metadata: Metadata = {
  title: '桌上的纸 - 写一张放在桌上的纸',
  description: '编辑文字、选纸张和字体，生成一张放在木桌上的 3D 纸，可以拖起来掀动，保存成图片。',
}

export default function PaperDeskPage() {
  return <PaperDesk />
}
