/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KANJI_MEDIA_BASE?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
