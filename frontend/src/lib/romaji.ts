/**
 * Conversión mínima kana → romaji (Hepburn) para lecturas on/kun de kanji.
 * Preserva marcadores Kanjidic: `-` (formas combinadas) y `.` (okurigana).
 */

const KATAKANA_START = 0x30a1
const KATAKANA_END = 0x30f6
const KATAKANA_TO_HIRAGANA_OFFSET = 0x60

const CHOONPU = 'ー'
const SOKUON = 'っ'

/** Separador visual entre lecturas en la UI (kana y romaji). */
export const READING_SEPARATOR = '・'

/** Máximo de lecturas on/kun mostradas en las tarjetas. */
export const MAX_DISPLAYED_READINGS = 3

/** Moraas básicas y digrafos (youon) en hiragana → Hepburn. */
const MORA_TO_ROMAJI: Readonly<Record<string, string>> = {
  あ: 'a',
  い: 'i',
  う: 'u',
  え: 'e',
  お: 'o',
  か: 'ka',
  き: 'ki',
  く: 'ku',
  け: 'ke',
  こ: 'ko',
  が: 'ga',
  ぎ: 'gi',
  ぐ: 'gu',
  げ: 'ge',
  ご: 'go',
  さ: 'sa',
  し: 'shi',
  す: 'su',
  せ: 'se',
  そ: 'so',
  ざ: 'za',
  じ: 'ji',
  ず: 'zu',
  ぜ: 'ze',
  ぞ: 'zo',
  た: 'ta',
  ち: 'chi',
  つ: 'tsu',
  て: 'te',
  と: 'to',
  だ: 'da',
  ぢ: 'ji',
  づ: 'zu',
  で: 'de',
  ど: 'do',
  な: 'na',
  に: 'ni',
  ぬ: 'nu',
  ね: 'ne',
  の: 'no',
  は: 'ha',
  ひ: 'hi',
  ふ: 'fu',
  へ: 'he',
  ほ: 'ho',
  ば: 'ba',
  び: 'bi',
  ぶ: 'bu',
  べ: 'be',
  ぼ: 'bo',
  ぱ: 'pa',
  ぴ: 'pi',
  ぷ: 'pu',
  ぺ: 'pe',
  ぽ: 'po',
  ま: 'ma',
  み: 'mi',
  む: 'mu',
  め: 'me',
  も: 'mo',
  や: 'ya',
  ゆ: 'yu',
  よ: 'yo',
  ら: 'ra',
  り: 'ri',
  る: 'ru',
  れ: 're',
  ろ: 'ro',
  わ: 'wa',
  ゐ: 'wi',
  ゑ: 'we',
  を: 'wo',
  ん: 'n',
  ぁ: 'a',
  ぃ: 'i',
  ぅ: 'u',
  ぇ: 'e',
  ぉ: 'o',
  ゃ: 'ya',
  ゅ: 'yu',
  ょ: 'yo',
  ゎ: 'wa',
  ゔ: 'vu',
  きゃ: 'kya',
  きゅ: 'kyu',
  きょ: 'kyo',
  しゃ: 'sha',
  しゅ: 'shu',
  しょ: 'sho',
  ちゃ: 'cha',
  ちゅ: 'chu',
  ちょ: 'cho',
  にゃ: 'nya',
  にゅ: 'nyu',
  にょ: 'nyo',
  ひゃ: 'hya',
  ひゅ: 'hyu',
  ひょ: 'hyo',
  みゃ: 'mya',
  みゅ: 'myu',
  みょ: 'myo',
  りゃ: 'rya',
  りゅ: 'ryu',
  りょ: 'ryo',
  ぎゃ: 'gya',
  ぎゅ: 'gyu',
  ぎょ: 'gyo',
  じゃ: 'ja',
  じゅ: 'ju',
  じょ: 'jo',
  びゃ: 'bya',
  びゅ: 'byu',
  びょ: 'byo',
  ぴゃ: 'pya',
  ぴゅ: 'pyu',
  ぴょ: 'pyo',
  ぢゃ: 'ja',
  ぢゅ: 'ju',
  ぢょ: 'jo',
}

const VOWEL_BY_ROMAJI_END: Readonly<Record<string, string>> = {
  a: 'a',
  i: 'i',
  u: 'u',
  e: 'e',
  o: 'o',
}

/**
 * Normaliza un carácter katakana a hiragana (deja el resto intacto).
 *
 * @param char - Carácter a normalizar
 * @returns Hiragana equivalente o el carácter original
 */
function toHiraganaChar(char: string): string {
  const code = char.codePointAt(0)
  if (
    code != null &&
    code >= KATAKANA_START &&
    code <= KATAKANA_END
  ) {
    return String.fromCodePoint(code - KATAKANA_TO_HIRAGANA_OFFSET)
  }
  // ッ (small tsu katakana) está en el rango; ヵ/ヶ también.
  if (char === 'ッ') return SOKUON
  return char
}

/**
 * Devuelve la siguiente mora romaji a partir de `i`, saltando `.` / `-` solo
 * para resolver sokuon (っ) delante de okurigana (p. ej. みっ.つ → mit.tsu).
 */
function peekNextRomaji(chars: string[], from: number): string | null {
  let i = from
  while (i < chars.length && (chars[i] === '.' || chars[i] === '-')) {
    i += 1
  }
  if (i >= chars.length) return null

  const two = chars[i] + (chars[i + 1] ?? '')
  if (MORA_TO_ROMAJI[two]) return MORA_TO_ROMAJI[two]
  return MORA_TO_ROMAJI[chars[i]] ?? null
}

/**
 * Consonante a duplicar para sokuon Hepburn (shi→t, chi→t, tsu→t).
 *
 * @param romaji - Romaji de la mora siguiente
 * @returns Consonante(s) a anteponer
 */
function sokuonConsonant(romaji: string): string {
  if (romaji.startsWith('ch')) return 't'
  if (romaji.startsWith('shi') || romaji.startsWith('tsu')) return 't'
  const first = romaji[0]
  return first && /[bcdfghjklmnpqrstvwxyz]/i.test(first) ? first : ''
}

/** Inserta `n'` antes de vocal/y cuando el romaji previo termina en `n` de ん. */
function needsNApostrophe(previous: string, mora: string): boolean {
  if (!previous.endsWith('n')) return false
  return /^[aiueoy]/.test(mora)
}

/**
 * Convierte una lectura en kana (hiragana/katakana) a romaji Hepburn.
 * Conserva `-` y `.` de Kanjidic; deja sin cambiar caracteres no kana.
 *
 * @param reading - Lectura on/kun (p. ej. `ジン`, `-り`, `ひと.つ`)
 * @returns Romaji en minúsculas (p. ej. `jin`, `-ri`, `hito.tsu`)
 *
 * @example
 * kanaToRomaji('ジン') // 'jin'
 * kanaToRomaji('-り') // '-ri'
 * kanaToRomaji('ひと.つ') // 'hito.tsu'
 */
export function kanaToRomaji(reading: string): string {
  if (!reading) return ''

  const chars = [...reading].map(toHiraganaChar)
  let out = ''
  let i = 0

  while (i < chars.length) {
    const ch = chars[i]

    if (ch === '.' || ch === '-') {
      out += ch
      i += 1
      continue
    }

    if (ch === CHOONPU || ch === 'ｰ') {
      const lastVowel = [...out].reverse().find((c) => VOWEL_BY_ROMAJI_END[c])
      out += lastVowel ?? ''
      i += 1
      continue
    }

    if (ch === SOKUON) {
      const next = peekNextRomaji(chars, i + 1)
      if (next) out += sokuonConsonant(next)
      i += 1
      continue
    }

    const two = ch + (chars[i + 1] ?? '')
    if (MORA_TO_ROMAJI[two]) {
      const mora = MORA_TO_ROMAJI[two]
      // ん + vocal / y → n' (evitar ambigüedad: しんあ → shin'a)
      out += needsNApostrophe(out, mora) ? `'${mora}` : mora
      i += 2
      continue
    }

    if (MORA_TO_ROMAJI[ch]) {
      const mora = MORA_TO_ROMAJI[ch]
      out += needsNApostrophe(out, mora) ? `'${mora}` : mora
      i += 1
      continue
    }

    out += ch
    i += 1
  }

  return out
}

/**
 * Formatea varias lecturas a una línea de romaji unida por {@link READING_SEPARATOR}.
 *
 * @param readings - Lecturas en kana
 * @returns Cadena romaji o cadena vacía si no hay lecturas
 */
export function readingsToRomajiLine(readings: string[]): string {
  if (!readings.length) return ''
  return readings.map(kanaToRomaji).join(READING_SEPARATOR)
}
