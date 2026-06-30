'use client'

import { useState } from 'react'

/**
 * 菜品/店铺缩略图。有 image 就显示图片，加载失败或没有图片时回退到 emoji，
 * 保证不依赖外部资产也能跑通。
 */
export default function DishThumb({
  image,
  emoji,
  alt,
  className = '',
  emojiClassName = 'text-4xl',
}: {
  image?: string
  emoji: string
  alt: string
  className?: string
  emojiClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = image && !failed

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-orange-50 ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={emojiClassName} role="img" aria-label={alt}>
          {emoji}
        </span>
      )}
    </div>
  )
}
