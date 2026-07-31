interface IconProps {
  name: IconName
  className?: string
  filled?: boolean
}

export type IconName =
  | 'map'
  | 'star'
  | 'flame'
  | 'heart'
  | 'trophy'
  | 'lock'
  | 'play'
  | 'check'
  | 'close'
  | 'sound'
  | 'sparkle'
  | 'back'
  | 'brain'
  | 'book'

const PATHS: Record<IconName, string> = {
  map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Zm0 0v13m6-10.5v13',
  star: 'm12 3.6 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3.6Z',
  flame:
    'M12 3s1.2 3.2-1 5.4C8.6 10.8 7 12.3 7 14.8A5 5 0 0 0 17 15c0-2.2-1-3.5-1.8-4.6-.6 1-1.3 1.5-2 1.6.8-2.6.4-6.2-1.2-9Z',
  heart:
    'M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z',
  trophy:
    'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 1H5v1a3 3 0 0 0 3 3m8-4h3v1a3 3 0 0 1-3 3m-4 4v4m-3 3h6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13v-9Z',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  check: 'm4.5 12.5 5 5 10-11',
  close: 'M6 6l12 12M18 6 6 18',
  sound: 'M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5Zm12.5-1.2a5.5 5.5 0 0 1 0 7.4M19 5.5a9 9 0 0 1 0 13',
  sparkle:
    'M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.5l-1.6-5.3L5 10.6 10.4 9 12 3.5ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  back: 'M15 5l-7 7 7 7',
  brain:
    'M9 5a3 3 0 0 0-3 3 3 3 0 0 0-1 5.6A3 3 0 0 0 9 19a2 2 0 0 0 2-2V6a2 2 0 0 0-2-1Zm6 0a3 3 0 0 1 3 3 3 3 0 0 1 1 5.6A3 3 0 0 1 15 19a2 2 0 0 1-2-2V6a2 2 0 0 1 2-1Z',
  book: 'M5 5.5A2 2 0 0 1 7 4h5v16H7a2 2 0 0 0-2 1.5v-16Zm14 0A2 2 0 0 0 17 4h-5v16h5a2 2 0 0 1 2 1.5v-16Z',
}

const FILLED = new Set<IconName>(['star', 'flame', 'heart', 'play', 'sparkle'])

export function Icon({ name, className = 'w-5 h-5', filled }: IconProps) {
  const shouldFill = filled ?? FILLED.has(name)
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={shouldFill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={shouldFill ? 1.2 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
