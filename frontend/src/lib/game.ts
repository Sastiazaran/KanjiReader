import type { WorldTheme } from '../types/data'

export const XP_PER_CORRECT = 10
export const XP_COMBO_BONUS = 2
export const XP_STAGE_CLEAR = 25
export const MAX_HEARTS = 3
/** Un mundo se abre cuando el anterior llega a este porcentaje de etapas. */
export const WORLD_UNLOCK_RATIO = 0.3

/** XP necesaria para alcanzar cada nivel: crece de forma suave y constante. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return 60 * (level - 1) + 20 * (level - 1) * (level - 2)
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level += 1
  return level
}

export interface LevelInfo {
  level: number
  currentLevelXp: number
  nextLevelXp: number
  progress: number
  xpIntoLevel: number
  xpForNext: number
}

export function levelInfo(xp: number): LevelInfo {
  const level = levelFromXp(xp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const xpIntoLevel = xp - currentLevelXp
  const xpForNext = nextLevelXp - currentLevelXp
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpForNext,
    progress: xpForNext > 0 ? Math.min(1, xpIntoLevel / xpForNext) : 1,
  }
}

export function starsFor(accuracy: number): number {
  if (accuracy >= 1) return 3
  if (accuracy >= 0.8) return 2
  if (accuracy >= 0.5) return 1
  return 0
}

export function xpForAnswer(combo: number): number {
  return XP_PER_CORRECT + Math.min(combo, 5) * XP_COMBO_BONUS
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function yesterdayKey(date = new Date()): string {
  const prev = new Date(date)
  prev.setDate(prev.getDate() - 1)
  return todayKey(prev)
}

/** Etiqueta de uso real del kanji según su puesto de frecuencia. */
export function importanceLabel(frequency: number | null): {
  label: string
  tone: 'top' | 'high' | 'mid' | 'low'
} {
  if (frequency == null) return { label: 'Poco común', tone: 'low' }
  if (frequency <= 250) return { label: 'Se usa muchísimo', tone: 'top' }
  if (frequency <= 800) return { label: 'Muy usado', tone: 'high' }
  if (frequency <= 1600) return { label: 'Usado a menudo', tone: 'mid' }
  return { label: 'Menos común', tone: 'low' }
}

export const THEME_GRADIENTS: Record<WorldTheme, string> = {
  sakura: 'from-pink-400 via-rose-400 to-fuchsia-500',
  ocean: 'from-sky-400 via-cyan-400 to-blue-500',
  forest: 'from-emerald-400 via-green-400 to-teal-500',
  sunset: 'from-amber-400 via-orange-400 to-rose-500',
  grape: 'from-violet-400 via-purple-400 to-indigo-500',
  gold: 'from-yellow-300 via-amber-400 to-orange-400',
  ember: 'from-orange-400 via-red-400 to-rose-500',
}

export const THEME_RING: Record<WorldTheme, string> = {
  sakura: 'shadow-pink-500/30',
  ocean: 'shadow-sky-500/30',
  forest: 'shadow-emerald-500/30',
  sunset: 'shadow-orange-500/30',
  grape: 'shadow-violet-500/30',
  gold: 'shadow-amber-500/30',
  ember: 'shadow-red-500/30',
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  check: (stats: BadgeStats) => boolean
}

export interface BadgeStats {
  xp: number
  level: number
  stagesCleared: number
  perfectStages: number
  streakDays: number
  kanjiLearned: number
  bestCombo: number
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first-step',
    name: 'Primer trazo',
    description: 'Completa tu primera etapa',
    check: (s) => s.stagesCleared >= 1,
  },
  {
    id: 'ten-kanji',
    name: 'Diez amigos',
    description: 'Aprende 10 kanji',
    check: (s) => s.kanjiLearned >= 10,
  },
  {
    id: 'fifty-kanji',
    name: 'Coleccionista',
    description: 'Aprende 50 kanji',
    check: (s) => s.kanjiLearned >= 50,
  },
  {
    id: 'combo-10',
    name: 'Racha de fuego',
    description: 'Encadena 10 aciertos seguidos',
    check: (s) => s.bestCombo >= 10,
  },
  {
    id: 'perfect-3',
    name: 'Tres perfectas',
    description: 'Consigue 3 estrellas en 3 etapas',
    check: (s) => s.perfectStages >= 3,
  },
  {
    id: 'streak-3',
    name: 'Constancia',
    description: 'Estudia 3 días seguidos',
    check: (s) => s.streakDays >= 3,
  },
  {
    id: 'level-5',
    name: 'Aprendiz veterano',
    description: 'Alcanza el nivel 5',
    check: (s) => s.level >= 5,
  },
  {
    id: 'world-clear',
    name: 'Explorador',
    description: 'Completa 20 etapas',
    check: (s) => s.stagesCleared >= 20,
  },
]
