/**
 * Notación compacta para escribir japonés con furigana en el contenido propio.
 *
 * Reglas:
 *   - los tokens se separan con espacios (el espacio no llega al resultado)
 *   - `漢字:よみ` añade la lectura del token (siempre un bloque de kanji)
 *   - `*` delante del token marca la palabra que se está estudiando
 *
 * @example
 * parseJapanese('*山:やま に のぼる。')
 * // [{ surface: '山', reading: 'やま', isTarget: true }, { surface: 'に' }, ...]
 */

const KANJI_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/

/**
 * Convierte la notación compacta en tokens listos para pintar furigana.
 *
 * @param {string} text - Frase en notación compacta
 * @returns {{surface: string, reading?: string, isTarget?: boolean}[]} Tokens
 */
export function parseJapanese(text) {
  const tokens = []

  for (const raw of text.trim().split(/\s+/)) {
    if (!raw) continue

    const isTarget = raw.startsWith('*')
    const body = isTarget ? raw.slice(1) : raw
    const [surface, reading] = body.split(':')

    if (!surface) continue
    if (reading && ![...surface].some((char) => KANJI_RE.test(char))) {
      throw new Error(`Lectura sobre texto sin kanji: «${raw}»`)
    }

    const token = { surface }
    if (reading) token.reading = reading
    if (isTarget) token.isTarget = true
    tokens.push(token)
  }

  return tokens
}

/**
 * Texto plano de una lista de tokens.
 *
 * @param {{surface: string}[]} tokens - Tokens de una frase
 * @returns {string} Frase sin marcas ni espacios
 */
export function tokensToText(tokens) {
  return tokens.map((token) => token.surface).join('')
}

/**
 * Kanji distintos que aparecen en una lista de tokens.
 *
 * @param {{surface: string}[]} tokens - Tokens de una frase
 * @returns {string[]} Kanji encontrados, sin repetir
 */
export function kanjiInTokens(tokens) {
  const found = new Set()
  for (const char of tokensToText(tokens)) {
    if (KANJI_RE.test(char)) found.add(char)
  }
  return [...found]
}

/**
 * Palabra y lectura que explican la pronunciación del kanji estudiado.
 * Por defecto es el token marcado con `*`; `focus` permite dar la palabra
 * completa cuando el kanji lleva okurigana (p. ej. `食べる|たべる`).
 *
 * @param {{surface: string, reading?: string, isTarget?: boolean}[]} tokens - Tokens
 * @param {string} [focus] - Palabra completa en formato `palabra|lectura`
 * @returns {{word: string, reading: string}} Palabra estudiada
 */
export function resolveFocus(tokens, focus) {
  if (focus) {
    const [word, reading] = focus.split('|')
    if (!word || !reading) {
      throw new Error(`Foco mal escrito: «${focus}» (usa palabra|lectura)`)
    }
    return { word, reading }
  }

  const target = tokens.find((token) => token.isTarget)
  if (!target?.reading) {
    throw new Error('Falta el token con * y su lectura, o un foco explícito')
  }
  return { word: target.surface, reading: target.reading }
}
