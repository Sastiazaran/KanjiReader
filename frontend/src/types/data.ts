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
