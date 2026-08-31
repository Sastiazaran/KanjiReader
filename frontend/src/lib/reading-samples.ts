/**
 * Reúne palabras reales de un kanji y las clasifica en on / kun / excepción,
 * que es lo que hace falta para enseñar *cuándo* usar cada lectura.
 */
import type { KanjiRecord, SentenceRecord, VocabRecord } from '../types/data'
import { analyzeReading, type ReadingAnalysis, type ReadingKind } from './reading-type'

export interface ReadingSample {
  word: string
  reading: string
  /** Traducción o glosa de la palabra, si la hay. */
  gloss: string | null
  /** Frase donde aparece, cuando viene de nuestro contenido propio. */
  sentenceId: string | null
  analysis: ReadingAnalysis
}

/** Orden en el que se muestran los ejemplos: primero lo más intuitivo. */
const KIND_ORDER: ReadingKind[] = ['kun', 'on', 'special']

function collect(
  kanji: KanjiRecord,
  vocab: VocabRecord[],
  sentences: SentenceRecord[],
): ReadingSample[] {
  const samples: ReadingSample[] = []

  for (const sentence of sentences) {
    samples.push({
      word: sentence.focus.word,
      reading: sentence.focus.reading,
      gloss: sentence.es,
      sentenceId: sentence.id,
      analysis: analyzeReading(kanji, sentence.focus.word, sentence.focus.reading),
    })
  }

  for (const word of vocab) {
    if (!word.reading) continue
    samples.push({
      word: word.expression,
      reading: word.reading,
      gloss: word.glossary || null,
      sentenceId: null,
      analysis: analyzeReading(kanji, word.expression, word.reading),
    })
  }

  const unique = new Map<string, ReadingSample>()
  for (const sample of samples) {
    if (sample.analysis.kind === 'unknown') continue
    if (!unique.has(sample.word)) unique.set(sample.word, sample)
  }
  return [...unique.values()]
}

/**
 * Ejemplos de lectura de un kanji, empezando por una palabra de cada tipo para
 * que se vea el contraste on/kun de un vistazo.
 *
 * @param kanji - Kanji estudiado
 * @param vocab - Vocabulario de Kanji alive para ese kanji
 * @param sentences - Frases propias para ese kanji
 * @param limit - Máximo de ejemplos a devolver
 * @returns Ejemplos ordenados: kun, on, excepción y luego el resto
 */
export function readingSamples(
  kanji: KanjiRecord,
  vocab: VocabRecord[],
  sentences: SentenceRecord[],
  limit = 3,
): ReadingSample[] {
  const all = collect(kanji, vocab, sentences)
  const picked: ReadingSample[] = []

  for (const kind of KIND_ORDER) {
    const match = all.find((sample) => sample.analysis.kind === kind)
    if (match) picked.push(match)
  }

  for (const sample of all) {
    if (picked.length >= limit) break
    if (!picked.includes(sample)) picked.push(sample)
  }

  return picked.slice(0, limit)
}

/** Indica si el kanji tiene ejemplos de los dos tipos de lectura. */
export function hasBothReadings(samples: ReadingSample[]): boolean {
  const kinds = new Set(samples.map((sample) => sample.analysis.kind))
  return kinds.has('on') && kinds.has('kun')
}
