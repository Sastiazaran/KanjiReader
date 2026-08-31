/**
 * Cuenta etapas superadas de un mundo y decide si un cuento ya se puede leer.
 * Así la lista y el lector usan la misma regla.
 */
import type { StageResultRow } from '../db/db'
import type { StoryRecord, World } from '../types/data'

/**
 * Etapas de un mundo con al menos una estrella.
 *
 * @param world - Mundo del mapa, o `undefined` si no existe
 * @param stageResults - Resultados guardados, indexados por id de etapa
 */
export function stagesClearedInWorld(
  world: World | undefined,
  stageResults: Map<string, StageResultRow>,
): number {
  if (!world) return 0
  return world.stages.filter((stage) => (stageResults.get(stage.id)?.stars ?? 0) > 0)
    .length
}

/**
 * Un cuento se abre cuando se han superado suficientes etapas de su mundo.
 *
 * @param story - Cuento
 * @param clearedStages - Etapas superadas en el mundo del cuento
 */
export function isStoryUnlocked(
  story: StoryRecord,
  clearedStages: number,
): boolean {
  return clearedStages >= story.minStagesCleared
}
