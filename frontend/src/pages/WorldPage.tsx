import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { useStageResults } from '../hooks/useGameState'
import { THEME_GRADIENTS } from '../lib/game'
import { Icon } from '../components/ui/Icon'
import { Stars } from '../components/ui/Stars'

export function WorldPage() {
  const { worldId = '' } = useParams()
  const { loading, getWorld, getKanjiById, stories } = useKanjiData()
  const stageResults = useStageResults()
  const world = getWorld(worldId)

  const clearedStages = useMemo(
    () =>
      (world?.stages ?? []).filter(
        (stage) => (stageResults.get(stage.id)?.stars ?? 0) > 0,
      ).length,
    [world, stageResults],
  )

  const worldStories = useMemo(
    () => stories.filter((story) => story.worldId === worldId),
    [stories, worldId],
  )

  // La etapa siguiente se abre al superar la anterior con al menos una estrella.
  const stageViews = useMemo(() => {
    const summaries = (world?.stages ?? []).map((stage) => ({
      stage,
      stars: stageResults.get(stage.id)?.stars ?? 0,
      bestAccuracy: stageResults.get(stage.id)?.bestAccuracy ?? null,
      preview: stage.kanjiIds.map((id) => getKanjiById(id)?.kanji ?? '').join(' '),
    }))
    return summaries.map((summary, index) => ({
      ...summary,
      unlocked: index === 0 || summaries[index - 1].stars > 0,
    }))
  }, [world, stageResults, getKanjiById])

  if (loading) return <p className="text-center text-[var(--muted)]">Cargando…</p>
  if (!world) {
    return (
      <p className="text-center text-[var(--muted)]">
        Ese mundo no existe.{' '}
        <Link to="/" className="font-bold text-violet-300">
          Volver al mapa
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--muted)] hover:text-white"
      >
        <Icon name="back" className="h-4 w-4" />
        Mapa
      </Link>

      <header
        className={`animate-pop rounded-[28px] bg-gradient-to-br p-5 text-white shadow-xl ${
          THEME_GRADIENTS[world.theme]
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-white/80">
          Mundo {world.order}
        </p>
        <h1 className="text-2xl font-extrabold">{world.name}</h1>
        <p className="text-sm text-white/85">{world.subtitle}</p>
      </header>

      {worldStories.length > 0 && (
        <section className="rounded-3xl border border-amber-300/25 bg-amber-400/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-200">
            <Icon name="book" className="h-5 w-5" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide">
              Cuentos de este mundo
            </h2>
          </div>
          <ul className="space-y-2">
            {worldStories.map((story) => {
              const unlocked = clearedStages >= story.minStagesCleared
              return (
                <li key={story.id}>
                  {unlocked ? (
                    <Link
                      to={`/cuento/${story.id}`}
                      className="pressable flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-2.5 hover:bg-white/15"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-white" lang="ja">
                          {story.title}
                        </span>
                        <span className="block text-xs text-[var(--muted)]">
                          {story.titleEs}
                        </span>
                      </span>
                      <Icon name="play" className="h-5 w-5 shrink-0 text-amber-200" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-4 py-2.5 text-sm text-[var(--muted)]">
                      <span>
                        {story.titleEs} · {clearedStages}/{story.minStagesCleared}{' '}
                        etapas
                      </span>
                      <Icon name="lock" className="h-4 w-4 shrink-0" />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <ol className="space-y-3">
        {stageViews.map(({ stage, stars, unlocked, bestAccuracy, preview }) => {
          const content = (
            <div
              className={`flex items-center gap-4 rounded-3xl border p-4 ${
                unlocked
                  ? 'border-white/12 bg-white/5'
                  : 'border-white/8 bg-white/[0.02] opacity-70'
              }`}
            >
              <div
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white ${
                  stars > 0
                    ? `bg-gradient-to-br ${THEME_GRADIENTS[world.theme]}`
                    : unlocked
                      ? 'bg-white/10'
                      : 'bg-white/5'
                }`}
              >
                {unlocked ? stage.index : <Icon name="lock" className="h-5 w-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-2xl text-white" lang="ja">
                  {preview}
                </p>
                <p className="text-xs font-bold text-[var(--muted)]">
                  {stage.kanjiIds.length} kanji ·{' '}
                  {bestAccuracy != null
                    ? `Mejor: ${Math.round(bestAccuracy * 100)}%`
                    : 'Sin jugar'}
                </p>
              </div>

              <Stars value={stars} size="w-4 h-4" />
            </div>
          )

          return (
            <li key={stage.id}>
              {unlocked ? (
                <Link to={`/etapa/${stage.id}`} className="pressable block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
