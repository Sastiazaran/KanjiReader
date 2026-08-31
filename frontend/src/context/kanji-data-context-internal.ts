import { createContext } from 'react'
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

export interface KanjiDataState {
  loading: boolean
  error: string | null
  kanjis: KanjiRecord[]
  worlds: World[]
  vocabByKanjiId: Map<number, VocabRecord[]>
  sentencesByKanjiId: Map<number, SentenceRecord[]>
  photosByKanjiId: Map<number, PhotoRecord[]>
  photos: PhotoRecord[]
  stories: StoryRecord[]
  mediaMap: MediaMap
  getKanjiById: (id: number) => KanjiRecord | undefined
  getStage: (stageId: string) => Stage | undefined
  getWorld: (worldId: string) => World | undefined
  getStory: (storyId: string) => StoryRecord | undefined
}

export const KanjiDataContext = createContext<KanjiDataState | null>(null)
