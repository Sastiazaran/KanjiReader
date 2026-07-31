import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  KanjiRecord,
  MediaMap,
  Stage,
  VocabRecord,
  World,
} from '../types/data'
import { KanjiDataContext } from './kanji-data-context-internal'
import { pruneUnknownProgress } from '../lib/progress-service'

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`No se pudo cargar ${url} (${response.status})`)
  return response.json() as Promise<T>
}

export function KanjiDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kanjis, setKanjis] = useState<KanjiRecord[]>([])
  const [worlds, setWorlds] = useState<World[]>([])
  const [vocabList, setVocabList] = useState<VocabRecord[]>([])
  const [mediaMap, setMediaMap] = useState<MediaMap>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [kanjiData, vocabData, mediaData, curriculum] = await Promise.all([
          loadJson<KanjiRecord[]>('/data/kanjis.json'),
          loadJson<VocabRecord[]>('/data/vocab.json'),
          loadJson<MediaMap>('/data/media-map.json'),
          loadJson<World[]>('/data/curriculum.json'),
        ])
        if (cancelled) return
        void pruneUnknownProgress(new Set(kanjiData.map((k) => k.id)))
        setKanjis(kanjiData)
        setVocabList(vocabData)
        setMediaMap(mediaData)
        setWorlds(curriculum)
        setError(null)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? `${e.message}. ¿Ejecutaste "npm run export-data"?`
              : 'Error cargando los datos',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const vocabByKanjiId = useMemo(() => {
    const map = new Map<number, VocabRecord[]>()
    for (const entry of vocabList) {
      const list = map.get(entry.kanjiId) ?? []
      list.push(entry)
      map.set(entry.kanjiId, list)
    }
    return map
  }, [vocabList])

  const kanjiById = useMemo(
    () => new Map(kanjis.map((k) => [k.id, k])),
    [kanjis],
  )

  const stageById = useMemo(() => {
    const map = new Map<string, Stage>()
    for (const world of worlds) {
      for (const stage of world.stages) map.set(stage.id, stage)
    }
    return map
  }, [worlds])

  const worldById = useMemo(
    () => new Map(worlds.map((w) => [w.id, w])),
    [worlds],
  )

  const getKanjiById = useCallback((id: number) => kanjiById.get(id), [kanjiById])
  const getStage = useCallback((id: string) => stageById.get(id), [stageById])
  const getWorld = useCallback((id: string) => worldById.get(id), [worldById])

  const value = useMemo(
    () => ({
      loading,
      error,
      kanjis,
      worlds,
      vocabByKanjiId,
      mediaMap,
      getKanjiById,
      getStage,
      getWorld,
    }),
    [
      loading,
      error,
      kanjis,
      worlds,
      vocabByKanjiId,
      mediaMap,
      getKanjiById,
      getStage,
      getWorld,
    ],
  )

  return (
    <KanjiDataContext.Provider value={value}>{children}</KanjiDataContext.Provider>
  )
}
