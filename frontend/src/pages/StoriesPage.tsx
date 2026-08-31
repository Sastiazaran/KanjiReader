import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { useStageResults } from '../hooks/useGameState'
import { THEME_GRADIENTS } from '../lib/game'
import { isStoryUnlocked, stagesClearedInWorld } from '../lib/stories'
import { Icon } from '../components/ui/Icon'

/**
 * Lista de cuentos. Cada uno se abre cuando se han superado suficientes etapas
 * de su mundo, así que siempre se lee con kanji ya estudiados.
 */
export function StoriesPage() {
  const { loading, stories, worlds } = useKanjiData()
  const stageResults = useStageResults()

  const clearedByWorld = useMemo(() => {
    const map = new Map<string, number>()
    for (const world of worlds) {
      map.set(world.id, stagesClearedInWorld(world, stageResults))
    }
    return map
  }, [worlds, stageResults])

  const worldById = useMemo(
    () => new Map(worlds.map((world) => [world.id, world])),
    [worlds],
  )

  if (loading) return <p className="text-center text-[var(--muted)]">Cargando…</p>

  return (
    <div className="space-y-5">
      <header className="animate-pop rounded-[28px] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 shadow-2xl shadow-orange-900/40">
        <h1 className="text-2xl font-extrabold text-white">Cuentos</h1>
        <p className="mt-1 text-sm text-white/90">
          Historias cortas escritas solo con los kanji que ya has estudiado, como
          en los libros de lectura japoneses. Toca cualquier palabra para ver qué
          lectura usa.
        </p>
      </header>

      <ul className="space-y-3">
        {stories.map((story) => {
          const world = worldById.get(story.worldId)
          const cleared = clearedByWorld.get(story.worldId) ?? 0
          const unlocked = isStoryUnlocked(story, cleared)
          const theme = world?.theme ?? 'sakura'

          const card = (
            <div
              className={`rounded-[28px] border p-5 ${
                unlocked
                  ? 'border-white/12 bg-white/5'
                  : 'border-white/8 bg-white/[0.02] opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br text-2xl text-white ${THEME_GRADIENTS[theme]} ${
                    unlocked ? '' : 'grayscale'
                  }`}
                >
                  {unlocked ? (
                    <Icon name="book" className="h-7 w-7" />
                  ) : (
                    <Icon name="lock" className="h-6 w-6" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold text-white" lang="ja">
                    {story.title}
                  </h2>
                  <p className="text-sm font-bold text-[var(--muted)]">
                    {story.titleEs}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{story.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[var(--muted)]">
                      {story.pages.length} páginas
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[var(--muted)]">
                      {story.kanjiIds.length} kanji
                    </span>
                    {world && (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[var(--muted)]">
                        {world.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!unlocked && (
                <p className="mt-4 rounded-2xl bg-black/30 px-4 py-2 text-center text-xs font-bold text-white/70">
                  Supera {story.minStagesCleared} etapas de{' '}
                  {world?.name ?? 'este mundo'} para abrirlo ({cleared}/
                  {story.minStagesCleared})
                </p>
              )}
            </div>
          )

          return (
            <li key={story.id}>
              {unlocked ? (
                <Link to={`/cuento/${story.id}`} className="pressable block">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
