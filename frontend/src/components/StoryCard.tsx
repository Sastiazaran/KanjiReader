import { Link } from 'react-router-dom'
import type { KanjiRecord, MediaMap, VocabRecord } from '../types/data'
import { importanceLabel } from '../lib/game'
import { getExampleAudioUrl } from '../lib/media'
import { AudioPlayer } from './AudioPlayer'
import { StrokeOrder } from './StrokeOrder'
import { Icon } from './ui/Icon'

interface StoryCardProps {
  kanji: KanjiRecord
  mediaMap: MediaMap
  vocab: VocabRecord[]
  showLink?: boolean
}

const TONE_STYLES = {
  top: 'bg-rose-500/20 text-rose-200',
  high: 'bg-amber-500/20 text-amber-200',
  mid: 'bg-sky-500/20 text-sky-200',
  low: 'bg-white/10 text-[var(--muted)]',
} as const

export function StoryCard({ kanji, mediaMap, vocab, showLink }: StoryCardProps) {
  const importance = importanceLabel(kanji.frequency)
  const audioUrl = getExampleAudioUrl(mediaMap, kanji.kanji)
  const example = vocab[0]

  return (
    <article className="animate-pop space-y-5 rounded-[28px] border border-white/12 bg-white/5 p-5 shadow-2xl shadow-black/30">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid h-32 w-32 place-items-center rounded-[28px] bg-gradient-to-br from-white to-slate-200 text-7xl font-bold text-slate-900 shadow-xl">
          <span lang="ja">{kanji.kanji}</span>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">{kanji.keyword}</h2>
          <p className="text-sm text-[var(--muted)]">{kanji.meaning}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
          <span className={`rounded-full px-3 py-1 ${TONE_STYLES[importance.tone]}`}>
            {importance.label}
          </span>
          {kanji.frequency && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[var(--muted)]">
              N.º {kanji.frequency} más usado
            </span>
          )}
          {kanji.jlpt && (
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-violet-200">
              JLPT {kanji.jlpt}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-amber-400/15 to-fuchsia-500/10 p-4">
        <div className="mb-2 flex items-center gap-2 text-amber-200">
          <Icon name="sparkle" className="h-5 w-5" />
          <h3 className="text-sm font-extrabold uppercase tracking-wide">
            La historia
          </h3>
        </div>
        <p className="text-[15px] leading-relaxed text-white">{kanji.story}</p>

        {kanji.componentParts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {kanji.componentParts.map((part) => (
              <span
                key={part.char}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2"
              >
                <span className="text-xl text-white" lang="ja">
                  {part.char}
                </span>
                <span className="text-xs text-[var(--muted)]">{part.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Lectura on (china)
          </p>
          <p className="text-lg text-white" lang="ja">
            {kanji.onyomi.length ? kanji.onyomi.slice(0, 3).join('・') : '—'}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Lectura kun (japonesa)
          </p>
          <p className="text-lg text-white" lang="ja">
            {kanji.kunyomi.length ? kanji.kunyomi.slice(0, 3).join('・') : '—'}
          </p>
        </div>
      </div>

      {example && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 p-4">
          <div>
            <p className="text-lg text-white" lang="ja">
              {example.expression}
              {example.reading && (
                <span className="ml-2 text-sm text-[var(--muted)]">
                  {example.reading}
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--muted)]">{example.glossary}</p>
          </div>
          <AudioPlayer mp3Url={audioUrl} compact />
        </div>
      )}

      <StrokeOrder
        literal={kanji.kanji}
        strokeCount={kanji.strokes}
        mediaMap={mediaMap}
      />

      {showLink && (
        <Link
          to={`/kanji/${kanji.id}`}
          className="inline-flex items-center gap-1 text-sm font-bold text-violet-300 hover:text-violet-200"
        >
          Ver ficha completa
        </Link>
      )}
    </article>
  )
}
