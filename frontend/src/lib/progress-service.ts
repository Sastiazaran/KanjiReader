import {
  db,
  getProfile,
  LOCAL_USER_ID,
  PROFILE_ID,
  type ProgressRow,
} from '../db/db'
import {
  BADGES,
  levelFromXp,
  starsFor,
  todayKey,
  XP_STAGE_CLEAR,
  yesterdayKey,
  type BadgeStats,
} from './game'

import { daysUntilNextReview, MASTERED_LEVEL, nextSrsLevel } from './srs'

export { SRS_INTERVAL_DAYS, MASTERED_LEVEL } from './srs'

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  next.setHours(4, 0, 0, 0)
  return next
}

export async function getOrCreateProgress(kanjiId: number): Promise<ProgressRow> {
  const existing = await db.progress
    .where('[userId+kanjiId]')
    .equals([LOCAL_USER_ID, kanjiId])
    .first()
  if (existing) return existing

  const now = new Date()
  const id = await db.progress.add({
    userId: LOCAL_USER_ID,
    kanjiId,
    srsLevel: 0,
    nextReview: now,
    lastSeen: now,
    updatedAt: now.getTime(),
  })
  return (await db.progress.get(id))!
}

/** Actualiza el nivel SRS de un kanji tras responder en un juego. */
export async function recordAnswer(kanjiId: number, correct: boolean) {
  const row = await getOrCreateProgress(kanjiId)
  const now = new Date()
  const nextLevel = nextSrsLevel(row.srsLevel, correct)
  const days = daysUntilNextReview(nextLevel, correct)

  await db.progress.update(row.id!, {
    srsLevel: nextLevel,
    nextReview: addDays(now, days),
    lastSeen: now,
    updatedAt: now.getTime(),
  })
}

interface SessionSummary {
  xpEarned: number
  correct: number
  total: number
  bestCombo: number
}

/** Suma XP, actualiza la racha diaria y desbloquea insignias. */
export async function commitSession({
  xpEarned,
  correct,
  total,
  bestCombo,
}: SessionSummary) {
  const profile = await getProfile()
  const today = todayKey()
  const streakDays =
    profile.lastStudyDay === today
      ? profile.streakDays
      : profile.lastStudyDay === yesterdayKey()
        ? profile.streakDays + 1
        : 1

  await db.profile.update(PROFILE_ID, {
    xp: profile.xp + xpEarned,
    streakDays,
    lastStudyDay: today,
    totalAnswers: profile.totalAnswers + total,
    correctAnswers: profile.correctAnswers + correct,
    bestCombo: Math.max(profile.bestCombo, bestCombo),
    updatedAt: Date.now(),
  })

  return refreshBadges()
}

/** Guarda el resultado de una etapa conservando la mejor puntuación. */
export async function saveStageResult(
  stageId: string,
  worldId: string,
  accuracy: number,
) {
  const stars = starsFor(accuracy)
  const previous = await db.stageResults.get(stageId)
  await db.stageResults.put({
    stageId,
    worldId,
    stars: Math.max(stars, previous?.stars ?? 0),
    bestAccuracy: Math.max(accuracy, previous?.bestAccuracy ?? 0),
    timesPlayed: (previous?.timesPlayed ?? 0) + 1,
    completedAt: Date.now(),
  })
  return { stars, isNewBest: stars > (previous?.stars ?? 0) }
}

export function extraXpForStage(isFirstClear: boolean): number {
  return isFirstClear ? XP_STAGE_CLEAR : Math.round(XP_STAGE_CLEAR / 2)
}

export async function collectBadgeStats(): Promise<BadgeStats> {
  const [profile, stageRows, progressRows] = await Promise.all([
    getProfile(),
    db.stageResults.toArray(),
    db.progress.where('userId').equals(LOCAL_USER_ID).toArray(),
  ])
  return {
    xp: profile.xp,
    level: levelFromXp(profile.xp),
    stagesCleared: stageRows.filter((s) => s.stars > 0).length,
    perfectStages: stageRows.filter((s) => s.stars === 3).length,
    streakDays: profile.streakDays,
    kanjiLearned: progressRows.filter((p) => p.srsLevel >= 1).length,
    bestCombo: profile.bestCombo,
  }
}

/** Desbloquea insignias nuevas y devuelve solo las conseguidas ahora. */
export async function refreshBadges(): Promise<string[]> {
  const stats = await collectBadgeStats()
  const owned = new Set((await db.badges.toArray()).map((b) => b.id))
  const unlocked: string[] = []

  for (const badge of BADGES) {
    if (owned.has(badge.id) || !badge.check(stats)) continue
    await db.badges.put({ id: badge.id, unlockedAt: Date.now() })
    unlocked.push(badge.id)
  }
  return unlocked
}

/**
 * Elimina filas de progreso que apuntan a kanji fuera del curso actual (por
 * ejemplo, datos guardados por versiones anteriores de la app).
 */
export async function pruneUnknownProgress(validIds: Set<number>) {
  const rows = await db.progress.where('userId').equals(LOCAL_USER_ID).toArray()
  const orphanIds = rows
    .filter((row) => !validIds.has(row.kanjiId))
    .map((row) => row.id)
    .filter((id): id is number => id != null)
  if (orphanIds.length) await db.progress.bulkDelete(orphanIds)
  return orphanIds.length
}

export async function resetAllProgress() {
  await Promise.all([
    db.progress.clear(),
    db.stageResults.clear(),
    db.badges.clear(),
    db.profile.clear(),
  ])
  await getProfile()
}
