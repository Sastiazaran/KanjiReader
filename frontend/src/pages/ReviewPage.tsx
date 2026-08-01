import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { useReviewQueue } from '../hooks/useGameState'
import { buildQuiz, type QuizQuestion } from '../lib/quiz'
import { commitSession } from '../lib/progress-service'
import { QuizGame, type QuizSummary } from '../components/QuizGame'
import { Icon } from '../components/ui/Icon'

const MAX_REVIEW_ITEMS = 10

export function ReviewPage() {
  const { loading, kanjis, getKanjiById } = useKanjiData()
  const { due, studied } = useReviewQueue()
  const [playing, setPlaying] = useState(false)
  const [summary, setSummary] = useState<QuizSummary | null>(null)
  // Frozen for the whole run: live SRS updates must not reshuffle mid-quiz.
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  const { dueKanjis, studiedKanjis } = useMemo(() => {
    const resolve = (ids: number[]) =>
      ids
        .map((id) => getKanjiById(id))
        .filter((k): k is NonNullable<typeof k> => Boolean(k))
    return { dueKanjis: resolve(due), studiedKanjis: resolve(studied) }
  }, [due, studied, getKanjiById])

  const sessionKanjis = useMemo(
    () => (dueKanjis.length ? dueKanjis : studiedKanjis).slice(0, MAX_REVIEW_ITEMS),
    [dueKanjis, studiedKanjis],
  )

  const startReview = useCallback(() => {
    setSummary(null)
    setQuestions(buildQuiz(sessionKanjis, kanjis, ['meaning', 'reading']))
    setPlaying(true)
  }, [sessionKanjis, kanjis])

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

  if (studiedKanjis.length === 0) {
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

  return (
    <div className="space-y-5">
      <header className="animate-pop rounded-[28px] bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 p-6 shadow-2xl shadow-indigo-900/40">
        <h1 className="text-2xl font-extrabold text-white">Repaso diario</h1>
        <p className="mt-1 text-sm text-white/85">
          {dueKanjis.length > 0
            ? `Tienes ${dueKanjis.length} kanji listos para repasar. Practicaremos ${sessionKanjis.length}.`
            : 'No queda nada pendiente hoy: puedes practicar igualmente para reforzar.'}
        </p>
        <button
          type="button"
          onClick={startReview}
          className="pressable mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-extrabold text-indigo-700 shadow-lg"
        >
          <Icon name="play" className="h-5 w-5" />
          Empezar repaso
        </button>
      </header>

      {summary && (
        <div className="animate-pop rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
          <p className="text-lg font-extrabold text-white">
            {summary.correct} de {summary.total} aciertos
          </p>
          <p className="text-sm text-emerald-200">+{summary.xpEarned} XP ganados</p>
        </div>
      )}

      <section className="rounded-3xl border border-white/12 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
          En tu memoria
        </h2>
        <div className="flex flex-wrap gap-2">
          {studiedKanjis.slice(0, 60).map((kanji) => {
            return (
              <Link
                key={kanji.id}
                to={`/kanji/${kanji.id}`}
                className="pressable grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl text-white hover:bg-white/20"
                lang="ja"
              >
                {kanji.kanji}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
