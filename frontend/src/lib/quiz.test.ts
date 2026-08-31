import { describe, expect, it } from 'vitest'
import {
  buildAdaptiveQuiz,
  buildQuestion,
  buildQuiz,
  type QuizContext,
} from './quiz'
import { MASTERED_LEVEL } from './srs'
import type {
  KanjiRecord,
  PhotoRecord,
  SentenceRecord,
  VocabRecord,
} from '../types/data'

function makeKanji(
  literal: string,
  keyword: string,
  onyomi: string[],
  kunyomi: string[],
): KanjiRecord {
  return {
    id: literal.codePointAt(0)!,
    kanji: literal,
    meaning: keyword,
    meaningEn: keyword,
    keyword,
    onyomi,
    kunyomi,
    strokes: 4,
    grade: 1,
    frequency: 100,
    jlpt: 'N5',
    components: [],
    componentParts: [],
    story: `Historia de ${literal}`,
    radical: null,
    radicalMeaning: null,
    hasMedia: false,
  }
}

const YAMA = makeKanji('山', 'montaña', ['サン'], ['やま'])
const POOL = [
  YAMA,
  makeKanji('川', 'río', ['セン'], ['かわ']),
  makeKanji('田', 'campo', ['デン'], ['た']),
  makeKanji('木', 'árbol', ['モク'], ['き']),
  makeKanji('石', 'piedra', ['セキ'], ['いし']),
]

const sentence: SentenceRecord = {
  id: 's-yama-1',
  kanjiId: YAMA.id,
  tokens: [
    { surface: '山', reading: 'やま', isTarget: true },
    { surface: 'に' },
    { surface: 'のぼる。' },
  ],
  focus: { word: '山', reading: 'やま' },
  es: 'Subir a la montaña.',
  tier: 1,
}

const vocab: VocabRecord = {
  id: 1,
  kanjiId: YAMA.id,
  kanjiLiteral: '山',
  expression: '火山',
  reading: 'かざん',
  glossary: 'volcano',
}

const photo: PhotoRecord = {
  id: 'p-yama',
  file: '/photos/yama.jpg',
  kanjiIds: [YAMA.id],
  focus: '山',
  text: '山',
  textReading: 'やま',
  where: 'Sendero',
  caption: 'Cartel de montaña.',
  credit: {
    author: 'Alguien',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  },
}

const fullContext: QuizContext = {
  pool: POOL,
  vocabByKanjiId: new Map([[YAMA.id, [vocab]]]),
  sentencesByKanjiId: new Map([[YAMA.id, [sentence]]]),
  photosByKanjiId: new Map([[YAMA.id, [photo]]]),
}

const bareContext: QuizContext = {
  pool: POOL,
  vocabByKanjiId: new Map(),
  sentencesByKanjiId: new Map(),
  photosByKanjiId: new Map(),
}

describe('preguntas de significado y escritura', () => {
  it('la pregunta de significado ofrece cuatro opciones', () => {
    const question = buildQuestion(YAMA, 'meaning', fullContext)!
    expect(question.prompt).toBe('山')
    expect(question.options).toHaveLength(4)
    expect(question.answerId).toBe(String(YAMA.id))
  })

  it('la pregunta de escritura parte de la palabra en español', () => {
    const question = buildQuestion(YAMA, 'kanji', fullContext)!
    expect(question.prompt).toBe('montaña')
    expect(question.promptIsJapanese).toBe(false)
    const answer = question.options.find((o) => o.id === question.answerId)
    expect(answer?.label).toBe('山')
  })
})

describe('preguntas de lectura', () => {
  it('pregunta la lectura dentro de una palabra concreta', () => {
    const question = buildQuestion(YAMA, 'reading-context', fullContext)!
    expect(['山', '火山']).toContain(question.prompt)
    expect(question.options.map((o) => o.id)).toContain(question.answerId)
    expect(question.explanation).toMatch(/Kun|On/)
  })

  it('nunca ofrece la respuesta repetida entre las opciones', () => {
    const question = buildQuestion(YAMA, 'reading-context', fullContext)!
    const ids = question.options.map((option) => option.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('pregunta si la palabra usa on o kun', () => {
    const question = buildQuestion(YAMA, 'reading-type', fullContext)!
    expect(question.options.map((o) => o.id).sort()).toEqual(['kun', 'on'])
    expect(['on', 'kun']).toContain(question.answerId)
  })

  it('sin palabras con lectura no se puede preguntar la lectura', () => {
    expect(buildQuestion(YAMA, 'reading-context', bareContext)).toBeNull()
    expect(buildQuestion(YAMA, 'reading-type', bareContext)).toBeNull()
  })
})

describe('preguntas de frase', () => {
  it('tapa el kanji en la frase y da la traducción como pista', () => {
    const question = buildQuestion(YAMA, 'sentence', fullContext)!
    const shown = question.promptTokens!.map((token) => token.surface).join('')
    expect(shown).not.toContain('山')
    expect(shown).toContain('◯')
    expect(question.promptNote).toBe('Subir a la montaña.')
  })

  it('la explicación incluye la frase completa', () => {
    const question = buildQuestion(YAMA, 'sentence', fullContext)!
    expect(question.explanation).toContain('山にのぼる。')
  })

  it('sin frases escritas no hay pregunta de frase', () => {
    expect(buildQuestion(YAMA, 'sentence', bareContext)).toBeNull()
  })
})

describe('preguntas de foto', () => {
  it('usa la imagen como enunciado', () => {
    const question = buildQuestion(YAMA, 'photo', fullContext)!
    expect(question.imageSrc).toBe('/photos/yama.jpg')
    expect(question.answerId).toBe(String(YAMA.id))
  })

  it('sin fotos no hay pregunta de foto', () => {
    expect(buildQuestion(YAMA, 'photo', bareContext)).toBeNull()
  })
})

describe('buildQuiz', () => {
  it('crea una pregunta por kanji y tipo pedido', () => {
    const questions = buildQuiz([YAMA], fullContext, ['meaning', 'kanji'])
    expect(questions).toHaveLength(2)
    expect(new Set(questions.map((q) => q.kind))).toEqual(
      new Set(['meaning', 'kanji']),
    )
  })

  it('baja de dificultad si falta material en vez de quedarse vacío', () => {
    const questions = buildQuiz([YAMA], bareContext, ['sentence', 'photo'])
    expect(questions).toHaveLength(1)
    expect(questions[0].kind).toBe('meaning')
  })

  it('todas las preguntas apuntan a un kanji de la partida', () => {
    const questions = buildQuiz(POOL, fullContext, ['meaning'])
    const ids = new Set(POOL.map((kanji) => kanji.id))
    for (const question of questions) expect(ids.has(question.kanjiId)).toBe(true)
  })
})

describe('buildAdaptiveQuiz', () => {
  it('lo recién visto se pregunta con reconocimiento', () => {
    const questions = buildAdaptiveQuiz(
      [{ kanji: YAMA, srsLevel: 0 }],
      fullContext,
    )
    for (const question of questions) {
      expect(['meaning', 'kanji']).toContain(question.kind)
    }
  })

  it('lo dominado se pregunta con frases y tipo de lectura', () => {
    const questions = buildAdaptiveQuiz(
      [{ kanji: YAMA, srsLevel: MASTERED_LEVEL }],
      fullContext,
    )
    const kinds = questions.map((question) => question.kind)
    expect(kinds).toContain('sentence')
    expect(kinds).toContain('reading-type')
  })
})
