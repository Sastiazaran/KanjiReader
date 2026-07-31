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

/** Kanji vencidos y kanji ya estudiados, calculados fuera del render. */
export function useReviewQueue() {
  return useLiveQuery(
    async () => {
      const now = Date.now()
      const rows = await db.progress.where('userId').equals(LOCAL_USER_ID).toArray()
      const sorted = [...rows].sort(
        (a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime(),
      )
      return {
        due: sorted
          .filter((r) => new Date(r.nextReview).getTime() <= now)
          .map((r) => r.kanjiId),
        studied: sorted.map((r) => r.kanjiId),
      }
    },
    [],
    { due: [] as number[], studied: [] as number[] },
  )
}
