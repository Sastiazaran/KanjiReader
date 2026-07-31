import Dexie, { type Table } from 'dexie'

export const LOCAL_USER_ID = 'local-mvp'
export const PROFILE_ID = 1

export interface ProgressRow {
  id?: number
  userId: string
  kanjiId: number
  srsLevel: number
  nextReview: Date
  lastSeen: Date
  updatedAt: number
}

export interface ProfileRow {
  id: number
  xp: number
  streakDays: number
  /** Último día de estudio en formato YYYY-MM-DD. */
  lastStudyDay: string | null
  totalAnswers: number
  correctAnswers: number
  bestCombo: number
  updatedAt: number
}

export interface StageResultRow {
  stageId: string
  worldId: string
  stars: number
  bestAccuracy: number
  timesPlayed: number
  completedAt: number
}

export interface BadgeRow {
  id: string
  unlockedAt: number
}

export class KanjiProgressDB extends Dexie {
  progress!: Table<ProgressRow, number>
  profile!: Table<ProfileRow, number>
  stageResults!: Table<StageResultRow, string>
  badges!: Table<BadgeRow, string>

  constructor() {
    super('KanjiReaderDB')
    this.version(1).stores({
      progress: '++id, [userId+kanjiId], userId, kanjiId, nextReview',
    })
    this.version(2).stores({
      progress: '++id, [userId+kanjiId], userId, kanjiId, nextReview',
      profile: 'id',
      stageResults: 'stageId, worldId',
      badges: 'id',
    })
  }
}

export const db = new KanjiProgressDB()

export const EMPTY_PROFILE: ProfileRow = {
  id: PROFILE_ID,
  xp: 0,
  streakDays: 0,
  lastStudyDay: null,
  totalAnswers: 0,
  correctAnswers: 0,
  bestCombo: 0,
  updatedAt: 0,
}

export async function getProfile(): Promise<ProfileRow> {
  const row = await db.profile.get(PROFILE_ID)
  if (row) return row
  const fresh = { ...EMPTY_PROFILE, updatedAt: Date.now() }
  await db.profile.put(fresh)
  return fresh
}
