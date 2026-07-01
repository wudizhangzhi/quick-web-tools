/** 爱傌仕恶搞品牌 Logo */
export default function Logo({ className = 'h-10 w-auto' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/virtual-hermes/logo.webp"
      alt="爱傌仕 Paris"
      width={140}
      height={40}
      className={`${className} object-contain`}
    />
  )
}