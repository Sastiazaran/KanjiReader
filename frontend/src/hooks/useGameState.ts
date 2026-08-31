import { useLiveQuery } from 'dexie-react-hooks'
import { db, EMPTY_PROFILE, LOCAL_USER_ID } from '../db/db'
import { levelInfo } from '../lib/game'

export function useProfile() {
  const profile = useLiveQuery(() => db.profile.get(1), [], undefined)
  const value = profile ?? EMPTY_PROFILE
  return { profile: value, level: levelInfo(value.xp), loaded: profile != null }
}

export function useStageResults() {
  const rows = useLiveQuery(() => db.stageResults.toArray(), [], [])
  return new Map(rows.map((r) => [r.stageId, r]))
}

export function useProgressRows() {
  return useLiveQuery(
    () => db.progress.where('userId').equals(LOCAL_USER_ID).toArray(),
    [],
    [],
  )
}

export function useUnlockedBadges() {
  const rows = useLiveQuery(() => db.badges.toArray(), [], [])
  return new Set(rows.map((r) => r.id))
}

export function useDueCount() {
  return useLiveQuery(async () => {
    const now = new Date()
    const rows = await db.progress.where('userId').equals(LOCAL_USER_ID).toArray()
    return rows.filter((r) => new Date(r.nextReview) <= now).length
  }, [], 0)
}

export interface ReviewQueueRow {
  kanjiId: number
  srsLevel: number
  /** Fecha del próximo repaso en ISO, lista para mostrar. */
  nextReview: string
}

const EMPTY_QUEUE = {
  due: [] as ReviewQueueRow[],
  studied: [] as ReviewQueueRow[],
}

/**
 * Cola de repaso: primero lo que peor se recuerda (nivel bajo) y, a igual
 * nivel, lo que lleva más tiempo esperando.
 */
export function useReviewQueue() {
  return useLiveQuery(
    async () => {
      const now = Date.now()
      const rows = await db.progress.where('userId').equals(LOCAL_USER_ID).toArray()
      const sorted = [...rows]
        .sort((a, b) => {
          if (a.srsLevel !== b.srsLevel) return a.srsLevel - b.srsLevel
          return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
        })
        .map((row) => ({
          kanjiId: row.kanjiId,
          srsLevel: row.srsLevel,
          nextReview: new Date(row.nextReview).toISOString(),
        }))

      return {
        due: sorted.filter((row) => new Date(row.nextReview).getTime() <= now),
        studied: sorted,
      }
    },
    [],
    EMPTY_QUEUE,
  )
}
