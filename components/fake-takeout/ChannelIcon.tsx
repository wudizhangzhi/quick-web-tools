/** 首页金刚区图标，仿美团彩色圆角方块风格。 */
export default function ChannelIcon({ channelKey, className = 'h-7 w-7' }: { channelKey: string; className?: string }) {
  switch (channelKey) {
    case '美食':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <rect x="6" y="14" width="36" height="26" rx="4" fill="#FF6B35" />
          <rect x="10" y="18" width="28" height="4" rx="1" fill="#FFD100" />
          <rect x="10" y="26" width="20" height="3" rx="1" fill="#FFF3B0" opacity="0.9" />
          <rect x="10" y="32" width="14" height="3" rx="1" fill="#FFF3B0" opacity="0.7" />
        </svg>
      )
    case '早餐':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <circle cx="24" cy="26" r="14" fill="#F5A623" />
          <ellipse cx="24" cy="22" rx="10" ry="8" fill="#FFE4B5" />
          <path d="M16 18 Q24 10 32 18" stroke="#D48806" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      )
    case '汉堡披萨':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <path d="M10 28 L38 28 L34 36 L14 36 Z" fill="#E8A838" />
          <rect x="12" y="20" width="24" height="10" rx="3" fill="#FF6B35" />
          <circle cx="18" cy="25" r="2" fill="#FFD100" />
          <circle cx="24" cy="25" r="2" fill="#4CAF50" />
          <circle cx="30" cy="25" r="2" fill="#FF4E12" />
        </svg>
      )
    case '米粉面':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <ellipse cx="24" cy="32" rx="16" ry="6" fill="#8B4513" opacity="0.3" />
          <path d="M14 32 Q18 20 24 18 Q30 20 34 32" stroke="#D4A574" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M16 28 Q20 22 24 21 Q28 22 32 28" stroke="#F5DEB3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="26" r="2" fill="#4CAF50" />
          <circle cx="28" cy="27" r="1.5" fill="#FF6B35" />
        </svg>
      )
    case '甜点饮品':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <path d="M16 14 L32 14 L30 34 L18 34 Z" fill="#7B4B9A" opacity="0.85" />
          <ellipse cx="24" cy="14" rx="10" ry="3" fill="#9B59B6" />
          <circle cx="20" cy="22" r="3" fill="#FF69B4" />
          <circle cx="28" cy="26" r="2.5" fill="#4FC3F7" />
          <rect x="22" y="8" width="4" height="8" rx="2" fill="#FFD100" />
        </svg>
      )
    case '烧烤夜宵':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <line x1="14" y1="12" x2="14" y2="36" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="10" x2="24" y2="36" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="34" y1="12" x2="34" y2="36" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="14" cy="18" rx="4" ry="3" fill="#D2691E" />
          <ellipse cx="24" cy="22" rx="4" ry="3" fill="#CD853F" />
          <ellipse cx="34" cy="20" rx="4" ry="3" fill="#A0522D" />
        </svg>
      )
    case '火锅':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <ellipse cx="24" cy="30" rx="16" ry="8" fill="#8B0000" opacity="0.85" />
          <ellipse cx="24" cy="28" rx="14" ry="6" fill="#FF4E12" />
          <path d="M18 20 L18 28 M24 18 L24 28 M30 20 L30 28" stroke="#FFD100" strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="26" r="2" fill="#FF6B35" />
          <circle cx="28" cy="27" r="2" fill="#4CAF50" />
        </svg>
      )
    case '日韩料理':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <ellipse cx="24" cy="28" rx="14" ry="5" fill="#2C2C2C" opacity="0.2" />
          <circle cx="24" cy="24" r="12" fill="#FF6B6B" />
          <circle cx="24" cy="24" r="8" fill="#FFF" />
          <circle cx="24" cy="24" r="5" fill="#FF6B6B" />
        </svg>
      )
    case '跑腿代购':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <rect x="10" y="22" width="22" height="14" rx="3" fill="#0DC2C2" />
          <circle cx="16" cy="38" r="4" fill="#333" />
          <circle cx="30" cy="38" r="4" fill="#333" />
          <path d="M32 22 L38 16 L42 22" stroke="#FFD100" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case '买药':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <rect x="14" y="10" width="20" height="28" rx="4" fill="#4FC3F7" />
          <rect x="20" y="18" width="8" height="16" rx="1" fill="#FFF" />
          <rect x="16" y="22" width="16" height="6" rx="1" fill="#FFF" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
          <circle cx="24" cy="24" r="14" fill="#FFD100" />
        </svg>
      )
  }
}