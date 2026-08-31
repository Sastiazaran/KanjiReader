import { useCallback, useMemo, useState } from 'react'
import type { QuestionKind, QuizQuestion } from '../lib/quiz'
import { MAX_HEARTS, xpForAnswer } from '../lib/game'
import { recordAnswer } from '../lib/progress-service'
import { playSfx } from '../lib/sfx'
import { Furigana } from './Furigana'
import { ProgressBar } from './ui/ProgressBar'
import { Icon } from './ui/Icon'

export interface QuizSummary {
  correct: number
  /** Preguntas respondidas, que pueden ser menos que la ronda completa. */
  total: number
  xpEarned: number
  bestCombo: number
  ranOutOfHearts: boolean
}

interface QuizGameProps {
  questions: QuizQuestion[]
  onFinish: (summary: QuizSummary) => void
  onQuit?: () => void
  /** Con vidas la partida termina al fallar tres veces. */
  useHearts?: boolean
}

type Phase = 'answering' | 'feedback'

/**
 * Preguntas de lectura: la explicación es lo que de verdad se aprende, así que
 * se muestra también al acertar.
 */
const EXPLAIN_ON_SUCCESS = new Set<QuestionKind>([
  'reading-context',
  'reading-type',
  'sentence',
  'photo',
])

export function QuizGame({
  questions,
  onFinish,
  onQuit,
  useHearts = true,
}: QuizGameProps) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('answering')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [lastGain, setLastGain] = useState<number | null>(null)

  const question = questions[index]
  const isCorrect = selectedId != null && selectedId === question?.answerId
  const progress = useMemo(
    () => (questions.length ? index / questions.length : 0),
    [index, questions.length],
  )

  const answer = useCallback(
    (optionId: string) => {
      if (phase === 'feedback' || !question) return
      const wasCorrect = optionId === question.answerId
      setSelectedId(optionId)
      setPhase('feedback')
      void recordAnswer(question.kanjiId, wasCorrect)
      playSfx(wasCorrect ? 'correct' : 'wrong')

      if (wasCorrect) {
        const gain = xpForAnswer(combo)
        const nextCombo = combo + 1
        setCombo(nextCombo)
        setBestCombo((b) => Math.max(b, nextCombo))
        setCorrect((c) => c + 1)
        setXpEarned((xp) => xp + gain)
        setLastGain(gain)
      } else {
        setCombo(0)
        setHearts((h) => h - 1)
        setLastGain(null)
      }
    },
    [combo, phase, question],
  )

  const goNext = useCallback(() => {
    const outOfHearts = useHearts && hearts <= 0
    const isLast = index >= questions.length - 1
    if (outOfHearts || isLast) {
      playSfx('finish')
      onFinish({
        correct,
        total: index + 1,
        xpEarned,
        bestCombo,
        ranOutOfHearts: outOfHearts,
      })
      return
    }
    setIndex((i) => i + 1)
    setSelectedId(null)
    setPhase('answering')
    setLastGain(null)
  }, [
    bestCombo,
    correct,
    hearts,
    index,
    onFinish,
    questions.length,
    useHearts,
    xpEarned,
  ])

  if (!question) return null

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        {onQuit && (
          <button
            type="button"
            onClick={onQuit}
            className="pressable grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[var(--muted)] hover:text-white"
            aria-label="Salir de la partida"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        )}
        <ProgressBar
          value={progress}
          className="flex-1"
          label="Progreso de la partida"
          barClassName="bg-gradient-to-r from-lime-300 to-emerald-400"
        />
        {useHearts && (
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_HEARTS }, (_, i) => (
              <Icon
                key={i}
                name="heart"
                className={`h-5 w-5 ${
                  i < hearts ? 'text-rose-400' : 'text-white/15'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-[var(--muted)]">
          Pregunta {index + 1} de {questions.length}
        </span>
        {combo >= 2 && (
          <span className="animate-pop rounded-full bg-orange-500/20 px-3 py-1 text-orange-200">
            ¡Combo x{combo}!
          </span>
        )}
      </div>

      <div
        className={`relative rounded-[28px] border border-white/12 bg-white/5 p-6 text-center ${
          phase === 'feedback' && !isCorrect ? 'animate-shake' : ''
        }`}
      >
        <p className="mb-4 text-sm font-bold text-[var(--muted)]">{question.help}</p>

        {question.imageSrc && (
          <img
            src={question.imageSrc}
            alt="Cartel fotografiado en Japón"
            className="mx-auto mb-4 max-h-64 w-full rounded-2xl object-cover"
          />
        )}

        {question.promptTokens ? (
          <Furigana
            tokens={question.promptTokens}
            className="text-3xl sm:text-4xl"
          />
        ) : (
          <p
            className={
              question.promptIsJapanese
                ? 'text-7xl font-bold text-white'
                : 'text-3xl font-extrabold text-white'
            }
            lang={question.promptIsJapanese ? 'ja' : 'es'}
          >
            {question.prompt}
          </p>
        )}

        {question.promptNote && (
          <p className="mt-3 text-sm text-[var(--muted)]">{question.promptNote}</p>
        )}

        {lastGain != null && (
          <span className="animate-rise pointer-events-none absolute right-6 top-6 text-lg font-extrabold text-emerald-300">
            +{lastGain} XP
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const isAnswer = option.id === question.answerId
          const isPicked = option.id === selectedId
          const showState = phase === 'feedback' && (isAnswer || isPicked)
          const stateClass = !showState
            ? 'border-white/12 bg-white/5 hover:border-violet-400/60 hover:bg-white/10'
            : isAnswer
              ? 'border-emerald-400/70 bg-emerald-500/20 text-white'
              : 'border-rose-400/70 bg-rose-500/20 text-white'

          return (
            <button
              key={option.id}
              type="button"
              disabled={phase === 'feedback'}
              onClick={() => answer(option.id)}
              className={`pressable flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left font-bold text-white disabled:cursor-default ${stateClass}`}
            >
              <span
                className={option.isJapanese ? 'text-3xl' : 'text-base'}
                lang={option.isJapanese ? 'ja' : 'es'}
              >
                {option.label}
              </span>
              {showState && (
                <Icon
                  name={isAnswer ? 'check' : 'close'}
                  className="h-5 w-5 shrink-0"
                />
              )}
            </button>
          )
        })}
      </div>

      {phase === 'feedback' && (
        <div
          className={`animate-pop space-y-3 rounded-3xl p-4 ${
            isCorrect ? 'bg-emerald-500/15' : 'bg-rose-500/15'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-extrabold text-white">
              {isCorrect ? '¡Muy bien!' : 'Casi. Mira la respuesta correcta:'}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="pressable rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-fuchsia-500/30"
            >
              {index >= questions.length - 1 || (useHearts && hearts <= 0)
                ? 'Ver resultado'
                : 'Continuar'}
            </button>
          </div>
          {(!isCorrect || EXPLAIN_ON_SUCCESS.has(question.kind)) && (
            <div className="space-y-2 rounded-2xl bg-black/20 px-4 py-3 text-left">
              <p className="text-sm leading-relaxed text-white">
                {question.explanation}
              </p>
              {!isCorrect && question.storyHint && (
                <p className="text-sm leading-relaxed text-amber-100/90">
                  <span className="font-extrabold text-amber-200">
                    Cuento mágico:{' '}
                  </span>
                  {question.storyHint}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
