import type { MediaMap } from '../types/data'

/** Base para audio/vídeo/SVG en dev (middleware Vite) o CDN en prod. */
export function getKanjiMediaBase(): string {
  const v = import.meta.env.VITE_KANJI_MEDIA_BASE
  if (v) return v.replace(/\/$/, '')
  return '/kanji-media'
}

export function getExampleAudioUrl(
  mediaMap: MediaMap | null,
  literal: string,
): string | null {
  const e = mediaMap?.[literal]
  if (!e?.audioPattern) return null
  const base = getKanjiMediaBase()
  return `${base}/examples-audio/mp3/audio-mp3/${encodeURIComponent(e.audioPattern)}`
}

export function getStrokeVideoUrl(
  mediaMap: MediaMap | null,
  literal: string,
): string | null {
  const e = mediaMap?.[literal]
  if (!e?.videoFile) return null
  const base = getKanjiMediaBase()
  return `${base}/kanji-animations/mp4/kanji-animations/${encodeURIComponent(e.videoFile)}`
}

export function getStrokeSvgUrl(
  mediaMap: MediaMap | null,
  literal: string,
  strokeIndex: number,
): string | null {
  const e = mediaMap?.[literal]
  if (!e?.kname) return null
  const base = getKanjiMediaBase()
  const file = `${e.kname}_${strokeIndex}.svg`
  return `${base}/kanji-strokes/strokes/kanji_strokes/${encodeURIComponent(file)}`
}
