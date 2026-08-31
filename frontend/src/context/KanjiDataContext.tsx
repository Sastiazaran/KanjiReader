import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  KanjiRecord,
  MediaMap,
  PhotoRecord,
  SentenceRecord,
  Stage,
  StoryRecord,
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
  const [sentenceList, setSentenceList] = useState<SentenceRecord[]>([])
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [stories, setStories] = useState<StoryRecord[]>([])
  const [mediaMap, setMediaMap] = useState<MediaMap>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [
          kanjiData,
          vocabData,
          mediaData,
          curriculum,
          sentenceData,
          photoData,
          storyData,
        ] = await Promise.all([
          loadJson<KanjiRecord[]>('/data/kanjis.json'),
          loadJson<VocabRecord[]>('/data/vocab.json'),
          loadJson<MediaMap>('/data/media-map.json'),
          loadJson<World[]>('/data/curriculum.json'),
          loadJson<SentenceRecord[]>('/data/sentences.json'),
          loadJson<PhotoRecord[]>('/data/photos.json'),
          loadJson<StoryRecord[]>('/data/stories.json'),
        ])
        if (cancelled) return
        void pruneUnknownProgress(new Set(kanjiData.map((k) => k.id)))
        setKanjis(kanjiData)
        setVocabList(vocabData)
        setMediaMap(mediaData)
        setWorlds(curriculum)
        setSentenceList(sentenceData)
        setPhotos(photoData)
        setStories(storyData)
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

  const sentencesByKanjiId = useMemo(() => {
    const map = new Map<number, SentenceRecord[]>()
    for (const sentence of sentenceList) {
      const list = map.get(sentence.kanjiId) ?? []
      list.push(sentence)
      map.set(sentence.kanjiId, list)
    }
    // Las frases más sencillas primero: así la ficha empieza por lo fácil.
    for (const list of map.values()) list.sort((a, b) => a.tier - b.tier)
    return map
  }, [sentenceList])

  const photosByKanjiId = useMemo(() => {
    const map = new Map<number, PhotoRecord[]>()
    for (const photo of photos) {
      for (const id of photo.kanjiIds) {
        const list = map.get(id) ?? []
        list.push(photo)
        map.set(id, list)
      }
    }
    return map
  }, [photos])

  const kanjiById = useMemo(
    () => new Map(kanjis.map((k) => [k.id, k])),
    [kanjis],
  )

  const storyById = useMemo(
    () => new Map(stories.map((story) => [story.id, story])),
    [stories],
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
  const getStory = useCallback((id: string) => storyById.get(id), [storyById])

  const value = useMemo(
    () => ({
      loading,
      error,
      kanjis,
      worlds,
      vocabByKanjiId,
      sentencesByKanjiId,
      photosByKanjiId,
      photos,
      stories,
      mediaMap,
      getKanjiById,
      getStage,
      getWorld,
      getStory,
    }),
    [
      loading,
      error,
      kanjis,
      worlds,
      vocabByKanjiId,
      sentencesByKanjiId,
      photosByKanjiId,
      photos,
      stories,
      mediaMap,
      getKanjiById,
      getStage,
      getWorld,
      getStory,
    ],
  )

  return (
    <KanjiDataContext.Provider value={value}>{children}</KanjiDataContext.Provider>
  )
}
