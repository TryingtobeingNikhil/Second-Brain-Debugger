interface ShimmerProps {
  width?: string
  height?: string
  className?: string
}

export function Shimmer({ width = '100%', height = '40px', className = '' }: ShimmerProps) {
  return (
    <div
      className={`shimmer-base ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
