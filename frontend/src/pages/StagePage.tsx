import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { buildQuiz, type QuizQuestion } from '../lib/quiz'
import { BADGES, starsFor } from '../lib/game'
import {
  commitSession,
  extraXpForStage,
  saveStageResult,
} from '../lib/progress-service'
import { QuizGame, type QuizSummary } from '../components/QuizGame'
import { StoryCard } from '../components/StoryCard'
import { Icon } from '../components/ui/Icon'
import { Stars } from '../components/ui/Stars'

type Phase = 'learn' | 'quiz' | 'result'

interface StageOutcome {
  stars: number
  accuracy: number
  xpTotal: number
  correct: number
  total: number
  newBadges: string[]
}

export function StagePage() {
  const { stageId = '' } = useParams()
  const navigate = useNavigate()
  const { loading, getStage, getWorld, getKanjiById, kanjis, mediaMap, vocabByKanjiId } =
    useKanjiData()

  const [phase, setPhase] = useState<Phase>('learn')
  const [cardIndex, setCardIndex] = useState(0)
  const [outcome, setOutcome] = useState<StageOutcome | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  const stage = getStage(stageId)
  const world = stage ? getWorld(stage.worldId) : undefined

  const stageKanjis = useMemo(
    () =>
      (stage?.kanjiIds ?? [])
        .map((id) => getKanjiById(id))
        .filter((k): k is NonNullable<typeof k> => Boolean(k)),
    [stage, getKanjiById],
  )

  const startQuiz = useCallback(() => {
    setQuestions(buildQuiz(stageKanjis, kanjis))
    setPhase('quiz')
  }, [stageKanjis, kanjis])

  const nextStage = useMemo(() => {
    if (!stage || !world) return null
    return world.stages.find((s) => s.index === stage.index + 1) ?? null
  }, [stage, world])

  const handleFinish = useCallback(
    async (summary: QuizSummary) => {
      if (!stage) return
      // Quedarse sin vidas nunca debe premiar como una etapa terminada entera.
      const rawAccuracy = summary.total ? summary.correct / summary.total : 0
      const accuracy = summary.ranOutOfHearts ? Math.min(rawAccuracy, 0.5) : rawAccuracy
      const { isNewBest } = await saveStageResult(stage.id, stage.worldId, accuracy)
      const bonus = accuracy >= 0.5 ? extraXpForStage(isNewBest) : 0
      const xpTotal = summary.xpEarned + bonus
      const newBadges = await commitSession({
        xpEarned: xpTotal,
        correct: summary.correct,
        total: summary.total,
        bestCombo: summary.bestCombo,
      })
      setOutcome({
        stars: starsFor(accuracy),
        accuracy,
        xpTotal,
        correct: summary.correct,
        total: summary.total,
        newBadges,
      })
      setPhase('result')
    },
    [stage],
  )

  const restart = useCallback(() => {
    setOutcome(null)
    setCardIndex(0)
    setPhase('learn')
  }, [])

  if (loading) return <p className="text-center text-[var(--muted)]">Cargando…</p>
  if (!stage || !world || stageKanjis.length === 0) {
    return (
      <p className="text-center text-[var(--muted)]">
        No encontramos esta etapa.{' '}
        <Link to="/" className="font-bold text-violet-300">
          Volver al mapa
        </Link>
      </p>
    )
  }

  if (phase === 'quiz') {
    return (
      <QuizGame
        questions={questions}
        onFinish={handleFinish}
        onQuit={() => setPhase('learn')}
      />
    )
  }

  if (phase === 'result' && outcome) {
    const unlockedBadges = BADGES.filter((b) => outcome.newBadges.includes(b.id))
    return (
      <div className="animate-pop space-y-5 text-center">
        <div className="rounded-[28px] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 shadow-2xl shadow-orange-900/40">
          <h1 className="text-2xl font-extrabold text-white">
            {outcome.stars === 3
              ? '¡Etapa perfecta!'
              : outcome.stars > 0
                ? '¡Etapa superada!'
                : 'Casi lo tienes'}
          </h1>
          <div className="my-4 flex justify-center">
            <Stars value={outcome.stars} size="w-12 h-12" />
          </div>
          <p className="font-bold text-white">
            {outcome.correct} de {outcome.total} aciertos ·{' '}
            {Math.round(outcome.accuracy * 100)}%
          </p>
          <p className="mt-2 inline-block rounded-full bg-black/25 px-4 py-1.5 text-sm font-extrabold text-white">
            +{outcome.xpTotal} XP
          </p>
        </div>

        {unlockedBadges.length > 0 && (
          <div className="space-y-2 rounded-3xl border border-amber-300/30 bg-amber-400/10 p-4">
            <p className="font-extrabold text-amber-200">¡Nueva insignia!</p>
            {unlockedBadges.map((badge) => (
              <div key={badge.id} className="flex items-center justify-center gap-2">
                <Icon name="trophy" className="h-5 w-5 text-amber-300" />
                <span className="font-bold text-white">{badge.name}</span>
                <span className="text-sm text-[var(--muted)]">
                  {badge.description}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={restart}
            className="pressable rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-extrabold text-white"
          >
            Repetir etapa
          </button>
          {nextStage && outcome.stars > 0 ? (
            <button
              type="button"
              onClick={() => {
                setOutcome(null)
                setCardIndex(0)
                setPhase('learn')
                navigate(`/etapa/${nextStage.id}`)
              }}
              className="pressable rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 py-3 font-extrabold text-white shadow-lg shadow-fuchsia-500/30"
            >
              Siguiente etapa
            </button>
          ) : (
            <Link
              to={`/mundo/${world.id}`}
              className="pressable rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 py-3 font-extrabold text-white shadow-lg shadow-fuchsia-500/30"
            >
              Volver al mundo
            </Link>
          )}
        </div>
      </div>
    )
  }

  const kanji = stageKanjis[cardIndex]
  const isLastCard = cardIndex >= stageKanjis.length - 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to={`/mundo/${world.id}`}
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--muted)] hover:text-white"
        >
          <Icon name="back" className="h-4 w-4" />
          {world.name}
        </Link>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[var(--muted)]">
          Etapa {stage.index} · Kanji {cardIndex + 1}/{stageKanjis.length}
        </span>
      </div>

      <StoryCard
        key={kanji.id}
        kanji={kanji}
        mediaMap={mediaMap}
        vocab={vocabByKanjiId.get(kanji.id) ?? []}
        showLink
      />

      <div className="flex gap-3">
        <button
          type="button"
          disabled={cardIndex === 0}
          onClick={() => setCardIndex((i) => Math.max(0, i - 1))}
          className="pressable rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-white disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => (isLastCard ? startQuiz() : setCardIndex((i) => i + 1))}
          className="pressable flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 px-5 py-3 font-extrabold text-white shadow-lg shadow-emerald-500/30"
        >
          {isLastCard ? (
            <>
              <Icon name="play" className="h-5 w-5" />A jugar
            </>
          ) : (
            'Siguiente kanji'
          )}
        </button>
      </div>
    </div>
  )
}
