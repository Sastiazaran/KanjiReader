/**
 * Decide si un kanji usa su lectura *on* (china) o *kun* (japonesa) dentro de
 * una palabra concreta, y redacta la explicación que ve quien aprende.
 *
 * La regla general que enseñamos:
 *   - kanji solo o con hiragana pegado (okurigana) → lectura kun
 *   - dos o más kanji juntos (compuesto) → lectura on
 *   - y un puñado de palabras irregulares que hay que memorizar aparte
 */
import type { KanjiRecord } from '../types/data'
import {
  isKanaChar,
  isKanjiChar,
  readingOkurigana,
  readingStem,
  SOKUON,
  stripReadingMarkers,
  toHiragana,
} from './kana'

export type ReadingKind = 'on' | 'kun' | 'special' | 'unknown'

/** Forma de la palabra, que es lo que determina la lectura habitual. */
export type WordShape = 'alone' | 'okurigana' | 'compound' | 'mixed'

export interface ReadingAnalysis {
  kind: ReadingKind
  shape: WordShape
  /** Lectura del kanji objetivo dentro de esta palabra, en hiragana. */
  readingInWord: string | null
  /** Etiqueta corta para la interfaz (p. ej. `Lectura on`). */
  label: string
  /** Explicación en español de por qué se lee así. */
  why: string
}

/** Sonorización (rendaku): primera mora de la lectura al unirse a otra palabra. */
const RENDAKU: Readonly<Record<string, string>> = {
  か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご',
  さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ',
  た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど',
  は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ',
}

/** Semisonorización: 日本 → にっぽん, 一分 → いっぷん. */
const HANDAKU: Readonly<Record<string, string>> = {
  は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ',
}

/** Moras que se convierten en っ delante de consonante sorda. */
const SOKUON_TAILS = new Set(['つ', 'ち', 'く', 'き'])

/**
 * Palabras frecuentes cuya lectura no sigue la regla y conviene memorizar.
 * Clave: expresión + lectura completa en hiragana.
 */
const IRREGULAR_WORDS: Readonly<Record<string, string>> = {
  '日本|にほん': 'にほん no sigue la regla: 日 suena に solo en este nombre.',
  '日本|にっぽん': 'にっぽん es la variante enfática del nombre del país.',
  '今日|きょう': 'きょう se lee entre los dos kanji: no es ni on ni kun (jukujikun).',
  '明日|あした': 'あした se reparte entre los dos kanji, sin lectura propia para cada uno.',
  '昨日|きのう': 'きのう es una lectura antigua pegada a los dos kanji juntos.',
  '一人|ひとり': 'ひとり mezcla el kun ひと con una り especial para contar personas.',
  '二人|ふたり': 'ふたり usa el kun ふた y la り de contar personas.',
  '大人|おとな': 'おとな es una palabra antigua escrita con estos dos kanji.',
  '上手|じょうず': 'じょうず es una lectura fija de la pareja 上手 («ser bueno en algo»).',
  '下手|へた': 'へた es una lectura fija de la pareja 下手 («ser malo en algo»).',
  '一日|ついたち': 'ついたち es el nombre antiguo del día 1 del mes.',
  '二十日|はつか': 'はつか es el nombre antiguo del día 20 del mes.',
  '今年|ことし': 'ことし es una lectura fija para «este año».',
  '母さん|かあさん': 'かあさん es la forma cariñosa de «madre», con lectura propia.',
  '父さん|とうさん': 'とうさん es la forma cariñosa de «padre», con lectura propia.',
  '八百屋|やおや': 'やおや («verdulería») tiene una lectura fija muy antigua.',
  '果物|くだもの': 'くだもの se lee sobre los dos kanji juntos.',
  '眼鏡|めがね': 'めがね se lee sobre los dos kanji juntos.',
  '手伝う|てつだう': 'てつだう es irregular: 伝 aporta つ, no su lectura habitual.',
  '一昨日|おととい': 'おととい es una lectura fija para «anteayer».',
}

const LABELS: Readonly<Record<ReadingKind, string>> = {
  on: 'Lectura on (china)',
  kun: 'Lectura kun (japonesa)',
  special: 'Lectura especial',
  unknown: 'Lectura',
}

interface Candidate {
  kind: 'on' | 'kun'
  /** Raíz en hiragana con la que intentamos encajar la lectura. */
  stem: string
  okurigana: string
  /** Lectura tal como aparece en el diccionario. */
  dictionary: string
}

type Position = 'start' | 'end' | 'middle'

/**
 * Variantes con las que una lectura puede aparecer dentro de una palabra.
 *
 * La posición importa: el rendaku (小川 → おが**わ**) sonoriza el principio de
 * la segunda parte, y el sokuon (学校 → が**っ**こう) acorta el final de la
 * primera, así que cada cambio solo se permite donde ocurre de verdad.
 *
 * @param stem - Raíz en hiragana
 * @param position - Lugar que ocupa el kanji en la palabra
 * @returns Lista de variantes posibles, sin repetir
 */
function stemVariants(stem: string, position: Position): string[] {
  if (!stem) return []
  const variants = new Set<string>([stem])
  const first = stem[0]
  const rest = stem.slice(1)

  if (position !== 'start') {
    if (RENDAKU[first]) variants.add(RENDAKU[first] + rest)
    if (HANDAKU[first]) variants.add(HANDAKU[first] + rest)
  }

  const last = stem[stem.length - 1]
  if (position !== 'end' && SOKUON_TAILS.has(last) && stem.length > 1) {
    variants.add(stem.slice(0, -1) + SOKUON)
  }

  return [...variants]
}

/**
 * Describe la forma de la palabra, que es la pista principal de la lectura.
 *
 * @param expression - Palabra escrita (p. ej. `食べる`)
 * @returns Forma de la palabra
 *
 * @example
 * wordShape('山') // 'alone'
 * wordShape('食べる') // 'okurigana'
 * wordShape('学校') // 'compound'
 */
export function wordShape(expression: string): WordShape {
  const chars = [...expression]
  const kanjiCount = chars.filter(isKanjiChar).length
  const kanaCount = chars.filter(isKanaChar).length

  if (kanjiCount <= 1) return kanaCount > 0 ? 'okurigana' : 'alone'
  return kanaCount > 0 ? 'mixed' : 'compound'
}

/**
 * Lecturas candidatas del kanji, ordenadas de más larga a más corta para que
 * gane siempre la coincidencia más específica.
 */
function buildCandidates(kanji: KanjiRecord): Candidate[] {
  const kun: Candidate[] = kanji.kunyomi.map((reading) => ({
    kind: 'kun' as const,
    stem: readingStem(reading),
    okurigana: readingOkurigana(reading),
    dictionary: reading,
  }))

  const on: Candidate[] = kanji.onyomi.map((reading) => ({
    kind: 'on' as const,
    stem: toHiragana(stripReadingMarkers(reading)),
    okurigana: '',
    dictionary: reading,
  }))

  return [...kun, ...on]
    .filter((candidate) => candidate.stem.length > 0)
    .sort((a, b) => b.stem.length - a.stem.length)
}

interface Match {
  candidate: Candidate
  matched: string
  score: number
}

/**
 * Comprueba si una variante encaja en la posición que ocupa el kanji dentro de
 * la palabra: al principio como prefijo, al final como sufijo y en medio libre.
 */
function positionMatch(
  reading: string,
  variant: string,
  position: Position,
): boolean {
  if (!variant) return false
  if (position === 'start') return reading.startsWith(variant)
  if (position === 'end') return reading.endsWith(variant)
  return reading.includes(variant)
}

function findMatch(
  candidates: Candidate[],
  reading: string,
  position: Position,
  expectedKind: 'on' | 'kun',
  trailingKana: string,
): Match | null {
  let best: Match | null = null

  for (const candidate of candidates) {
    for (const variant of stemVariants(candidate.stem, position)) {
      if (!positionMatch(reading, variant, position)) continue

      // Premiamos la lectura esperada por la forma de la palabra y el okurigana
      // que realmente aparece escrito (食べる encaja con た.べる, no con く.う).
      let score = variant.length * 10
      if (candidate.kind === expectedKind) score += 5
      if (candidate.okurigana && trailingKana.startsWith(candidate.okurigana)) {
        score += 8
      } else if (candidate.okurigana && trailingKana) {
        score -= 4
      }

      if (!best || score > best.score) {
        best = { candidate, matched: variant, score }
      }
    }
  }

  return best
}

/** Kana que sigue al kanji objetivo dentro de la palabra (okurigana escrito). */
function trailingKanaAfter(expression: string, index: number): string {
  const chars = [...expression]
  let out = ''
  for (let i = index + 1; i < chars.length; i += 1) {
    if (!isKanaChar(chars[i])) break
    out += chars[i]
  }
  return toHiragana(out)
}

function explain(
  kind: 'on' | 'kun',
  shape: WordShape,
  literal: string,
  expression: string,
  matched: string,
  trailingKana: string,
): string {
  if (kind === 'kun') {
    if (shape === 'alone') {
      return `Kun: ${literal} va sola como palabra, así que suena «${matched}».`
    }
    if (shape === 'okurigana') {
      return `Kun: ${literal} lleva hiragana pegado (${trailingKana || 'okurigana'}), así que suena «${matched}».`
    }
    return `Kun: en ${expression} el kanji ${literal} mantiene su lectura japonesa «${matched}».`
  }

  if (shape === 'compound') {
    return `On: ${expression} junta kanji sin hiragana, así que ${literal} usa su lectura china «${matched}».`
  }
  if (shape === 'alone') {
    return `On: ${literal} va sola pero se lee «${matched}»; es una palabra tomada del chino.`
  }
  return `On: en ${expression} el kanji ${literal} usa su lectura china «${matched}».`
}

/**
 * Analiza qué lectura usa un kanji dentro de una palabra y por qué.
 *
 * @param kanji - Kanji objetivo
 * @param expression - Palabra escrita (p. ej. `学校`)
 * @param reading - Lectura completa de la palabra en kana (p. ej. `がっこう`)
 * @returns Análisis con tipo de lectura, forma de la palabra y explicación
 *
 * @example
 * analyzeReading(gaku, '学校', 'がっこう').kind // 'on'
 * analyzeReading(yama, '山', 'やま').kind // 'kun'
 */
export function analyzeReading(
  kanji: KanjiRecord,
  expression: string,
  reading: string | null,
): ReadingAnalysis {
  const shape = wordShape(expression)
  const hiragana = reading ? toHiragana(reading.replace(/\s+/g, '')) : ''

  if (!hiragana) {
    return {
      kind: 'unknown',
      shape,
      readingInWord: null,
      label: LABELS.unknown,
      why: `Todavía no sabemos cómo suena ${kanji.kanji} en ${expression}.`,
    }
  }

  const irregular = IRREGULAR_WORDS[`${expression}|${hiragana}`]
  if (irregular) {
    return {
      kind: 'special',
      shape,
      readingInWord: null,
      label: LABELS.special,
      why: `Excepción: ${irregular}`,
    }
  }

  const chars = [...expression]
  const index = chars.indexOf(kanji.kanji)
  if (index < 0) {
    return {
      kind: 'unknown',
      shape,
      readingInWord: null,
      label: LABELS.unknown,
      why: `${kanji.kanji} no aparece en ${expression}.`,
    }
  }

  const trailingKana = trailingKanaAfter(expression, index)
  const isLastKanji = !chars.slice(index + 1).some(isKanjiChar)
  const position: Position =
    index === 0 ? 'start' : isLastKanji && !trailingKana ? 'end' : 'middle'
  const expectedKind: 'on' | 'kun' =
    shape === 'compound' ? 'on' : shape === 'mixed' ? 'on' : 'kun'

  const match = findMatch(
    buildCandidates(kanji),
    hiragana,
    position,
    expectedKind,
    trailingKana,
  )

  if (!match) {
    return {
      kind: 'unknown',
      shape,
      readingInWord: null,
      label: LABELS.unknown,
      why: `${expression} se lee «${hiragana}»: es una lectura fuera de lo habitual, mejor aprenderla como palabra entera.`,
    }
  }

  const { candidate, matched } = match
  return {
    kind: candidate.kind,
    shape,
    readingInWord: matched,
    label: LABELS[candidate.kind],
    why: explain(
      candidate.kind,
      shape,
      kanji.kanji,
      expression,
      matched,
      trailingKana,
    ),
  }
}

/** Regla general que mostramos en las fichas, sin depender de una palabra. */
export const READING_RULES = [
  {
    kind: 'kun' as const,
    title: 'Kanji solo o con hiragana → kun',
    detail:
      'Si el kanji forma la palabra por sí mismo (山 = やま) o lleva hiragana pegado (食べる = たべる), usa su lectura japonesa.',
  },
  {
    kind: 'on' as const,
    title: 'Dos kanji juntos → on',
    detail:
      'Cuando varios kanji se pegan sin hiragana (学校 = がっこう), casi siempre suenan con su lectura china.',
  },
  {
    kind: 'special' as const,
    title: 'Palabras con lectura propia',
    detail:
      'Unas pocas palabras muy usadas (今日 = きょう, 一人 = ひとり) no siguen la regla: se aprenden enteras.',
  },
]
