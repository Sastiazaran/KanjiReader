import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useProfile,
  useProgressRows,
  useStageResults,
  useUnlockedBadges,
} from '../hooks/useGameState'
import { useKanjiData } from '../hooks/useKanjiData'
import { BADGES, THEME_GRADIENTS } from '../lib/game'
import { MASTERED_LEVEL, resetAllProgress } from '../lib/progress-service'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Icon } from '../components/ui/Icon'
import { Stars } from '../components/ui/Stars'

export function ProfilePage() {
  const { profile, level } = useProfile()
  const progressRows = useProgressRows()
  const stageResults = useStageResults()
  const unlockedBadges = useUnlockedBadges()
  const { worlds } = useKanjiData()
  const [confirmReset, setConfirmReset] = useState(false)

  const learned = progressRows.filter((row) => row.srsLevel >= 1).length
  const mastered = progressRows.filter((row) => row.srsLevel >= MASTERED_LEVEL).length
  const accuracy = profile.totalAnswers
    ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100)
    : 0
  const totalStars = [...stageResults.values()].reduce((s, r) => s + r.stars, 0)

  const stats = [
    { label: 'Kanji aprendidos', value: learned },
    { label: 'Kanji dominados', value: mastered },
    { label: 'Aciertos', value: `${accuracy}%` },
    { label: 'Mejor combo', value: profile.bestCombo },
  ]

  return (
    <div className="space-y-5">
      <header className="animate-pop rounded-[28px] bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-6 shadow-2xl shadow-violet-900/40">
        <div className="flex items-center gap-4">
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white/15 text-3xl font-extrabold text-white">
            {level.level}
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-white">Tu progreso</h1>
            <p className="text-sm text-white/85">{profile.xp} XP en total</p>
            <ProgressBar
              value={level.progress}
              className="mt-2"
              barClassName="bg-white"
              label="Progreso de nivel"
            />
            <p className="mt-1 text-xs text-white/80">
              {level.xpIntoLevel}/{level.xpForNext} XP para el nivel {level.level + 1}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-white">
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-black/25 px-3 py-1.5">
            <Icon name="flame" className="h-4 w-4 text-orange-300" />
            {profile.streakDays} días seguidos
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-black/25 px-3 py-1.5">
            <Icon name="star" className="h-4 w-4 text-amber-300" />
            {totalStars} estrellas
          </span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/12 bg-white/5 p-4 text-center"
          >
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs font-bold text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/12 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
          Insignias
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BADGES.map((badge) => {
            const owned = unlockedBadges.has(badge.id)
            return (
              <div
                key={badge.id}
                className={`rounded-2xl p-3 text-center ${
                  owned
                    ? 'bg-gradient-to-br from-amber-400/25 to-orange-500/20'
                    : 'bg-white/5 opacity-60'
                }`}
              >
                <Icon
                  name="trophy"
                  className={`mx-auto h-7 w-7 ${
                    owned ? 'text-amber-300' : 'text-white/25'
                  }`}
                />
                <p className="mt-1 text-xs font-extrabold text-white">
                  {badge.name}
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  {badge.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-white/12 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
          Mundos
        </h2>
        <ul className="space-y-2">
          {worlds.map((world) => {
            const cleared = world.stages.filter(
              (stage) => (stageResults.get(stage.id)?.stars ?? 0) > 0,
            ).length
            const stars = world.stages.reduce(
              (sum, stage) => sum + (stageResults.get(stage.id)?.stars ?? 0),
              0,
            )
            return (
              <li key={world.id}>
                <Link
                  to={`/mundo/${world.id}`}
                  className="pressable flex items-center gap-3 rounded-2xl bg-white/5 p-3"
                >
                  <span
                    className={`h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br ${
                      THEME_GRADIENTS[world.theme]
                    }`}
                  />
                  <span className="flex-1 text-sm font-bold text-white">
                    {world.name}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {cleared}/{world.stages.length}
                  </span>
                  <Stars
                    value={
                      world.stages.length
                        ? Math.min(3, Math.round(stars / world.stages.length))
                        : 0
                    }
                    size="w-4 h-4"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-3xl border border-white/12 bg-white/5 p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
          Datos guardados en este dispositivo
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Todo tu progreso vive en el navegador. Puedes borrarlo y empezar de cero.
        </p>
        {confirmReset ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                await resetAllProgress()
                setConfirmReset(false)
              }}
              className="pressable rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-extrabold text-white"
            >
              Sí, borrar todo
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="pressable rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="pressable mt-3 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white"
          >
            Reiniciar progreso
          </button>
        )}
        <p className="mt-4 text-xs text-[var(--muted)]">
          <Link to="/creditos" className="font-bold text-violet-300">
            Créditos y licencias de los datos
          </Link>
        </p>
      </section>
    </div>
  )
}
