/**
 * Convierte el contenido propio (`content/*.mjs`) en los JSON que carga la app:
 *
 *   public/data/sentences.json  Frases de ejemplo con furigana
 *   public/data/stories.json    Cuentos cortos por mundo
 *   public/data/photos.json     Fotos de Japón con kanji en la calle
 *
 * A diferencia de `export-data.mjs`, aquí no hace falta ningún dato externo:
 * todo está escrito en este repositorio.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  kanjiInTokens,
  parseJapanese,
  resolveFocus,
  tokensToText,
} from './lib/jp-tokens.mjs'
import { SENTENCES } from '../content/sentences.mjs'
import { STORIES } from '../content/stories.mjs'
import { PHOTOS } from '../content/photos.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(FRONTEND_ROOT, 'public/data')

function loadKanjis() {
  const file = path.join(DATA_DIR, 'kanjis.json')
  if (!fs.existsSync(file)) {
    console.error(`Falta ${file}. Ejecuta primero "npm run export-data".`)
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function loadKanjiIndex(kanjis) {
  return new Map(kanjis.map((entry) => [entry.kanji, entry.id]))
}

function requireId(index, literal, context) {
  const id = index.get(literal)
  if (id == null) throw new Error(`Kanji desconocido «${literal}» en ${context}`)
  return id
}

function buildSentences(index) {
  const counters = new Map()

  return SENTENCES.map((entry) => {
    const context = `la frase de ${entry.k} («${entry.jp}»)`
    const kanjiId = requireId(index, entry.k, context)
    const tokens = parseJapanese(entry.jp)
    const text = tokensToText(tokens)

    if (!text.includes(entry.k)) {
      throw new Error(`${entry.k} no aparece en ${context}`)
    }
    if (!tokens.some((token) => token.isTarget)) {
      throw new Error(`Falta marcar con * la palabra estudiada en ${context}`)
    }

    const focus = resolveFocus(tokens, entry.focus)
    if (!focus.word.includes(entry.k)) {
      throw new Error(`El foco «${focus.word}» no contiene ${entry.k} en ${context}`)
    }

    const seq = (counters.get(entry.k) ?? 0) + 1
    counters.set(entry.k, seq)

    return {
      id: `s-${kanjiId}-${seq}`,
      kanjiId,
      tokens,
      focus,
      es: entry.es,
      tier: entry.tier,
    }
  })
}

function buildStories(index) {
  return STORIES.map((story) => {
    const pages = story.pages.map((page, pageIndex) => {
      const tokens = parseJapanese(page.jp)
      if (!tokens.length) {
        throw new Error(`Página ${pageIndex + 1} vacía en el cuento ${story.id}`)
      }
      return { tokens, es: page.es, illustration: page.illustration }
    })

    const literals = [...new Set(pages.flatMap((page) => kanjiInTokens(page.tokens)))]
    const kanjiIds = literals
      .map((literal) => index.get(literal))
      .filter((id) => id != null)

    return {
      id: story.id,
      worldId: story.worldId,
      title: story.title,
      titleEs: story.titleEs,
      summary: story.summary,
      minStagesCleared: story.minStagesCleared,
      tier: story.tier,
      kanjiIds,
      pages,
    }
  })
}

function buildPhotos(index, kanjis) {
  const frequency = new Map(
    kanjis.map((entry) => [entry.kanji, entry.frequency ?? 9999]),
  )

  const photos = PHOTOS.map((photo) => {
    const context = `la foto ${photo.id}`
    const literals = [...photo.text].filter((char) => index.has(char))
    if (!literals.includes(photo.focus)) {
      throw new Error(`El kanji ${photo.focus} no está en el texto de ${context}`)
    }

    const file = path.join(FRONTEND_ROOT, 'public', photo.file.replace(/^\//, ''))
    if (!fs.existsSync(file)) {
      throw new Error(`Falta la imagen ${photo.file} de ${context}`)
    }

    return {
      id: photo.id,
      file: photo.file,
      kanjiIds: literals.map((literal) => requireId(index, literal, context)),
      focus: photo.focus,
      text: photo.text,
      textReading: photo.textReading,
      where: photo.where,
      caption: photo.caption,
      credit: photo.credit,
    }
  })

  photos.sort(
    (a, b) =>
      (frequency.get(a.focus) ?? 9999) - (frequency.get(b.focus) ?? 9999),
  )
  return photos
}

function main() {
  const kanjis = loadKanjis()
  const index = loadKanjiIndex(kanjis)

  const files = {
    'sentences.json': buildSentences(index),
    'stories.json': buildStories(index),
    'photos.json': buildPhotos(index, kanjis),
  }

  for (const [name, payload] of Object.entries(files)) {
    fs.writeFileSync(
      path.join(DATA_DIR, name),
      JSON.stringify(payload),
      'utf8',
    )
  }

  const withSentence = new Set(files['sentences.json'].map((s) => s.kanjiId))
  console.log(
    [
      `Frases: ${files['sentences.json'].length} (kanji distintos: ${withSentence.size})`,
      `Cuentos: ${files['stories.json'].length}`,
      `Fotos: ${files['photos.json'].length}`,
      `Salida: ${DATA_DIR}`,
    ].join('\n'),
  )
}

main()
