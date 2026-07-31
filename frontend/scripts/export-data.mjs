/**
 * Genera los datos estáticos de KanjiReader a partir de fuentes open source:
 *
 *   public/data/kanjis.json      Kanji con lecturas, grado escolar, frecuencia,
 *                                componentes e historia mnemotécnica.
 *   public/data/vocab.json       Palabras de ejemplo (Kanji alive).
 *   public/data/media-map.json   Relación kanji -> archivos de audio/animación.
 *   public/data/curriculum.json  Mundos y etapas ordenados por nivel e importancia.
 *
 * Fuentes: KANJIDIC2 (EDRDG), RADKFILE (EDRDG) y ka_data.csv (Kanji alive).
 */
import { XMLParser } from 'fast-xml-parser'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildStory } from './lib/story.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.join(__dirname, '..')
const REPO_ROOT = path.join(FRONTEND_ROOT, '..')

const DEFAULT_PATHS = {
  kanjidic2: path.join(REPO_ROOT, 'vendor/jadb/data/tmp/kanjidic2.xml'),
  radkfile: path.join(REPO_ROOT, 'vendor/jadb/data/tmp/radkfile_utf8'),
  kaData: path.join(
    REPO_ROOT,
    'vendor/kanji-data-media/language-data/ka_data.csv',
  ),
  outDir: path.join(FRONTEND_ROOT, 'public/data'),
}

const STAGE_SIZE = 6

/** Mundos del mapa: cada uno agrupa kanji de un grado escolar japonés. */
const WORLD_DEFS = [
  {
    id: 'g1',
    grade: 1,
    name: 'Primeros trazos',
    subtitle: 'Números, naturaleza y la familia',
    theme: 'sakura',
  },
  {
    id: 'g2',
    grade: 2,
    name: 'Mi barrio',
    subtitle: 'La ciudad, los días y los colores',
    theme: 'ocean',
  },
  {
    id: 'g3',
    grade: 3,
    name: 'La escuela',
    subtitle: 'Estudiar, jugar y contar historias',
    theme: 'forest',
  },
  {
    id: 'g4',
    grade: 4,
    name: 'El mundo alrededor',
    subtitle: 'Viajes, oficios y naturaleza grande',
    theme: 'sunset',
  },
  {
    id: 'g5',
    grade: 5,
    name: 'Ideas grandes',
    subtitle: 'Sociedad, ciencia y sentimientos',
    theme: 'grape',
  },
  {
    id: 'g6',
    grade: 6,
    name: 'Maestro de primaria',
    subtitle: 'Los últimos kanji de la escuela',
    theme: 'gold',
  },
]

/** El grado 8 (jōyō de secundaria) se reparte por frecuencia de uso. */
const SECONDARY_WORLDS = [
  {
    id: 's1',
    name: 'Secundaria I',
    subtitle: 'Los más usados fuera de la escuela',
    theme: 'ember',
  },
  {
    id: 's2',
    name: 'Secundaria II',
    subtitle: 'Periódicos y libros',
    theme: 'ocean',
  },
  {
    id: 's3',
    name: 'Secundaria III',
    subtitle: 'Trabajo y ciencia',
    theme: 'forest',
  },
  {
    id: 's4',
    name: 'Secundaria IV',
    subtitle: 'Kanji poco frecuentes pero oficiales',
    theme: 'grape',
  },
]

function toArray(value) {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function textOf(node) {
  if (node == null) return null
  if (typeof node === 'object') return node['#text'] ?? null
  return node
}

function jlptNumToLabel(n) {
  const v = parseInt(String(n), 10)
  if (Number.isNaN(v) || v < 1 || v > 5) return null
  return `N${v}`
}

function collectReadings(rm, type) {
  const out = []
  for (const g of toArray(rm?.rmgroup)) {
    for (const rd of toArray(g.reading)) {
      if (rd['@_r_type'] === type && rd['#text']) {
        out.push(String(rd['#text']).trim())
      }
    }
  }
  return [...new Set(out)]
}

function collectMeanings(rm, lang) {
  const out = []
  for (const g of toArray(rm?.rmgroup)) {
    for (const m of toArray(g.meaning)) {
      const mLang = typeof m === 'object' ? m['@_m_lang'] : undefined
      const matches = lang === 'en' ? !mLang : mLang === lang
      if (!matches) continue
      const text = typeof m === 'string' ? m : m['#text']
      if (text != null && String(text).trim()) out.push(String(text).trim())
    }
  }
  return [...new Set(out)]
}

/** Invierte RADKFILE: devuelve kanji -> componentes. */
function loadComponents(radkPath) {
  const raw = fs.readFileSync(radkPath, 'utf8')
  const byKanji = new Map()
  let current = null
  for (const line of raw.split('\n')) {
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('$')) {
      current = line.split(/\s+/)[1] ?? null
      continue
    }
    if (!current) continue
    for (const char of [...line.trim()]) {
      if (!char.trim()) continue
      const list = byKanji.get(char) ?? []
      if (!list.includes(current)) list.push(current)
      byKanji.set(char, list)
    }
  }
  return byKanji
}

function loadKaData(csvPath) {
  const rows = parse(fs.readFileSync(csvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  })
  const byKanji = new Map()
  for (const row of rows) {
    const kanji = row.kanji?.trim()
    if (!kanji) continue
    byKanji.set(kanji, {
      kname: String(row.kname ?? '').trim(),
      examplesRaw: row.examples ?? '',
      radical: String(row.radical ?? '').trim(),
      radicalMeaning: String(row.rad_meaning ?? '').trim(),
    })
  }
  return byKanji
}

function parseExamples(jsonStr) {
  if (!jsonStr?.trim()) return []
  try {
    const data = JSON.parse(jsonStr)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** Separa "食べる（たべる）" en expresión y lectura. */
function splitExpression(raw) {
  const match = raw.match(/^(.*?)（(.*?)）\s*$/)
  if (match) return { expression: match[1].trim(), reading: match[2].trim() }
  return { expression: raw.trim(), reading: null }
}

/** Primer significado corto, apto para usarlo como palabra clave del quiz. */
function toKeyword(meaning) {
  const first = meaning.split(';')[0].split(',')[0].trim()
  return first.length > 28 ? `${first.slice(0, 27)}…` : first
}

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

function buildCurriculum(kanjis) {
  const byId = new Map(kanjis.map((k) => [k.id, k]))
  const sortByImportance = (a, b) => {
    const fa = a.frequency ?? Number.MAX_SAFE_INTEGER
    const fb = b.frequency ?? Number.MAX_SAFE_INTEGER
    if (fa !== fb) return fa - fb
    return a.strokes - b.strokes
  }

  const worlds = []

  for (const def of WORLD_DEFS) {
    const members = kanjis.filter((k) => k.grade === def.grade).sort(sortByImportance)
    if (!members.length) continue
    worlds.push({ ...def, kanjiIds: members.map((k) => k.id) })
  }

  const secondary = kanjis.filter((k) => k.grade === 8).sort(sortByImportance)
  const perWorld = Math.ceil(secondary.length / SECONDARY_WORLDS.length)
  SECONDARY_WORLDS.forEach((def, i) => {
    const members = secondary.slice(i * perWorld, (i + 1) * perWorld)
    if (!members.length) return
    worlds.push({ ...def, kanjiIds: members.map((k) => k.id) })
  })

  return worlds.map((world, worldIndex) => {
    const stages = chunk(world.kanjiIds, STAGE_SIZE).map((ids, stageIndex) => ({
      id: `${world.id}-${stageIndex + 1}`,
      index: stageIndex + 1,
      worldId: world.id,
      kanjiIds: ids,
      title: ids
        .map((id) => byId.get(id)?.kanji ?? '')
        .join(' '),
    }))
    return {
      id: world.id,
      order: worldIndex + 1,
      name: world.name,
      subtitle: world.subtitle,
      theme: world.theme,
      kanjiCount: world.kanjiIds.length,
      stages,
    }
  })
}

function main() {
  const kanjidicPath = process.env.KANJIDIC2_PATH || DEFAULT_PATHS.kanjidic2
  const radkPath = process.env.RADKFILE_PATH || DEFAULT_PATHS.radkfile
  const kaPath = process.env.KA_DATA_PATH || DEFAULT_PATHS.kaData
  const outDir = process.env.DATA_OUT_DIR || DEFAULT_PATHS.outDir

  for (const [label, file] of [
    ['KANJIDIC2', kanjidicPath],
    ['RADKFILE', radkPath],
    ['ka_data.csv', kaPath],
  ]) {
    if (!fs.existsSync(file)) {
      console.error(`Falta ${label}: ${file}`)
      process.exit(1)
    }
  }

  fs.mkdirSync(outDir, { recursive: true })

  console.log('Leyendo ka_data.csv y RADKFILE…')
  const kaByKanji = loadKaData(kaPath)
  const componentsByKanji = loadComponents(radkPath)

  console.log('Parseando KANJIDIC2…')
  // Sin conversión automática: códigos como "65e5" son hexadecimales, no números.
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
  })
  const doc = parser.parse(fs.readFileSync(kanjidicPath, 'utf8'))
  const characters = toArray(doc.kanjidic2?.character)

  const raw = []
  for (const ch of characters) {
    const literal = ch.literal
    if (!literal) continue

    const ucs = toArray(ch.codepoint?.cp_value).find(
      (c) => c['@_cp_type'] === 'ucs',
    )
    const id = parseInt(String(textOf(ucs) ?? ''), 16)
    if (!Number.isFinite(id)) continue

    const misc = ch.misc ?? {}
    const strokes = parseInt(String(textOf(toArray(misc.stroke_count)[0]) ?? 0), 10)
    const grade = misc.grade != null ? parseInt(String(textOf(misc.grade)), 10) : null
    const frequency = misc.freq != null ? parseInt(String(textOf(misc.freq)), 10) : null
    const jlpt = misc.jlpt != null ? jlptNumToLabel(textOf(misc.jlpt)) : null

    const rm = ch.reading_meaning
    const meaningsEs = collectMeanings(rm, 'es')
    const meaningsEn = collectMeanings(rm, 'en')
    const meaningEs = meaningsEs.slice(0, 4).join('; ')
    const meaningEn = meaningsEn.slice(0, 4).join('; ')
    if (!meaningEs && !meaningEn) continue

    raw.push({
      id,
      kanji: literal,
      meaning: meaningEs || meaningEn,
      meaningEn,
      onyomi: collectReadings(rm, 'ja_on'),
      kunyomi: collectReadings(rm, 'ja_kun'),
      strokes: Number.isFinite(strokes) ? strokes : 0,
      grade: Number.isFinite(grade) ? grade : null,
      frequency: Number.isFinite(frequency) ? frequency : null,
      jlpt,
    })
  }

  // El MVP se centra en los kanji jōyō: los que se enseñan en la escuela.
  const selected = raw.filter((k) => k.grade != null && k.grade <= 8)
  const byChar = new Map(
    raw.map((k) => [
      k.kanji,
      { keyword: toKeyword(k.meaning), grade: k.grade, strokes: k.strokes },
    ]),
  )
  const lookupKanji = (char) => byChar.get(char) ?? null

  const kanjis = []
  const vocab = []
  const mediaMap = {}
  let vocabId = 1

  for (const entry of selected) {
    const components = componentsByKanji.get(entry.kanji) ?? []
    const keyword = toKeyword(entry.meaning)
    const story = buildStory({
      literal: entry.kanji,
      meaning: keyword,
      components,
      strokes: entry.strokes,
      lookupKanji,
    })

    const ka = kaByKanji.get(entry.kanji)
    if (ka?.kname) {
      mediaMap[entry.kanji] = {
        kname: ka.kname,
        audioPattern: `${ka.kname}_06_a.mp3`,
        videoFile: `${ka.kname}_00.mp4`,
      }
      for (const pair of parseExamples(ka.examplesRaw).slice(0, 12)) {
        if (!Array.isArray(pair) || pair.length < 2) continue
        const { expression, reading } = splitExpression(String(pair[0] ?? ''))
        const glossary = String(pair[1] ?? '').trim()
        if (!expression) continue
        vocab.push({
          id: vocabId++,
          kanjiId: entry.id,
          kanjiLiteral: entry.kanji,
          expression,
          reading,
          glossary,
        })
      }
    }

    kanjis.push({
      ...entry,
      keyword,
      components,
      componentParts: story.parts,
      story: story.text,
      radical: ka?.radical || null,
      radicalMeaning: ka?.radicalMeaning || null,
      hasMedia: Boolean(ka?.kname),
    })
  }

  kanjis.sort((a, b) => a.id - b.id)
  const curriculum = buildCurriculum(kanjis)

  const files = {
    'kanjis.json': kanjis,
    'vocab.json': vocab,
    'media-map.json': mediaMap,
    'curriculum.json': curriculum,
  }
  for (const [name, payload] of Object.entries(files)) {
    fs.writeFileSync(path.join(outDir, name), JSON.stringify(payload), 'utf8')
  }

  const withStory = kanjis.filter((k) => k.componentParts.length > 0).length
  const stages = curriculum.reduce((acc, w) => acc + w.stages.length, 0)
  console.log(
    [
      `Kanji: ${kanjis.length} (con historia por componentes: ${withStory})`,
      `Vocabulario: ${vocab.length}`,
      `Medios: ${Object.keys(mediaMap).length}`,
      `Mundos: ${curriculum.length} · Etapas: ${stages}`,
      `Salida: ${outDir}`,
    ].join('\n'),
  )
}

main()
