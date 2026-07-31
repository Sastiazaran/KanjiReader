import { createContext } from 'react'
import type {
  KanjiRecord,
  MediaMap,
  Stage,
  VocabRecord,
  World,
} from '../types/data'

export interface KanjiDataState {
  loading: boolean
  error: string | null
  kanjis: KanjiRecord[]
  worlds: World[]
  vocabByKanjiId: Map<number, VocabRecord[]>
  mediaMap: MediaMap
  getKanjiById: (id: number) => KanjiRecord | undefined
  getStage: (stageId: string) => Stage | undefined
  getWorld: (worldId: string) => World | undefined
}

export const KanjiDataContext = createContext<KanjiDataState | null>(null)
