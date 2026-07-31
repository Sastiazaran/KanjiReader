import { Icon } from './Icon'

interface StarsProps {
  value: number
  total?: number
  className?: string
  size?: string
}

export function Stars({
  value,
  total = 3,
  className = '',
  size = 'w-5 h-5',
}: StarsProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <Icon
          key={i}
          name="star"
          className={`${size} ${
            i < value ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.55)]' : 'text-white/20'
          }`}
        />
      ))}
      <span className="sr-only">
        {value} de {total} estrellas
      </span>
    </span>
  )
}
