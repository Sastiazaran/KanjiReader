import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { buildQuiz, type QuizQuestion } from '../lib/quiz'
import { commitSession } from '../lib/progress-service'
import { QuizGame, type QuizSummary } from '../components/QuizGame'
import { PhotoCard } from '../components/PhotoCard'
import { Icon } from '../components/ui/Icon'
import type { KanjiRecord } from '../types/data'

/**
 * «Kanji en la calle»: fotos reales de Japón para leer carteles de verdad y un
 * juego de emparejar foto y kanji.
 */
export function StreetPage() {
  const { loading, photos, kanjis, vocabByKanjiId, sentencesByKanjiId, photosByKanjiId } =
    useKanjiData()
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [playing, setPlaying] = useState(false)
  const [summary, setSummary] = useState<QuizSummary | null>(null)

  const byLiteral = useMemo(
    () => new Map(kanjis.map((kanji) => [kanji.kanji, kanji])),
    [kanjis],
  )

  const photoKanjis = useMemo(
    () =>
      [...new Set(photos.map((photo) => photo.focus))]
        .map((literal) => byLiteral.get(literal))
        .filter((kanji): kanji is KanjiRecord => Boolean(kanji)),
    [photos, byLiteral],
  )

  const startGame = useCallback(() => {
    setSummary(null)
    const built = buildQuiz(
      photoKanjis,
      { pool: kanjis, vocabByKanjiId, sentencesByKanjiId, photosByKanjiId },
      ['photo'],
    )
    if (built.length === 0) return
    setQuestions(built)
    setPlaying(true)
  }, [photoKanjis, kanjis, vocabByKanjiId, sentencesByKanjiId, photosByKanjiId])

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

  return (
    <div className="space-y-5">
      <header className="animate-pop rounded-[28px] bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-600 p-6 shadow-2xl shadow-sky-900/40">
        <h1 className="text-2xl font-extrabold text-white">Kanji en la calle</h1>
        <p className="mt-1 text-sm text-white/90">
          Fotos de verdad hechas en Japón. Adivina qué dice el cartel y descubre
          qué lectura usa cada kanji cuando sale al mundo real.
        </p>
        <button
          type="button"
          onClick={startGame}
          className="pressable mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-extrabold text-teal-700 shadow-lg"
        >
          <Icon name="play" className="h-5 w-5" />
          Jugar a emparejar ({photoKanjis.length})
        </button>
      </header>

      {summary && (
        <div className="animate-pop rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
          <p className="text-lg font-extrabold text-white">
            {summary.correct} de {summary.total} carteles leídos
          </p>
          <p className="text-sm text-emerald-200">+{summary.xpEarned} XP ganados</p>
        </div>
      )}

      <ul className="space-y-4">
        {photos.map((photo) => {
          const kanji = byLiteral.get(photo.focus)
          return (
            <li key={photo.id} className="space-y-2">
              <PhotoCard
                photo={photo}
                quiz
                revealed={Boolean(revealed[photo.id])}
                onReveal={() =>
                  setRevealed((current) => ({ ...current, [photo.id]: true }))
                }
              />
              {kanji && revealed[photo.id] && (
                <Link
                  to={`/kanji/${kanji.id}`}
                  state={{ from: '/calle' }}
                  className="pressable inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
                >
                  <span className="text-xl" lang="ja">
                    {kanji.kanji}
                  </span>
                  Ver la ficha de «{kanji.keyword}»
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
