export type JlptLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'

export type WorldTheme =
  | 'sakura'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'grape'
  | 'gold'
  | 'ember'

export interface StoryPart {
  char: string
  name: string
}

export interface KanjiRecord {
  id: number
  kanji: string
  /** Significados en español (o inglés si no hay traducción). */
  meaning: string
  meaningEn: string
  /** Significado corto usado en el juego. */
  keyword: string
  onyomi: string[]
  kunyomi: string[]
  strokes: number
  /** Curso escolar japonés: 1-6 primaria, 8 secundaria. */
  grade: number | null
  /** Puesto en la lista de kanji más usados (1 = el más frecuente). */
  frequency: number | null
  jlpt: JlptLevel | null
  components: string[]
  componentParts: StoryPart[]
  story: string
  radical: string | null
  radicalMeaning: string | null
  hasMedia: boolean
}

export interface VocabRecord {
  id: number
  kanjiId: number
  kanjiLiteral: string
  expression: string
  reading: string | null
  glossary: string
}

/** Trozo de texto japonés con su lectura, para pintar furigana. */
export interface JapaneseToken {
  surface: string
  /** Lectura en kana del trozo; solo cuando lleva kanji. */
  reading?: string
  /** Marca la palabra que contiene el kanji que se está estudiando. */
  isTarget?: boolean
}

/** Palabra concreta donde aparece el kanji, base de la explicación on/kun. */
export interface SentenceFocus {
  word: string
  reading: string
}

/** Frase de ejemplo escrita para este proyecto, con el kanji en contexto. */
export interface SentenceRecord {
  id: string
  kanjiId: number
  tokens: JapaneseToken[]
  focus: SentenceFocus
  /** Traducción al español. */
  es: string
  /** Dificultad orientativa (1 = frase mínima, 4 = frase larga). */
  tier: number
}

export interface MediaCredit {
  author: string
  license: string
  licenseUrl: string
  sourceUrl: string
}

/** Foto real de Japón donde se puede leer un kanji en su uso cotidiano. */
export interface PhotoRecord {
  id: string
  /** Ruta del archivo dentro de `public/photos`. */
  file: string
  kanjiIds: number[]
  /** Kanji protagonista del cartel. */
  focus: string
  /** Texto japonés visible en la foto. */
  text: string
  /** Lectura del texto visible, en kana. */
  textReading: string
  /** Dónde se hizo la foto, en español. */
  where: string
  /** Qué está leyendo quien mira la foto, en español. */
  caption: string
  credit: MediaCredit
}

export interface StoryPage {
  tokens: JapaneseToken[]
  /** Traducción al español de la página. */
  es: string
  /** Ilustración original dentro de `public/stories`. */
  illustration: string
}

/** Cuento corto original, escrito solo con kanji ya vistos. */
export interface StoryRecord {
  id: string
  worldId: string
  title: string
  titleEs: string
  summary: string
  /** Etapas superadas del mundo que hacen falta para abrirlo. */
  minStagesCleared: number
  tier: number
  kanjiIds: number[]
  pages: StoryPage[]
}

export interface MediaEntry {
  kname: string
  audioPattern: string
  videoFile: string
}

export type MediaMap = Record<string, MediaEntry>

export interface Stage {
  id: string
  index: number
  worldId: string
  kanjiIds: number[]
  title: string
}

export interface World {
  id: string
  order: number
  name: string
  subtitle: string
  theme: WorldTheme
  kanjiCount: number
  stages: Stage[]
}
