import type { KanjiRecord } from '../types/data'

export type QuestionKind = 'meaning' | 'kanji' | 'reading'

export interface QuizOption {
  id: string
  label: string
  isJapanese: boolean
}

export interface QuizQuestion {
  id: string
  kind: QuestionKind
  kanjiId: number
  prompt: string
  promptIsJapanese: boolean
  help: string
  options: QuizOption[]
  answerId: string
  /** Texto corto al fallar: respuesta correcta + pista amigable. */
  explanation: string
  /** Historia mnemónica opcional para reforzar el recuerdo. */
  storyHint: string | null
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Distractores parecidos: mismo grado escolar o número de trazos cercano. */
function pickDistractors(
  target: KanjiRecord,
  pool: KanjiRecord[],
  count: number,
): KanjiRecord[] {
  const others = pool.filter((k) => k.id !== target.id && k.keyword)
  const similar = others.filter(
    (k) => k.grade === target.grade || Math.abs(k.strokes - target.strokes) <= 2,
  )
  const chosen = shuffle(similar.length >= count ? similar : others).slice(0, count)
  if (chosen.length === count) return chosen
  const fill = shuffle(others.filter((k) => !chosen.includes(k)))
  return [...chosen, ...fill].slice(0, count)
}

function firstReading(kanji: KanjiRecord): string | null {
  return kanji.kunyomi[0] ?? kanji.onyomi[0] ?? null
}

function readingsLabel(kanji: KanjiRecord): string | null {
  const readings = [...kanji.kunyomi, ...kanji.onyomi].filter(Boolean)
  return readings.length ? readings.slice(0, 2).join(' · ') : null
}

/** Explicación infantil al fallar, según el tipo de pregunta. */
function buildExplanation(kanji: KanjiRecord, kind: QuestionKind): string {
  const reading = readingsLabel(kanji)
  if (kind === 'kanji') {
    return `La palabra «${kanji.keyword}» se escribe ${kanji.kanji}.${
      reading ? ` Se lee ${reading}.` : ''
    }`
  }
  if (kind === 'reading') {
    return `${kanji.kanji} significa «${kanji.keyword}» y se lee ${
      reading ?? 'así'
    }.`
  }
  return `${kanji.kanji} significa «${kanji.keyword}».${
    reading ? ` Se lee ${reading}.` : ''
  }`
}

function buildQuestion(
  kanji: KanjiRecord,
  kind: QuestionKind,
  pool: KanjiRecord[],
): QuizQuestion | null {
  const distractors = pickDistractors(kanji, pool, 3)
  if (distractors.length < 3) return null
  const explanation = buildExplanation(kanji, kind)
  const storyHint = kanji.story?.trim() ? kanji.story.trim() : null

  if (kind === 'kanji') {
    const options = shuffle([kanji, ...distractors]).map((k) => ({
      id: String(k.id),
      label: k.kanji,
      isJapanese: true,
    }))
    return {
      id: `${kanji.id}-kanji`,
      kind,
      kanjiId: kanji.id,
      prompt: kanji.keyword,
      promptIsJapanese: false,
      help: '¿Cuál es el kanji de esta palabra?',
      options,
      answerId: String(kanji.id),
      explanation,
      storyHint,
    }
  }

  if (kind === 'reading') {
    const answer = firstReading(kanji)
    if (!answer) return null
    const readingOptions = distractors
      .map((k) => firstReading(k))
      .filter((r): r is string => Boolean(r) && r !== answer)
    if (readingOptions.length < 3) return null
    const options = shuffle([answer, ...readingOptions.slice(0, 3)]).map((r) => ({
      id: r,
      label: r,
      isJapanese: true,
    }))
    return {
      id: `${kanji.id}-reading`,
      kind,
      kanjiId: kanji.id,
      prompt: kanji.kanji,
      promptIsJapanese: true,
      help: '¿Cómo se lee este kanji?',
      options,
      answerId: answer,
      explanation,
      storyHint,
    }
  }

  const options = shuffle([kanji, ...distractors]).map((k) => ({
    id: String(k.id),
    label: k.keyword,
    isJapanese: false,
  }))
  return {
    id: `${kanji.id}-meaning`,
    kind,
    kanjiId: kanji.id,
    prompt: kanji.kanji,
    promptIsJapanese: true,
    help: '¿Qué significa este kanji?',
    options,
    answerId: String(kanji.id),
    explanation,
    storyHint,
  }
}

/**
 * Crea la ronda de preguntas de una partida: cada kanji aparece con dos tipos de
 * pregunta distintos para practicar reconocimiento y recuerdo.
 */
export function buildQuiz(
  kanjis: KanjiRecord[],
  pool: KanjiRecord[],
  kindsPerKanji: QuestionKind[] = ['meaning', 'kanji'],
): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  for (const kanji of kanjis) {
    for (const kind of kindsPerKanji) {
      const question = buildQuestion(kanji, kind, pool)
      if (question) questions.push(question)
    }
  }
  return shuffle(questions)
}
