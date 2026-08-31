import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { useStageResults } from '../hooks/useGameState'
import { analyzeReading } from '../lib/reading-type'
import { isKanjiChar } from '../lib/kana'
import { isStoryUnlocked, stagesClearedInWorld } from '../lib/stories'
import { Furigana } from '../components/Furigana'
import { Icon } from '../components/ui/Icon'
import type { JapaneseToken, KanjiRecord } from '../types/data'

interface TokenExplanation {
  kanji: KanjiRecord
  reading: string | null
  why: string
}

/**
 * Lector de cuentos: una página a la vez, con furigana que se puede tapar y con
 * cada palabra pulsable para ver qué lectura usa cada kanji.
 */
export function StoryReaderPage() {
  const { storyId = '' } = useParams()
  const { loading, getStory, getKanjiById, getWorld, kanjis } = useKanjiData()
  const stageResults = useStageResults()
  const [pageIndex, setPageIndex] = useState(0)
  const [hideReadings, setHideReadings] = useState(false)
  const [selected, setSelected] = useState<JapaneseToken | null>(null)

  const story = getStory(storyId)
  const page = story?.pages[pageIndex]

  const byLiteral = useMemo(
    () => new Map(kanjis.map((kanji) => [kanji.kanji, kanji])),
    [kanjis],
  )

  const explanations = useMemo<TokenExplanation[]>(() => {
    if (!selected) return []
    return [...selected.surface]
      .filter(isKanjiChar)
      .map((char) => byLiteral.get(char))
      .filter((kanji): kanji is KanjiRecord => Boolean(kanji))
      .map((kanji) => {
        const analysis = analyzeReading(
          kanji,
          selected.surface,
          selected.reading ?? null,
        )
        return {
          kanji,
          reading: analysis.readingInWord,
          why: analysis.why,
        }
      })
  }, [selected, byLiteral])

  const goToPage = useCallback((next: number) => {
    setPageIndex(next)
    setSelected(null)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  if (loading) return <p className="text-center text-[var(--muted)]">Cargando…</p>
  if (!story || !page) {
    return (
      <p className="text-center text-[var(--muted)]">
        No encontramos ese cuento.{' '}
        <Link to="/cuentos" className="font-bold text-violet-300">
          Ver los cuentos
        </Link>
      </p>
    )
  }

  const world = getWorld(story.worldId)
  const cleared = stagesClearedInWorld(world, stageResults)
  if (!isStoryUnlocked(story, cleared)) {
    return (
      <div className="animate-pop space-y-4 rounded-[28px] border border-white/12 bg-white/5 p-6 text-center">
        <Icon name="lock" className="mx-auto h-10 w-10 text-amber-300" />
        <h1 className="text-xl font-extrabold text-white">{story.titleEs}</h1>
        <p className="text-sm text-[var(--muted)]">
          Este cuento usa los kanji de {world?.name ?? 'este mundo'}. Supera{' '}
          {story.minStagesCleared} etapas para leerlo ({cleared}/
          {story.minStagesCleared}).
        </p>
        <Link
          to="/cuentos"
          className="pressable inline-block rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-6 py-3 font-extrabold text-white shadow-lg shadow-fuchsia-500/30"
        >
          Volver a los cuentos
        </Link>
      </div>
    )
  }

  const isLast = pageIndex >= story.pages.length - 1
  const storyKanjis = story.kanjiIds
    .map((id) => getKanjiById(id))
    .filter((kanji): kanji is KanjiRecord => Boolean(kanji))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/cuentos"
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--muted)] hover:text-white"
        >
          <Icon name="back" className="h-4 w-4" />
          Cuentos
        </Link>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[var(--muted)]">
          Página {pageIndex + 1}/{story.pages.length}
        </span>
      </div>

      <article className="animate-pop overflow-hidden rounded-[28px] border border-white/12 bg-white/5 shadow-2xl shadow-black/30">
        <img
          src={page.illustration}
          alt=""
          className="w-full bg-black/20"
        />

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-lg font-extrabold text-white" lang="ja">
              {story.title}
            </h1>
            <button
              type="button"
              onClick={() => setHideReadings((value) => !value)}
              className="pressable rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[var(--muted)] hover:text-white"
              aria-pressed={hideReadings}
            >
              {hideReadings ? 'Ver furigana' : 'Ocultar furigana'}
            </button>
          </div>

          <div className="flex flex-wrap gap-x-1 gap-y-2">
            {page.tokens.map((token, index) => {
              const hasKanji = [...token.surface].some(isKanjiChar)
              if (!hasKanji) {
                return (
                  <span
                    key={index}
                    className="text-2xl leading-[2.1] text-white"
                    lang="ja"
                  >
                    {token.surface}
                  </span>
                )
              }
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelected(token)}
                  className={`rounded-lg px-0.5 transition hover:bg-violet-400/25 ${
                    selected === token ? 'bg-violet-400/30' : ''
                  }`}
                >
                  <Furigana
                    tokens={[token]}
                    hideReadings={hideReadings}
                    highlightTarget={false}
                    className="text-2xl"
                  />
                </button>
              )
            })}
          </div>

          <p className="rounded-2xl bg-black/20 px-4 py-3 text-sm text-[var(--muted)]">
            {page.es}
          </p>

          {explanations.length > 0 && (
            <div className="animate-pop space-y-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-violet-200">
                En «{selected?.surface}»
              </p>
              {explanations.map((item) => (
                <div key={item.kanji.id} className="flex items-start gap-3">
                  <Link
                    to={`/kanji/${item.kanji.id}`}
                    state={{ from: `/cuento/${story.id}` }}
                    className="pressable grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl text-white hover:bg-white/20"
                    lang="ja"
                  >
                    {item.kanji.kanji}
                  </Link>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">
                      {item.kanji.keyword}
                      {item.reading && (
                        <span className="ml-2 text-[var(--muted)]" lang="ja">
                          {item.reading}
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] leading-relaxed text-white/85">
                      {item.why}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={pageIndex === 0}
          onClick={() => goToPage(pageIndex - 1)}
          className="pressable rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-white disabled:opacity-40"
        >
          Anterior
        </button>
        {isLast ? (
          <Link
            to="/cuentos"
            className="pressable flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 px-5 py-3 font-extrabold text-white shadow-lg shadow-emerald-500/30"
          >
            <Icon name="check" className="h-5 w-5" />
            Fin del cuento
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => goToPage(pageIndex + 1)}
            className="pressable flex-1 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 px-5 py-3 font-extrabold text-white shadow-lg shadow-emerald-500/30"
          >
            Siguiente página
          </button>
        )}
      </div>

      <section className="rounded-3xl border border-white/12 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
          Kanji de este cuento
        </h2>
        <div className="flex flex-wrap gap-2">
          {storyKanjis.map((kanji) => (
            <Link
              key={kanji.id}
              to={`/kanji/${kanji.id}`}
              state={{ from: `/cuento/${story.id}` }}
              className="pressable grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-2xl text-white hover:bg-white/20"
              lang="ja"
            >
              {kanji.kanji}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
