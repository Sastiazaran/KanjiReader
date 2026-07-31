import { useMemo, useRef, useState } from 'react'
import type { MediaMap } from '../types/data'
import { getStrokeSvgUrl, getStrokeVideoUrl } from '../lib/media'
import { Icon } from './ui/Icon'

interface StrokeOrderProps {
  literal: string
  strokeCount: number
  mediaMap: MediaMap
}

export function StrokeOrder({ literal, strokeCount, mediaMap }: StrokeOrderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Se guardan las URLs fallidas para no reiniciar el estado al cambiar de kanji.
  const [brokenUrls, setBrokenUrls] = useState<string[]>([])
  const videoUrl = getStrokeVideoUrl(mediaMap, literal)
  const videoBroken = videoUrl != null && brokenUrls.includes(videoUrl)

  const svgUrls = useMemo(
    () =>
      Array.from({ length: strokeCount }, (_, i) =>
        getStrokeSvgUrl(mediaMap, literal, i + 1),
      ).filter((url): url is string => Boolean(url)),
    [literal, strokeCount, mediaMap],
  )

  if ((!videoUrl || videoBroken) && svgUrls.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 p-5 text-center text-sm text-[var(--muted)]">
        Este kanji todavía no tiene animación de trazos.
        <br />
        Cópialo despacio contando sus {strokeCount} trazos.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Orden de trazos</h3>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-[var(--muted)]">
          {strokeCount} trazos
        </span>
      </div>

      {videoUrl && !videoBroken && (
        <div className="mx-auto flex w-fit flex-col items-center gap-3">
          <video
            ref={videoRef}
            className="h-52 w-52 rounded-3xl border border-white/15 bg-white"
            src={videoUrl}
            playsInline
            muted
            loop
            controls
            preload="metadata"
            onError={() => setBrokenUrls((urls) => [...urls, videoUrl])}
          />
          <button
            type="button"
            onClick={() => void videoRef.current?.play()}
            className="pressable inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/30"
          >
            <Icon name="play" className="h-4 w-4" />
            Ver de nuevo
          </button>
        </div>
      )}

      {svgUrls.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 pt-3">
          {svgUrls.map((src, index) => (
            <div key={src} className="relative">
              <img
                src={src}
                alt={`Trazo ${index + 1} de ${literal}`}
                className="h-14 w-14 rounded-xl border border-white/15 bg-white object-contain"
                loading="lazy"
              />
              <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-violet-500 text-[10px] font-extrabold text-white">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
