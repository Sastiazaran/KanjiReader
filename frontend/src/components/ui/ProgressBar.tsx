interface ProgressBarProps {
  value: number
  className?: string
  barClassName?: string
  label?: string
}

export function ProgressBar({
  value,
  className = '',
  barClassName = 'bg-gradient-to-r from-emerald-400 to-lime-300',
  label,
}: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${barClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
