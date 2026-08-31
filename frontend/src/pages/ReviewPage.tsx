import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { useReviewQueue } from '../hooks/useGameState'
import {
  buildAdaptiveQuiz,
  buildQuiz,
  type QuizContext,
  type QuizQuestion,
} from '../lib/quiz'
import {
  reviewModesFor,
  reviewTier,
  TIERS,
  type ReviewModeId,
} from '../lib/difficulty'
import { commitSession } from '../lib/progress-service'
import { MASTERED_LEVEL } from '../lib/srs'
import { QuizGame, type QuizSummary } from '../components/QuizGame'
import { Icon } from '../components/ui/Icon'
import { ProgressBar } from '../components/ui/ProgressBar'
import type { KanjiRecord } from '../types/data'

/** Tamaños de sesión: empezar corto y alargar cuando apetece. */
const SESSION_SIZES = [10, 20, 40] as const
type SessionSize = (typeof SESSION_SIZES)[number]

/** Color del nivel de memoria, de recién visto a dominado. */
const LEVEL_COLORS = [
  'bg-rose-500/25 text-rose-100',
  'bg-orange-500/25 text-orange-100',
  'bg-amber-500/25 text-amber-100',
  'bg-lime-500/25 text-lime-100',
  'bg-emerald-500/25 text-emerald-100',
  'bg-teal-400/30 text-teal-50',
]

interface QueueEntry {
  kanji: KanjiRecord
  srsLevel: number
  nextReview: string
}

export function ReviewPage() {
  const {
    loading,
    kanjis,
    getKanjiById,
    vocabByKanjiId,
    sentencesByKanjiId,
    photosByKanjiId,
  } = useKanjiData()
  const { due, studied } = useReviewQueue()
  const [playing, setPlaying] = useState(false)
  const [summary, setSummary] = useState<QuizSummary | null>(null)
  const [mode, setMode] = useState<ReviewModeId>('adaptive')
  const [size, setSize] = useState<SessionSize>(10)
  // Frozen for the whole run: live SRS updates must not reshuffle mid-quiz.
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  const context = useMemo<QuizContext>(
    () => ({
      pool: kanjis,
      vocabByKanjiId,
      sentencesByKanjiId,
      photosByKanjiId,
    }),
    [kanjis, vocabByKanjiId, sentencesByKanjiId, photosByKanjiId],
  )

  const { dueEntries, studiedEntries } = useMemo(() => {
    const resolve = (rows: typeof due): QueueEntry[] =>
      rows
        .map((row) => {
          const kanji = getKanjiById(row.kanjiId)
          return kanji
            ? { kanji, srsLevel: row.srsLevel, nextReview: row.nextReview }
            : null
        })
        .filter((entry): entry is QueueEntry => entry != null)

    return { dueEntries: resolve(due), studiedEntries: resolve(studied) }
  }, [due, studied, getKanjiById])

  const session = useMemo(
    () => (dueEntries.length ? dueEntries : studiedEntries).slice(0, size),
    [dueEntries, studiedEntries, size],
  )

  const modes = useMemo(
    () => reviewModesFor(studiedEntries.length),
    [studiedEntries.length],
  )
  const activeMode = modes.find((entry) => entry.mode.id === mode)?.mode

  const startReview = useCallback(() => {
    setSummary(null)
    const kinds = activeMode?.kinds ?? null
    const built = kinds
      ? buildQuiz(
          session.map((entry) => entry.kanji),
          context,
          kinds,
        )
      : buildAdaptiveQuiz(session, context)
    if (built.length === 0) return
    setQuestions(built)
    setPlaying(true)
  }, [activeMode, session, context])

  const handleFinish = useCallback(async (result: QuizSummary) => {
    await commitSession({
      xpEarned: result.xpEarned,
      correct: result.correct,
      total: result.total,
      bestCombo: result.bestCombo,
    })
    setSummary(result)
    setPlaying(false)
    setQuestions([])
  }, [])

  if (loading) return <p className="text-center text-[var(--muted)]">Cargando…</p>

  if (playing && questions.length > 0) {
    return (
      <QuizGame
        questions={questions}
        onFinish={handleFinish}
        onQuit={() => {
          setPlaying(false)
          setQuestions([])
        }}
        useHearts={false}
      />
    )
  }

  if (studiedEntries.length === 0) {
    return (
      <div className="animate-pop space-y-4 rounded-[28px] border border-white/12 bg-white/5 p-6 text-center">
        <Icon name="brain" className="mx-auto h-10 w-10 text-violet-300" />
        <h1 className="text-xl font-extrabold text-white">Aún no hay repaso</h1>
        <p className="text-sm text-[var(--muted)]">
          Juega tu primera etapa en el mapa y aquí aparecerán los kanji que toca
          repasar cada día.
        </p>
        <Link
          to="/"
          className="pressable inline-block rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-6 py-3 font-extrabold text-white shadow-lg shadow-fuchsia-500/30"
        >
          Ir al mapa
        </Link>
      </div>
    )
  }

  const mastered = studiedEntries.filter(
    (entry) => entry.srsLevel >= MASTERED_LEVEL,
  ).length
  const nextUp = dueEntries.length > 0 ? dueEntries : studiedEntries

  return (
    <div className="space-y-5">
      <header className="animate-pop rounded-[28px] bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 p-6 shadow-2xl shadow-indigo-900/40">
        <h1 className="text-2xl font-extrabold text-white">Repaso diario</h1>
        <p className="mt-1 text-sm text-white/85">
          {dueEntries.length > 0
            ? `${dueEntries.length} kanji te esperan hoy. Empezamos por los que peor recuerdas.`
            : 'Nada pendiente hoy: puedes practicar igualmente para reforzar.'}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-black/25 px-3 py-2">
            <p className="text-xl font-extrabold text-white">{dueEntries.length}</p>
            <p className="text-[11px] font-bold text-white/70">Para hoy</p>
          </div>
          <div className="rounded-2xl bg-black/25 px-3 py-2">
            <p className="text-xl font-extrabold text-white">
              {studiedEntries.length}
            </p>
            <p className="text-[11px] font-bold text-white/70">En tu memoria</p>
          </div>
          <div className="rounded-2xl bg-black/25 px-3 py-2">
            <p className="text-xl font-extrabold text-white">{mastered}</p>
            <p className="text-[11px] font-bold text-white/70">Dominados</p>
          </div>
        </div>
      </header>

      <section className="space-y-3 rounded-3xl border border-white/12 bg-white/5 p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
          Cómo quieres repasar
        </h2>

        <div className="grid gap-2 sm:grid-cols-2">
          {modes.map(({ mode: option, unlocked }) => {
            const selected = option.id === mode
            return (
              <button
                key={option.id}
                type="button"
                disabled={!unlocked}
                onClick={() => setMode(option.id)}
                className={`pressable rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? 'border-violet-400/70 bg-violet-500/20'
                    : 'border-white/12 bg-white/5 hover:border-violet-400/40'
                } ${unlocked ? '' : 'cursor-not-allowed opacity-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white">{option.name}</span>
                  {!unlocked && <Icon name="lock" className="h-4 w-4 text-white/60" />}
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {unlocked
                    ? option.description
                    : `Se abre con ${option.minStudied} kanji estudiados`}
                </p>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[var(--muted)]">
            Cuántos kanji:
          </span>
          {SESSION_SIZES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              className={`pressable rounded-full px-3 py-1.5 text-xs font-extrabold ${
                size === option
                  ? 'bg-white text-indigo-700'
                  : 'bg-white/10 text-[var(--muted)] hover:text-white'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={startReview}
          className="pressable inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-fuchsia-500/30"
        >
          <Icon name="play" className="h-5 w-5" />
          Repasar {session.length} kanji
        </button>

        {mode === 'adaptive' && (
          <p className="rounded-2xl bg-black/20 px-3 py-2 text-[13px] text-[var(--muted)]">
            En el modo adaptado cada kanji sube de nivel: lo nuevo se pregunta por
            su significado y lo que ya dominas, dentro de frases y lecturas.
          </p>
        )}
      </section>

      {summary && (
        <div className="animate-pop rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
          <p className="text-lg font-extrabold text-white">
            {summary.correct} de {summary.total} aciertos
          </p>
          <p className="text-sm text-emerald-200">+{summary.xpEarned} XP ganados</p>
        </div>
      )}

      <section className="space-y-3 rounded-3xl border border-white/12 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
            {dueEntries.length > 0 ? 'Toca repasar' : 'En tu memoria'}
          </h2>
          <span className="text-[11px] font-bold text-[var(--muted)]">
            nivel de memoria 0–{MASTERED_LEVEL}
          </span>
        </div>

        <ul className="space-y-2">
          {nextUp.slice(0, 12).map((entry) => {
            const tier = reviewTier(entry.srsLevel)
            return (
              <li key={entry.kanji.id}>
                <Link
                  to={`/kanji/${entry.kanji.id}`}
                  className="pressable flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5 hover:bg-white/10"
                >
                  <span className="text-3xl text-white" lang="ja">
                    {entry.kanji.kanji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">
                      {entry.kanji.keyword}
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      {TIERS[tier].name} · vuelve el{' '}
                      {new Date(entry.nextReview).toLocaleDateString('es')}
                    </span>
                    <ProgressBar
                      value={entry.srsLevel / MASTERED_LEVEL}
                      className="mt-1"
                      barClassName="bg-gradient-to-r from-emerald-400 to-amber-300"
                      label="Nivel de memoria"
                    />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                      LEVEL_COLORS[Math.min(entry.srsLevel, LEVEL_COLORS.length - 1)]
                    }`}
                  >
                    {entry.srsLevel}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        {nextUp.length > 12 && (
          <p className="text-center text-xs text-[var(--muted)]">
            y {nextUp.length - 12} más
          </p>
        )}
      </section>
    </div>
  )
}
