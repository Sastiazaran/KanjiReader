/**
 * Descarga las fotos de Wikimedia Commons declaradas en `content/photos.mjs`
 * y comprueba que la licencia y la autoría siguen siendo las anotadas.
 *
 * Uso: `npm run fetch-photos`
 *
 * Las imágenes se guardan ya reducidas en `public/photos/` para no meter
 * archivos enormes en el repositorio.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PHOTOS } from '../content/photos.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.join(__dirname, '../public')

const API = 'https://commons.wikimedia.org/w/api.php'
const USER_AGENT = 'KanjiReader/1.0 (app educativa de kanji; datos de Wikimedia Commons)'
const THUMB_WIDTH = 900

/** Quita las etiquetas HTML que Commons devuelve en los metadatos. */
function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchImageInfo(title, attempt = 0) {
  const url = new URL(API)
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(THUMB_WIDTH),
  }).toString()

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (response.status === 429) {
    if (attempt > 6) throw new Error(`Commons limitó ${title} (429)`)
    await new Promise((resolve) => setTimeout(resolve, 5000 * 2 ** attempt))
    return fetchImageInfo(title, attempt + 1)
  }
  if (!response.ok) throw new Error(`Commons respondió ${response.status} para ${title}`)

  const data = await response.json()
  const page = Object.values(data.query.pages)[0]
  const info = page?.imageinfo?.[0]
  if (!info) throw new Error(`Sin información de imagen para ${title}`)

  const meta = info.extmetadata ?? {}
  return {
    downloadUrl: info.thumburl ?? info.url,
    license: stripHtml(meta.LicenseShortName?.value),
    author: stripHtml(meta.Artist?.value),
  }
}

async function download(url, dest, attempt = 0) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (response.status === 429 || response.status >= 500) {
    if (attempt > 6) throw new Error(`No se pudo bajar ${url} (${response.status})`)
    const wait = 3000 * 2 ** attempt
    console.log(`  espera ${wait} ms…`)
    await new Promise((resolve) => setTimeout(resolve, wait))
    return download(url, dest, attempt + 1)
  }
  if (!response.ok) throw new Error(`No se pudo bajar ${url} (${response.status})`)
  fs.writeFileSync(dest, Buffer.from(await response.arrayBuffer()))
}

async function main() {
  // Varias entradas pueden compartir foto (p. ej. 女湯 y 男湯 en la misma cortina).
  const byFile = new Map()
  for (const photo of PHOTOS) {
    if (!byFile.has(photo.file)) byFile.set(photo.file, photo)
  }

  const warnings = []
  for (const [file, photo] of byFile) {
    const dest = path.join(PUBLIC_DIR, file.replace(/^\//, ''))
    fs.mkdirSync(path.dirname(dest), { recursive: true })

    const info = await fetchImageInfo(photo.commonsTitle)
    if (info.license !== photo.credit.license) {
      warnings.push(
        `${photo.id}: la licencia en Commons es «${info.license}» y aquí dice «${photo.credit.license}»`,
      )
    }

    if (fs.existsSync(dest) && fs.statSync(dest).size > 4000) {
      console.log(`${file}  (ya estaba)  ${info.license}`)
    } else {
      await download(info.downloadUrl, dest)
      const kb = Math.round(fs.statSync(dest).size / 1024)
      console.log(`${file}  ${kb} KB  ${info.license}  ${info.author}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 800))
  }

  if (warnings.length) {
    console.error('\nRevisa estas licencias:')
    for (const warning of warnings) console.error(` - ${warning}`)
    process.exit(1)
  }

  console.log(`\n${byFile.size} fotos en ${path.join(PUBLIC_DIR, 'photos')}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
