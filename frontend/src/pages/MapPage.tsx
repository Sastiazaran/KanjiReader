import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { useDueCount, useProfile, useStageResults } from '../hooks/useGameState'
import { THEME_GRADIENTS, THEME_RING, WORLD_UNLOCK_RATIO } from '../lib/game'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Icon } from '../components/ui/Icon'
import { Stars } from '../components/ui/Stars'

export function MapPage() {
  const { loading, error, worlds } = useKanjiData()
  const stageResults = useStageResults()
  const { profile } = useProfile()
  const dueCount = useDueCount()

  // Un mundo se abre cuando el anterior alcanza el porcentaje de etapas mínimo.
  const worldViews = useMemo(() => {
    const summaries = worlds.map((world) => {
      const cleared = world.stages.filter(
        (stage) => (stageResults.get(stage.id)?.stars ?? 0) > 0,
      ).length
      const stars = world.stages.reduce(
        (sum, stage) => sum + (stageResults.get(stage.id)?.stars ?? 0),
        0,
      )
      return {
        world,
        cleared,
        stars,
        ratio: world.stages.length ? cleared / world.stages.length : 0,
      }
    })
    return summaries.map((summary, index) => ({
      ...summary,
      unlocked: index === 0 || summaries[index - 1].ratio >= WORLD_UNLOCK_RATIO,
    }))
  }, [worlds, stageResults])

  if (loading) {
    return (
      <p className="animate-pop text-center text-[var(--muted)]">
        Preparando la aventura…
      </p>
    )
  }
  if (error) {
    return (
      <p className="rounded-3xl bg-rose-500/15 p-4 text-center text-rose-200">
        {error}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <section className="animate-pop overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 p-6 shadow-2xl shadow-fuchsia-900/40">
        <p className="text-sm font-bold uppercase tracking-wide text-white/80">
          Tu aventura de kanji
        </p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight text-white">
          Aprende los kanji en el orden en que se usan de verdad
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/85">
          Cada mundo es un curso de la escuela japonesa. Dentro, las etapas
          empiezan por los caracteres más frecuentes del idioma.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/repaso"
            className="pressable inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-violet-700 shadow-lg"
          >
            <Icon name="brain" className="h-5 w-5" />
            {dueCount > 0 ? `Repasar ${dueCount} kanji` : 'Practicar repaso'}
          </Link>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-black/20 px-4 py-2.5 text-sm font-bold text-white">
            <Icon name="flame" className="h-5 w-5 text-orange-300" />
            Racha de {profile.streakDays}{' '}
            {profile.streakDays === 1 ? 'día' : 'días'}
          </span>
        </div>
      </section>

      <div className="space-y-4">
        {worldViews.map(({ world, cleared, stars, ratio, unlocked }) => {
          const card = (
            <div
              className={`relative overflow-hidden rounded-[28px] border border-white/12 p-5 shadow-xl ${
                unlocked ? THEME_RING[world.theme] : 'shadow-black/20'
              } ${unlocked ? 'bg-white/5' : 'bg-white/[0.03]'}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br text-2xl font-extrabold text-white ${
                    THEME_GRADIENTS[world.theme]
                  } ${unlocked ? '' : 'grayscale'}`}
                >
                  {unlocked ? world.order : <Icon name="lock" className="h-6 w-6" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold text-white">
                      {world.name}
                    </h2>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                      {world.kanjiCount} kanji
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{world.subtitle}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar
                      value={ratio}
                      className="flex-1"
                      barClassName={`bg-gradient-to-r ${THEME_GRADIENTS[world.theme]}`}
                      label={`Progreso de ${world.name}`}
                    />
                    <span className="text-xs font-bold text-[var(--muted)]">
                      {cleared}/{world.stages.length}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
                    <Stars value={stars > 0 ? Math.min(3, Math.ceil(stars / world.stages.length)) : 0} size="w-4 h-4" />
                    {stars} estrellas conseguidas
                  </div>
                </div>
              </div>

              {!unlocked && (
                <p className="mt-4 rounded-2xl bg-black/30 px-4 py-2 text-center text-xs font-bold text-white/70">
                  Completa el {Math.round(WORLD_UNLOCK_RATIO * 100)}% del mundo
                  anterior para abrir este
                </p>
              )}
            </div>
          )

          return unlocked ? (
            <Link
              key={world.id}
              to={`/mundo/${world.id}`}
              className="pressable block"
            >
              {card}
            </Link>
          ) : (
            <div key={world.id} aria-disabled="true">
              {card}
            </div>
          )
        })}
      </div>
    </div>
  )
}
