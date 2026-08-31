import type { KanjiRecord } from '../types/data'
import { READING_RULES, type ReadingKind } from '../lib/reading-type'
import { hasBothReadings, type ReadingSample } from '../lib/reading-samples'
import { Icon } from './ui/Icon'

interface ReadingGuideProps {
  kanji: KanjiRecord
  samples: ReadingSample[]
  /** Muestra también las tres reglas generales (ficha completa). */
  showRules?: boolean
}

const KIND_STYLES: Record<ReadingKind, string> = {
  kun: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  on: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
  special: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  unknown: 'bg-white/10 text-[var(--muted)] border-white/15',
}

const KIND_BADGE: Record<ReadingKind, string> = {
  kun: 'kun',
  on: 'on',
  special: 'excepción',
  unknown: '—',
}

/**
 * Explica qué lectura usa el kanji en cada palabra y por qué. Es la respuesta
 * a «sé las lecturas, pero no sé cuál toca».
 */
export function ReadingGuide({ kanji, samples, showRules }: ReadingGuideProps) {
  if (samples.length === 0) return null

  return (
    <section className="space-y-3 rounded-3xl border border-white/12 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-violet-200">
        <Icon name="sound" className="h-5 w-5" />
        <h3 className="text-sm font-extrabold uppercase tracking-wide">
          ¿Qué lectura toca?
        </h3>
      </div>

      <ul className="space-y-2">
        {samples.map((sample) => (
          <li
            key={sample.word}
            className={`rounded-2xl border px-3 py-2.5 ${KIND_STYLES[sample.analysis.kind]}`}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl text-white" lang="ja">
                {sample.word}
              </span>
              <span className="text-sm text-white/80" lang="ja">
                {sample.reading}
              </span>
              <span className="ml-auto rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-extrabold uppercase">
                {KIND_BADGE[sample.analysis.kind]}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-white/85">
              {sample.analysis.why}
            </p>
          </li>
        ))}
      </ul>

      {hasBothReadings(samples) && (
        <p className="rounded-2xl bg-black/20 px-3 py-2 text-[13px] text-[var(--muted)]">
          Fíjate: {kanji.kanji} cambia de sonido según la compañía. No hay que
          elegir una lectura «buena», sino mirar la forma de la palabra.
        </p>
      )}

      {showRules && (
        <ul className="space-y-2 border-t border-white/10 pt-3">
          {READING_RULES.map((rule) => (
            <li key={rule.kind} className="text-[13px] leading-relaxed">
              <span
                className={`mr-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-extrabold uppercase ${KIND_STYLES[rule.kind]}`}
              >
                {KIND_BADGE[rule.kind]}
              </span>
              <span className="font-bold text-white">{rule.title}. </span>
              <span className="text-[var(--muted)]">{rule.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
