import { toBlob } from 'html-to-image'

// Render a DOM node to a PNG blob at a higher pixel ratio so the exported poster
// is crisp on retina / when re-shared. cacheBust avoids stale cross-origin
// (flagcdn) images being reused with tainted state.
export async function nodeToPngBlob(node: HTMLElement, pixelRatio = 3): Promise<Blob> {
  const blob = await toBlob(node, { pixelRatio, cacheBust: true })
  if (!blob) throw new Error('生成图片失败')
  return blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function canCopyImage(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof ClipboardItem !== 'undefined' &&
    !!navigator.clipboard?.write
  )
}

export async function copyBlobToClipboard(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
