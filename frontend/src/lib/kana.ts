/**
 * Utilidades de kana compartidas: normalización katakana → hiragana y
 * detección de kanji, kana y marcadores de Kanjidic.
 */

const KATAKANA_START = 0x30a1
const KATAKANA_END = 0x30f6
const KATAKANA_TO_HIRAGANA_OFFSET = 0x60

export const SOKUON = 'っ'
export const CHOONPU = 'ー'

/** Marcadores de Kanjidic: `.` separa okurigana y `-` marca prefijos/sufijos. */
const READING_MARKERS = /[.\-·]/g

const KANJI_RANGES: readonly [number, number][] = [
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xf900, 0xfaff],
]

const HIRAGANA_START = 0x3041
const HIRAGANA_END = 0x309f

/**
 * Normaliza un carácter katakana a hiragana y deja el resto intacto.
 *
 * @param char - Carácter a normalizar
 * @returns Hiragana equivalente o el carácter original
 */
export function toHiraganaChar(char: string): string {
  const code = char.codePointAt(0)
  if (code != null && code >= KATAKANA_START && code <= KATAKANA_END) {
    return String.fromCodePoint(code - KATAKANA_TO_HIRAGANA_OFFSET)
  }
  // ッ está dentro del rango convertible, pero ヽヾ y otros signos no.
  if (char === 'ッ') return SOKUON
  return char
}

/**
 * Convierte una cadena kana mixta a hiragana.
 *
 * @param text - Texto con katakana y/o hiragana
 * @returns Texto en hiragana
 *
 * @example
 * toHiragana('ガク') // 'がく'
 */
export function toHiragana(text: string): string {
  return [...text].map(toHiraganaChar).join('')
}

/**
 * Indica si el carácter es un kanji (ideograma CJK).
 *
 * @param char - Carácter a comprobar
 */
export function isKanjiChar(char: string): boolean {
  const code = char.codePointAt(0)
  if (code == null) return false
  return KANJI_RANGES.some(([from, to]) => code >= from && code <= to)
}

/**
 * Indica si el carácter es kana (hiragana o katakana, incluido `ー`).
 *
 * @param char - Carácter a comprobar
 */
export function isKanaChar(char: string): boolean {
  if (char === CHOONPU) return true
  const code = char.codePointAt(0)
  if (code == null) return false
  if (code >= HIRAGANA_START && code <= HIRAGANA_END) return true
  return code >= KATAKANA_START && code <= KATAKANA_END
}

/**
 * Quita los marcadores de Kanjidic de una lectura.
 *
 * @param reading - Lectura del diccionario (p. ej. `ひと.つ`, `-び`)
 * @returns Lectura sin `.` ni `-`
 *
 * @example
 * stripReadingMarkers('ひと.つ') // 'ひとつ'
 */
export function stripReadingMarkers(reading: string): string {
  return reading.replace(READING_MARKERS, '')
}

/**
 * Devuelve la raíz de una lectura kun: la parte anterior al okurigana.
 *
 * @param reading - Lectura kun del diccionario (p. ej. `た.べる`)
 * @returns Raíz en hiragana (p. ej. `た`)
 */
export function readingStem(reading: string): string {
  const withoutDashes = reading.replace(/-/g, '')
  const [stem] = withoutDashes.split('.')
  return toHiragana(stem ?? '')
}

/**
 * Devuelve el okurigana de una lectura kun (lo que sigue al punto).
 *
 * @param reading - Lectura kun del diccionario (p. ej. `た.べる`)
 * @returns Okurigana en hiragana o cadena vacía
 */
export function readingOkurigana(reading: string): string {
  const withoutDashes = reading.replace(/-/g, '')
  const parts = withoutDashes.split('.')
  return parts.length > 1 ? toHiragana(parts.slice(1).join('')) : ''
}
