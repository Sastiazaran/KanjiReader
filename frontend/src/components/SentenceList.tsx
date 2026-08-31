import { useState } from 'react'
import type { SentenceRecord } from '../types/data'
import { Furigana } from './Furigana'
import { Icon } from './ui/Icon'

interface SentenceListProps {
  sentences: SentenceRecord[]
  title?: string
  /** Frases mostradas como máximo. */
  limit?: number
}

/**
 * Frases de ejemplo con furigana, con la posibilidad de taparlo para practicar
 * leer sin muletas.
 */
export function SentenceList({
  sentences,
  title = 'En una frase',
  limit = 3,
}: SentenceListProps) {
  const [hideReadings, setHideReadings] = useState(false)
  const shown = sentences.slice(0, limit)

  if (shown.length === 0) return null

  return (
    <section className="space-y-3 rounded-3xl border border-white/12 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-200">
          <Icon name="book" className="h-5 w-5" />
          <h3 className="text-sm font-extrabold uppercase tracking-wide">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => setHideReadings((value) => !value)}
          className="pressable rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[var(--muted)] hover:text-white"
          aria-pressed={hideReadings}
        >
          {hideReadings ? 'Ver furigana' : 'Ocultar furigana'}
        </button>
      </div>

      <ul className="space-y-3">
        {shown.map((sentence) => (
          <li key={sentence.id} className="rounded-2xl bg-black/20 px-3 py-3">
            <Furigana
              tokens={sentence.tokens}
              hideReadings={hideReadings}
              className="text-2xl"
            />
            <p className="mt-1 text-sm text-[var(--muted)]">{sentence.es}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
