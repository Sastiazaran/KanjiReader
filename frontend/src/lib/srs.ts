/**
 * Parámetros del repaso espaciado (Leitner), sin dependencias de base de datos
 * para poder usarlos también en cálculos de dificultad y en los test.
 */

/** Días hasta la siguiente revisión por nivel Leitner (0 = recién visto). */
export const SRS_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const

/** Nivel en el que consideramos el kanji dominado. */
export const MASTERED_LEVEL = SRS_INTERVAL_DAYS.length - 1

/**
 * Siguiente nivel Leitner tras responder.
 *
 * @param level - Nivel actual
 * @param correct - Si la respuesta fue correcta
 * @returns Nivel resultante, dentro de los límites
 */
export function nextSrsLevel(level: number, correct: boolean): number {
  return correct
    ? Math.min(level + 1, MASTERED_LEVEL)
    : Math.max(0, level - 1)
}

/**
 * Días de espera hasta el siguiente repaso.
 *
 * @param level - Nivel Leitner ya actualizado
 * @param correct - Si la respuesta fue correcta
 * @returns Días de espera (mínimo 1)
 */
export function daysUntilNextReview(level: number, correct: boolean): number {
  return correct ? Math.max(1, SRS_INTERVAL_DAYS[level]) : 1
}
