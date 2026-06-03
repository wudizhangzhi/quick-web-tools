/* Square national flag from the FIFA CDN, keyed on the 3-letter code (MEX, ENG…).
   Placeholder slots (code null) render a neutral badge. */
export default function Flag({
  code,
  className = '',
  alt,
}: {
  code: string | null
  className?: string
  alt?: string
}) {
  if (!code) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}
        aria-label="待定"
      >
        <span className="text-xs font-bold">?</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://api.fifa.com/api/v3/picture/flags-sq-4/${code}`}
      alt={alt ?? code}
      loading="lazy"
      className={`object-cover ${className}`}
    />
  )
}
