import type { MediaMap } from '../types/data'

/** CDN oficial de Kanji alive (CC BY 4.0); rutas distintas a las del clon local. */
const KANJIALIVE_CDN = 'https://media.kanjialive.com' as const

const LOCAL_PATHS = {
  audio: 'examples-audio/mp3/audio-mp3',
  video: 'kanji-animations/mp4/kanji-animations',
  svg: 'kanji-strokes/strokes/kanji_strokes',
} as const

const CDN_PATHS = {
  audio: 'examples_audio/audio-mp3',
  video: 'kanji_animations/kanji_mp4',
  svg: 'kanji_strokes',
} as const

type MediaKind = keyof typeof LOCAL_PATHS

/**
 * En desarrollo usa el middleware de Vite (`/kanji-media`).
 * En producción usa el CDN de Kanji alive, salvo que `VITE_KANJI_MEDIA_BASE`
 * apunte a un espejo con la misma estructura que `vendor/kanji-data-media`.
 */
function mediaUrl(kind: MediaKind, fileName: string): string {
  const encoded = encodeURIComponent(fileName)
  const customBase = import.meta.env.VITE_KANJI_MEDIA_BASE?.replace(/\/$/, '')

  if (customBase) {
    return `${customBase}/${LOCAL_PATHS[kind]}/${encoded}`
  }

  if (import.meta.env.DEV) {
    return `/kanji-media/${LOCAL_PATHS[kind]}/${encoded}`
  }

  return `${KANJIALIVE_CDN}/${CDN_PATHS[kind]}/${encoded}`
}

/** Base efectiva de medios (dev local, espejo custom o CDN). */
export function getKanjiMediaBase(): string {
  const custom = import.meta.env.VITE_KANJI_MEDIA_BASE
  if (custom) return custom.replace(/\/$/, '')
  if (import.meta.env.DEV) return '/kanji-media'
  return KANJIALIVE_CDN
}

export function getExampleAudioUrl(
  mediaMap: MediaMap | null,
  literal: string,
): string | null {
  const e = mediaMap?.[literal]
  if (!e?.audioPattern) return null
  return mediaUrl('audio', e.audioPattern)
}

export function getStrokeVideoUrl(
  mediaMap: MediaMap | null,
  literal: string,
): string | null {
  const e = mediaMap?.[literal]
  if (!e?.videoFile) return null
  return mediaUrl('video', e.videoFile)
}

export function getStrokeSvgUrl(
  mediaMap: MediaMap | null,
  literal: string,
  strokeIndex: number,
): string | null {
  const e = mediaMap?.[literal]
  if (!e?.kname) return null
  return mediaUrl('svg', `${e.kname}_${strokeIndex}.svg`)
}
