/**
 * Comprueba el contenido escrito a mano (`content/*.mjs` → `public/data/*.json`).
 *
 * Lo importante: si una lectura está mal escrita, el analizador on/kun no la
 * reconoce y la app enseñaría una explicación falsa. Aquí se detecta antes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { analyzeReading } from './reading-type'
import { isKanjiChar } from './kana'
import type {
  KanjiRecord,
  PhotoRecord,
  SentenceRecord,
  StoryRecord,
} from '../types/data'

const DATA_DIR = path.join(process.cwd(), 'public/data')

function readData<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8')) as T
}

const kanjis = readData<KanjiRecord[]>('kanjis.json')
const sentences = readData<SentenceRecord[]>('sentences.json')
const stories = readData<StoryRecord[]>('stories.json')
const photos = readData<PhotoRecord[]>('photos.json')

const byId = new Map(kanjis.map((kanji) => [kanji.id, kanji]))
const byLiteral = new Map(kanjis.map((kanji) => [kanji.kanji, kanji]))

describe('frases de ejemplo', () => {
  it('hay frases para una buena parte de los primeros mundos', () => {
    expect(sentences.length).toBeGreaterThan(200)
    expect(new Set(sentences.map((s) => s.kanjiId)).size).toBeGreaterThan(150)
  })

  it('cada frase apunta a un kanji que existe', () => {
    for (const sentence of sentences) {
      expect(byId.has(sentence.kanjiId), sentence.id).toBe(true)
    }
  })

  it('el kanji estudiado aparece en la frase y en la palabra del foco', () => {
    for (const sentence of sentences) {
      const kanji = byId.get(sentence.kanjiId)!
      const text = sentence.tokens.map((token) => token.surface).join('')
      expect(text, sentence.id).toContain(kanji.kanji)
      expect(sentence.focus.word, sentence.id).toContain(kanji.kanji)
    }
  })

  it('solo se pone furigana sobre bloques de kanji', () => {
    for (const sentence of sentences) {
      for (const token of sentence.tokens) {
        if (!token.reading) continue
        expect(
          [...token.surface].every(isKanjiChar),
          `${sentence.id}: «${token.surface}»`,
        ).toBe(true)
      }
    }
  })

  it('la lectura del foco se explica como on, kun o excepción', () => {
    const failures: string[] = []
    for (const sentence of sentences) {
      const kanji = byId.get(sentence.kanjiId)!
      const analysis = analyzeReading(
        kanji,
        sentence.focus.word,
        sentence.focus.reading,
      )
      if (analysis.kind === 'unknown') {
        failures.push(
          `${sentence.id}: ${kanji.kanji} en ${sentence.focus.word}（${sentence.focus.reading}）`,
        )
      }
    }
    expect(failures).toEqual([])
  })

  it('cada frase tiene traducción y dificultad válida', () => {
    for (const sentence of sentences) {
      expect(sentence.es.length, sentence.id).toBeGreaterThan(3)
      expect(sentence.tier, sentence.id).toBeGreaterThanOrEqual(1)
      expect(sentence.tier, sentence.id).toBeLessThanOrEqual(4)
    }
  })
})

describe('cuentos', () => {
  it('todos los kanji del cuento son de su mundo o de mundos anteriores', () => {
    const curriculum = readData<
      { id: string; order: number; stages: { kanjiIds: number[] }[] }[]
    >('curriculum.json')
    const orderOf = new Map(curriculum.map((world) => [world.id, world.order]))
    const worldOfKanji = new Map<number, number>()
    for (const world of curriculum) {
      for (const stage of world.stages) {
        for (const id of stage.kanjiIds) worldOfKanji.set(id, world.order)
      }
    }

    for (const story of stories) {
      const limit = orderOf.get(story.worldId)!
      for (const id of story.kanjiIds) {
        expect(worldOfKanji.get(id) ?? 99, `${story.id}: ${byId.get(id)?.kanji}`)
          .toBeLessThanOrEqual(limit)
      }
    }
  })

  it('cada página tiene texto, traducción e ilustración existente', () => {
    for (const story of stories) {
      expect(story.pages.length).toBeGreaterThan(2)
      for (const [index, page] of story.pages.entries()) {
        expect(page.tokens.length, `${story.id} p${index}`).toBeGreaterThan(0)
        expect(page.es.length, `${story.id} p${index}`).toBeGreaterThan(3)
        const file = path.join(process.cwd(), 'public', page.illustration)
        expect(fs.existsSync(file), page.illustration).toBe(true)
      }
    }
  })

  it('todo bloque de kanji del cuento lleva furigana', () => {
    for (const story of stories) {
      for (const page of story.pages) {
        for (const token of page.tokens) {
          if (![...token.surface].some(isKanjiChar)) continue
          expect(token.reading, `${story.id}: «${token.surface}»`).toBeTruthy()
        }
      }
    }
  })
})

describe('fotos de Japón', () => {
  it('el kanji protagonista está en el texto de la foto', () => {
    for (const photo of photos) {
      expect(photo.text, photo.id).toContain(photo.focus)
      expect(byLiteral.has(photo.focus), photo.id).toBe(true)
    }
  })

  it('cada foto tiene archivo, autoría y licencia', () => {
    for (const photo of photos) {
      const file = path.join(process.cwd(), 'public', photo.file)
      expect(fs.existsSync(file), photo.file).toBe(true)
      expect(photo.credit.author.length, photo.id).toBeGreaterThan(0)
      expect(photo.credit.license.length, photo.id).toBeGreaterThan(0)
      expect(photo.credit.sourceUrl, photo.id).toMatch(/^https:\/\//)
    }
  })

  it('la explicación de la foto es útil, no un texto vacío', () => {
    for (const photo of photos) {
      expect(photo.caption.length, photo.id).toBeGreaterThan(20)
      expect(photo.where.length, photo.id).toBeGreaterThan(3)
    }
  })
})
