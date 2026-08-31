import type {
  JapaneseToken,
  KanjiRecord,
  PhotoRecord,
  SentenceRecord,
  VocabRecord,
} from '../types/data'
import { analyzeReading, type ReadingAnalysis } from './reading-type'
import { toHiragana } from './kana'
import { reviewTier, TIERS } from './difficulty'

export type QuestionKind =
  | 'meaning'
  | 'kanji'
  | 'reading-context'
  | 'reading-type'
  | 'sentence'
  | 'photo'

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
  /** Frase con furigana; cuando existe sustituye a `prompt`. */
  promptTokens?: JapaneseToken[]
  /** Traducción o aclaración bajo el enunciado. */
  promptNote?: string | null
  /** Foto de Japón para las preguntas de calle. */
  imageSrc?: string | null
}

/** Datos disponibles para construir preguntas. */
export interface QuizContext {
  pool: KanjiRecord[]
  vocabByKanjiId: Map<number, VocabRecord[]>
  sentencesByKanjiId: Map<number, SentenceRecord[]>
  photosByKanjiId: Map<number, PhotoRecord[]>
}

/** Kanji del repaso junto a su nivel de memoria, para graduar la dificultad. */
export interface ReviewItem {
  kanji: KanjiRecord
  srsLevel: number
}

const OPTION_COUNT = 4
const CLOZE_BLANK = '◯'

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
  return `${kanji.kanji} significa «${kanji.keyword}».${
    reading ? ` Se lee ${reading}.` : ''
  }`
}

function storyOf(kanji: KanjiRecord): string | null {
  return kanji.story?.trim() ? kanji.story.trim() : null
}

/** Palabra concreta donde practicar la lectura de un kanji. */
interface WordSample {
  expression: string
  reading: string
  gloss: string | null
  analysis: ReadingAnalysis
}

/**
 * Palabras del kanji con lectura conocida y explicación fiable, ordenadas al
 * azar para que las partidas no repitan siempre el mismo ejemplo.
 */
function wordSamples(kanji: KanjiRecord, context: QuizContext): WordSample[] {
  const samples: WordSample[] = []

  for (const sentence of context.sentencesByKanjiId.get(kanji.id) ?? []) {
    const target = sentence.tokens.find((token) => token.isTarget)
    if (!target?.reading) continue
    samples.push({
      expression: target.surface,
      reading: target.reading,
      gloss: null,
      analysis: analyzeReading(kanji, target.surface, target.reading),
    })
  }

  for (const word of context.vocabByKanjiId.get(kanji.id) ?? []) {
    if (!word.reading) continue
    samples.push({
      expression: word.expression,
      reading: word.reading,
      gloss: word.glossary || null,
      analysis: analyzeReading(kanji, word.expression, word.reading),
    })
  }

  const usable = samples.filter(
    (sample) =>
      sample.analysis.kind === 'on' || sample.analysis.kind === 'kun',
  )
  const unique = new Map(usable.map((sample) => [sample.expression, sample]))
  return shuffle([...unique.values()])
}

/** Lecturas del propio kanji para usarlas como opciones creíbles. */
function readingOptionsFor(kanji: KanjiRecord, answer: string): string[] {
  const own = [...kanji.onyomi, ...kanji.kunyomi]
    .map((reading) => toHiragana(reading.replace(/-/g, '').split('.')[0]))
    .filter((reading) => reading && reading !== answer)
  return [...new Set(own)]
}

function buildMeaningQuestion(
  kanji: KanjiRecord,
  context: QuizContext,
): QuizQuestion | null {
  const distractors = pickDistractors(kanji, context.pool, OPTION_COUNT - 1)
  if (distractors.length < OPTION_COUNT - 1) return null

  return {
    id: `${kanji.id}-meaning`,
    kind: 'meaning',
    kanjiId: kanji.id,
    prompt: kanji.kanji,
    promptIsJapanese: true,
    help: '¿Qué significa este kanji?',
    options: shuffle([kanji, ...distractors]).map((k) => ({
      id: String(k.id),
      label: k.keyword,
      isJapanese: false,
    })),
    answerId: String(kanji.id),
    explanation: buildExplanation(kanji, 'meaning'),
    storyHint: storyOf(kanji),
  }
}

function buildKanjiQuestion(
  kanji: KanjiRecord,
  context: QuizContext,
): QuizQuestion | null {
  const distractors = pickDistractors(kanji, context.pool, OPTION_COUNT - 1)
  if (distractors.length < OPTION_COUNT - 1) return null

  return {
    id: `${kanji.id}-kanji`,
    kind: 'kanji',
    kanjiId: kanji.id,
    prompt: kanji.keyword,
    promptIsJapanese: false,
    help: '¿Cuál es el kanji de esta palabra?',
    options: shuffle([kanji, ...distractors]).map((k) => ({
      id: String(k.id),
      label: k.kanji,
      isJapanese: true,
    })),
    answerId: String(kanji.id),
    explanation: buildExplanation(kanji, 'kanji'),
    storyHint: storyOf(kanji),
  }
}

function buildReadingContextQuestion(
  kanji: KanjiRecord,
  context: QuizContext,
): QuizQuestion | null {
  const sample = wordSamples(kanji, context)[0]
  const answer = sample?.analysis.readingInWord
  if (!sample || !answer) return null

  const alternatives = readingOptionsFor(kanji, answer)
  if (alternatives.length < 1) return null

  const options = shuffle([answer, ...alternatives.slice(0, OPTION_COUNT - 1)]).map(
    (reading) => ({ id: reading, label: reading, isJapanese: true }),
  )

  return {
    id: `${kanji.id}-reading-context`,
    kind: 'reading-context',
    kanjiId: kanji.id,
    prompt: sample.expression,
    promptIsJapanese: true,
    help: `¿Cómo suena ${kanji.kanji} en esta palabra?`,
    options,
    answerId: answer,
    explanation: sample.analysis.why,
    storyHint: null,
    promptNote: sample.gloss,
  }
}

const READING_TYPE_LABELS = [
  { id: 'kun', label: 'Lectura kun (japonesa)' },
  { id: 'on', label: 'Lectura on (china)' },
] as const

function buildReadingTypeQuestion(
  kanji: KanjiRecord,
  context: QuizContext,
): QuizQuestion | null {
  const sample = wordSamples(kanji, context)[0]
  if (!sample) return null

  return {
    id: `${kanji.id}-reading-type`,
    kind: 'reading-type',
    kanjiId: kanji.id,
    prompt: `${sample.expression}（${sample.reading}）`,
    promptIsJapanese: true,
    help: `En esta palabra, ¿qué lectura usa ${kanji.kanji}?`,
    options: READING_TYPE_LABELS.map((option) => ({
      id: option.id,
      label: option.label,
      isJapanese: false,
    })),
    answerId: sample.analysis.kind,
    explanation: sample.analysis.why,
    storyHint: null,
    promptNote: sample.gloss,
  }
}

/** Sustituye el kanji objetivo por un hueco dentro de la palabra marcada. */
function blankTokens(tokens: JapaneseToken[], literal: string): JapaneseToken[] {
  let done = false
  return tokens.map((token) => {
    if (done || !token.isTarget || !token.surface.includes(literal)) return token
    done = true
    return {
      ...token,
      surface: token.surface.replace(literal, CLOZE_BLANK),
      reading: undefined,
    }
  })
}

function buildSentenceQuestion(
  kanji: KanjiRecord,
  context: QuizContext,
): QuizQuestion | null {
  const sentences = context.sentencesByKanjiId.get(kanji.id) ?? []
  const sentence = shuffle(sentences)[0]
  if (!sentence) return null

  const distractors = pickDistractors(kanji, context.pool, OPTION_COUNT - 1)
  if (distractors.length < OPTION_COUNT - 1) return null

  const target = sentence.tokens.find((token) => token.isTarget)
  const analysis = target?.reading
    ? analyzeReading(kanji, target.surface, target.reading)
    : null
  const full = sentence.tokens.map((token) => token.surface).join('')

  return {
    id: `${sentence.id}-sentence`,
    kind: 'sentence',
    kanjiId: kanji.id,
    prompt: full,
    promptIsJapanese: true,
    help: '¿Qué kanji falta en la frase?',
    options: shuffle([kanji, ...distractors]).map((k) => ({
      id: String(k.id),
      label: k.kanji,
      isJapanese: true,
    })),
    answerId: String(kanji.id),
    explanation: `${full} — ${sentence.es}${analysis ? ` ${analysis.why}` : ''}`,
    storyHint: storyOf(kanji),
    promptTokens: blankTokens(sentence.tokens, kanji.kanji),
    promptNote: sentence.es,
  }
}

function buildPhotoQuestion(
  kanji: KanjiRecord,
  context: QuizContext,
): QuizQuestion | null {
  const photo = shuffle(context.photosByKanjiId.get(kanji.id) ?? [])[0]
  if (!photo) return null

  const distractors = pickDistractors(kanji, context.pool, OPTION_COUNT - 1)
  if (distractors.length < OPTION_COUNT - 1) return null

  return {
    id: `${photo.id}-photo-${kanji.id}`,
    kind: 'photo',
    kanjiId: kanji.id,
    prompt: photo.text,
    promptIsJapanese: true,
    help: '¿Qué kanji estás viendo en la foto?',
    options: shuffle([kanji, ...distractors]).map((k) => ({
      id: String(k.id),
      label: k.kanji,
      isJapanese: true,
    })),
    answerId: String(kanji.id),
    explanation: `${photo.text}（${photo.textReading}）: ${photo.caption}`,
    storyHint: null,
    promptNote: photo.where,
    imageSrc: photo.file,
  }
}

const BUILDERS: Record<
  QuestionKind,
  (kanji: KanjiRecord, context: QuizContext) => QuizQuestion | null
> = {
  meaning: buildMeaningQuestion,
  kanji: buildKanjiQuestion,
  'reading-context': buildReadingContextQuestion,
  'reading-type': buildReadingTypeQuestion,
  sentence: buildSentenceQuestion,
  photo: buildPhotoQuestion,
}

/**
 * Crea una pregunta del tipo pedido, o `null` si faltan datos para ese tipo
 * (por ejemplo, un kanji sin frases escritas todavía).
 */
export function buildQuestion(
  kanji: KanjiRecord,
  kind: QuestionKind,
  context: QuizContext,
): QuizQuestion | null {
  return BUILDERS[kind](kanji, context)
}

/**
 * Preguntas de un kanji intentando los tipos pedidos y bajando de dificultad
 * cuando no hay material (así una partida nunca se queda vacía).
 */
function questionsForKanji(
  kanji: KanjiRecord,
  kinds: QuestionKind[],
  context: QuizContext,
): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  for (const kind of kinds) {
    const question = buildQuestion(kanji, kind, context)
    if (question) questions.push(question)
  }
  if (questions.length > 0) return questions

  const fallback =
    buildQuestion(kanji, 'meaning', context) ??
    buildQuestion(kanji, 'kanji', context)
  return fallback ? [fallback] : []
}

/**
 * Crea la ronda de preguntas de una partida.
 *
 * @param kanjis - Kanji que entran en la partida
 * @param context - Datos disponibles (kanji, vocabulario, frases, fotos)
 * @param kinds - Tipos de pregunta, normalmente los del nivel de dificultad
 * @returns Preguntas mezcladas
 */
export function buildQuiz(
  kanjis: KanjiRecord[],
  context: QuizContext,
  kinds: QuestionKind[] = TIERS[1].kinds,
): QuizQuestion[] {
  const questions = kanjis.flatMap((kanji) =>
    questionsForKanji(kanji, kinds, context),
  )
  return shuffle(questions)
}

/**
 * Ronda de repaso donde cada kanji se pregunta según su nivel de memoria: lo
 * reciente se reconoce y lo ya sabido se lee en contexto.
 *
 * @param items - Kanji con su nivel SRS
 * @param context - Datos disponibles
 * @returns Preguntas mezcladas
 */
export function buildAdaptiveQuiz(
  items: ReviewItem[],
  context: QuizContext,
): QuizQuestion[] {
  const questions = items.flatMap(({ kanji, srsLevel }) =>
    questionsForKanji(kanji, TIERS[reviewTier(srsLevel)].kinds, context),
  )
  return shuffle(questions)
}
