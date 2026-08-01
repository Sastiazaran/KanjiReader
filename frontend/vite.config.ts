import path from 'node:path'
import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type ViteDevServer } from 'vite'

const kanjiMediaRoot = path.resolve(__dirname, '../vendor/kanji-data-media')

const MEDIA_MIME_BY_EXT = {
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
} as const

const FALLBACK_MIME = 'application/octet-stream'

/**
 * Sirve un archivo estático con soporte HTTP Range (206).
 * Safari exige Range + Content-Length para reproducir MP4; un 200 sin ellos falla en silent.
 */
function sendMediaFile(
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string,
  mime: string,
): void {
  const { size } = fs.statSync(filePath)
  res.setHeader('Content-Type', mime)
  res.setHeader('Accept-Ranges', 'bytes')

  const rangeHeader = req.headers.range
  if (!rangeHeader) {
    res.statusCode = 200
    res.setHeader('Content-Length', String(size))
    fs.createReadStream(filePath).pipe(res)
    return
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
  if (!match) {
    res.statusCode = 416
    res.setHeader('Content-Range', `bytes */${size}`)
    res.end()
    return
  }

  const start = match[1] ? Number.parseInt(match[1], 10) : 0
  let end = match[2] ? Number.parseInt(match[2], 10) : size - 1

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < 0 ||
    start >= size ||
    start > end
  ) {
    res.statusCode = 416
    res.setHeader('Content-Range', `bytes */${size}`)
    res.end()
    return
  }

  end = Math.min(end, size - 1)
  const chunkSize = end - start + 1
  res.statusCode = 206
  res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
  res.setHeader('Content-Length', String(chunkSize))
  fs.createReadStream(filePath, { start, end }).pipe(res)
}

function kanjiMediaMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    try {
      const raw = req.url?.split('?')[0] ?? ''
      const rel = decodeURIComponent(raw.replace(/^\/+/, ''))
      if (!rel || rel.includes('..')) {
        res.statusCode = 403
        res.end()
        return
      }
      const fp = path.join(kanjiMediaRoot, rel)
      if (
        !fp.startsWith(kanjiMediaRoot) ||
        !fs.existsSync(fp) ||
        !fs.statSync(fp).isFile()
      ) {
        res.statusCode = 404
        res.end()
        return
      }
      const ext = path.extname(fp).toLowerCase()
      const mime =
        MEDIA_MIME_BY_EXT[ext as keyof typeof MEDIA_MIME_BY_EXT] ?? FALLBACK_MIME
      sendMediaFile(req, res, fp, mime)
    } catch {
      next()
    }
  }
}

function kanjiMediaPlugin() {
  const attach = (server: ViteDevServer) => {
    server.middlewares.use('/kanji-media', kanjiMediaMiddleware())
  }

  return {
    name: 'kanji-media',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), kanjiMediaPlugin()],
})
