import path from 'node:path'
import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type ViteDevServer } from 'vite'

const kanjiMediaRoot = path.resolve(__dirname, '../vendor/kanji-data-media')

function kanjiMediaPlugin() {
  return {
    name: 'kanji-media',
    configureServer(server: ViteDevServer) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
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
          const ext = path.extname(fp)
          const mime =
            ext === '.mp3'
              ? 'audio/mpeg'
              : ext === '.mp4'
                ? 'video/mp4'
                : ext === '.svg'
                  ? 'image/svg+xml'
                  : 'application/octet-stream'
          res.setHeader('Content-Type', mime)
          fs.createReadStream(fp).pipe(res)
        } catch {
          next()
        }
      }
      server.middlewares.use('/kanji-media', handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), kanjiMediaPlugin()],
})
