import { useRef, useState } from 'react'
import { Icon } from './ui/Icon'

interface AudioPlayerProps {
  mp3Url: string | null
  label?: string
  compact?: boolean
}

export function AudioPlayer({
  mp3Url,
  label = 'Escuchar palabra',
  compact = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  // El estado se guarda por URL para que cambiar de kanji lo reinicie solo.
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)
  const [failedUrls, setFailedUrls] = useState<string[]>([])

  if (!mp3Url) return null

  const playing = playingUrl === mp3Url
  const failed = failedUrls.includes(mp3Url)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      el.currentTime = 0
      setPlayingUrl(null)
      return
    }
    void el
      .play()
      .then(() => setPlayingUrl(mp3Url))
      .catch(() => {
        setPlayingUrl(null)
        setFailedUrls((urls) => [...urls, mp3Url])
      })
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={`pressable inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 font-bold text-white shadow-lg shadow-sky-500/30 ${
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
        } ${playing ? 'animate-float' : ''}`}
      >
        <Icon name="sound" className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        {playing ? 'Sonando…' : label}
      </button>
      {failed && (
        <span className="text-xs text-[var(--muted)]">Audio no disponible</span>
      )}
      <audio
        ref={audioRef}
        src={mp3Url}
        preload="none"
        onEnded={() => setPlayingUrl(null)}
        onError={() => setFailedUrls((urls) => [...urls, mp3Url])}
      />
    </div>
  )
}
