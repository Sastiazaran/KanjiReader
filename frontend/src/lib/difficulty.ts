/**
 * Escalera de dificultad: al principio solo hay que reconocer el kanji y poco a
 * poco entran las lecturas, las frases y las fotos reales.
 *
 * Se usa en dos sitios:
 *   - etapas: la dificultad sube con el mundo y la etapa
 *   - repaso: la dificultad sube con el nivel SRS de cada kanji
 */
import type { QuestionKind } from './quiz'
import { MASTERED_LEVEL } from './srs'

export type Tier = 1 | 2 | 3 | 4

export interface TierInfo {
  id: Tier
  name: string
  /** Qué se practica en este nivel, en una línea. */
  subtitle: string
  /** Tipos de pregunta que entran en el juego. */
  kinds: QuestionKind[]
}

export const TIERS: Readonly<Record<Tier, TierInfo>> = {
  1: {
    id: 1,
    name: 'Reconocer',
    subtitle: 'Solo el dibujo y su significado',
    kinds: ['meaning', 'kanji'],
  },
  2: {
    id: 2,
    name: 'Leer',
    subtitle: 'Aparecen las lecturas dentro de palabras',
    kinds: ['meaning', 'reading-context'],
  },
  3: {
    id: 3,
    name: 'Entender',
    subtitle: 'Frases completas con el kanji en contexto',
    kinds: ['kanji', 'reading-context', 'sentence'],
  },
  4: {
    id: 4,
    name: 'Dominar',
    subtitle: 'Elegir on o kun y leer en la calle',
    kinds: ['meaning', 'sentence', 'reading-type'],
  },
}

/** Etapas del primer mundo que se juegan solo con reconocimiento. */
const FIRST_WORLD_EASY_STAGES = 3
/** Etapas del primer mundo antes de que entren las frases. */
const FIRST_WORLD_READING_STAGES = 8
/** Etapas del segundo mundo antes de exigir on/kun por su nombre. */
const SECOND_WORLD_HARD_STAGE = 14

/**
 * Dificultad de una etapa según su mundo y su posición. Nunca baja al avanzar:
 * lo que ya se ha desbloqueado sigue apareciendo más adelante.
 *
 * @param worldOrder - Número de mundo (1 = primer curso)
 * @param stageIndex - Número de etapa dentro del mundo (empieza en 1)
 * @returns Nivel de dificultad de 1 a 4
 *
 * @example
 * stageTier(1, 1) // 1 (solo reconocer)
 * stageTier(2, 1) // 3 (ya con frases)
 */
export function stageTier(worldOrder: number, stageIndex: number): Tier {
  if (worldOrder <= 1) {
    if (stageIndex <= FIRST_WORLD_EASY_STAGES) return 1
    if (stageIndex <= FIRST_WORLD_READING_STAGES) return 2
    return 3
  }
  if (worldOrder === 2) {
    return stageIndex < SECOND_WORLD_HARD_STAGE ? 3 : 4
  }
  return 4
}

/**
 * Dificultad de un kanji en el repaso según su nivel de memoria.
 * Lo recién visto se pregunta fácil; lo que ya está sólido se exige más.
 *
 * @param srsLevel - Nivel Leitner del kanji (0 a {@link MASTERED_LEVEL})
 * @returns Nivel de dificultad de 1 a 4
 */
export function reviewTier(srsLevel: number): Tier {
  if (srsLevel <= 1) return 1
  if (srsLevel === 2) return 2
  if (srsLevel < MASTERED_LEVEL) return 3
  return 4
}

/**
 * Tipos de pregunta de una etapa.
 *
 * @param worldOrder - Número de mundo
 * @param stageIndex - Número de etapa
 */
export function stageQuestionKinds(
  worldOrder: number,
  stageIndex: number,
): QuestionKind[] {
  return TIERS[stageTier(worldOrder, stageIndex)].kinds
}

export type ReviewModeId = 'adaptive' | 'classic' | 'readings' | 'sentences' | 'street'

export interface ReviewMode {
  id: ReviewModeId
  name: string
  description: string
  /** Kanji estudiados que hacen falta para desbloquear el modo. */
  minStudied: number
  /** `null` cuando cada kanji usa su propia dificultad. */
  kinds: QuestionKind[] | null
}

export const REVIEW_MODES: readonly ReviewMode[] = [
  {
    id: 'adaptive',
    name: 'Adaptado',
    description: 'Sube de dificultad kanji por kanji, según tu memoria',
    minStudied: 0,
    kinds: null,
  },
  {
    id: 'classic',
    name: 'Clásico',
    description: 'Significado y escritura, como en las primeras etapas',
    minStudied: 0,
    kinds: ['meaning', 'kanji'],
  },
  {
    id: 'readings',
    name: 'Lecturas',
    description: 'Cuándo suena on y cuándo kun',
    minStudied: 8,
    kinds: ['reading-context', 'reading-type'],
  },
  {
    id: 'sentences',
    name: 'Frases',
    description: 'Completa frases de verdad',
    minStudied: 16,
    kinds: ['sentence'],
  },
  {
    id: 'street',
    name: 'En la calle',
    description: 'Reconoce kanji en fotos de Japón',
    minStudied: 24,
    kinds: ['photo'],
  },
]

/**
 * Modos de repaso con su estado de desbloqueo.
 *
 * @param studiedCount - Kanji que ya se han practicado alguna vez
 */
export function reviewModesFor(
  studiedCount: number,
): { mode: ReviewMode; unlocked: boolean }[] {
  return REVIEW_MODES.map((mode) => ({
    mode,
    unlocked: studiedCount >= mode.minStudied,
  }))
}
