import { describe, expect, it } from 'vitest'
import { analyzeReading, wordShape } from './reading-type'
import type { KanjiRecord } from '../types/data'

function kanji(
  literal: string,
  onyomi: string[],
  kunyomi: string[],
  keyword = literal,
): KanjiRecord {
  return {
    id: literal.codePointAt(0)!,
    kanji: literal,
    meaning: keyword,
    meaningEn: keyword,
    keyword,
    onyomi,
    kunyomi,
    strokes: 1,
    grade: 1,
    frequency: 1,
    jlpt: 'N5',
    components: [],
    componentParts: [],
    story: '',
    radical: null,
    radicalMeaning: null,
    hasMedia: false,
  }
}

const GAKU = kanji('学', ['ガク'], ['まな.ぶ'], 'estudio')
const KOU = kanji('校', ['コウ', 'キョウ'], [], 'escuela')
const YAMA = kanji('山', ['サン', 'セン'], ['やま'], 'montaña')
const SHOKU = kanji('食', ['ショク', 'ジキ'], ['く.う', 'た.べる'], 'alimento')
const HI = kanji('日', ['ニチ', 'ジツ'], ['ひ', '-び'], 'día')
const KAWA = kanji('川', ['セン'], ['かわ'], 'río')

describe('wordShape', () => {
  it('reconoce un kanji solo', () => {
    expect(wordShape('山')).toBe('alone')
  })

  it('reconoce okurigana', () => {
    expect(wordShape('食べる')).toBe('okurigana')
  })

  it('reconoce un compuesto de kanji', () => {
    expect(wordShape('学校')).toBe('compound')
  })

  it('reconoce una mezcla de compuesto y kana', () => {
    expect(wordShape('勉強する')).toBe('mixed')
  })
})

describe('analyzeReading', () => {
  it('un kanji solo usa la lectura kun', () => {
    const result = analyzeReading(YAMA, '山', 'やま')
    expect(result.kind).toBe('kun')
    expect(result.readingInWord).toBe('やま')
    expect(result.why).toContain('Kun')
  })

  it('con okurigana elige la raíz kun que encaja con el hiragana escrito', () => {
    const result = analyzeReading(SHOKU, '食べる', 'たべる')
    expect(result.kind).toBe('kun')
    expect(result.readingInWord).toBe('た')
  })

  it('un compuesto usa la lectura on', () => {
    const result = analyzeReading(SHOKU, '食事', 'しょくじ')
    expect(result.kind).toBe('on')
    expect(result.readingInWord).toBe('しょく')
  })

  it('resuelve el sokuon de がっこう', () => {
    const result = analyzeReading(GAKU, '学校', 'がっこう')
    expect(result.kind).toBe('on')
    expect(result.readingInWord).toBe('がっ')
  })

  it('encuentra la lectura on al final de la palabra', () => {
    const result = analyzeReading(KOU, '学校', 'がっこう')
    expect(result.kind).toBe('on')
    expect(result.readingInWord).toBe('こう')
  })

  it('acepta la sonorización rendaku', () => {
    const result = analyzeReading(KAWA, '小川', 'おがわ')
    expect(result.kind).toBe('kun')
    expect(result.readingInWord).toBe('がわ')
  })

  it('marca como excepción las palabras irregulares conocidas', () => {
    const result = analyzeReading(HI, '日本', 'にほん')
    expect(result.kind).toBe('special')
    expect(result.why).toContain('Excepción')
  })

  it('avisa cuando no reconoce la lectura en vez de inventarla', () => {
    const result = analyzeReading(YAMA, '山', 'ぜんぜん')
    expect(result.kind).toBe('unknown')
    expect(result.readingInWord).toBeNull()
  })

  it('no analiza palabras donde el kanji no aparece', () => {
    expect(analyzeReading(YAMA, '学校', 'がっこう').kind).toBe('unknown')
  })
})
