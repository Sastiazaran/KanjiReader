import { NavLink, Outlet } from 'react-router-dom'
import { Icon, type IconName } from './ui/Icon'
import { ProgressBar } from './ui/ProgressBar'
import { useDueCount, useProfile } from '../hooks/useGameState'

const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Mapa', icon: 'map' },
  { to: '/repaso', label: 'Repaso', icon: 'brain' },
  { to: '/kanjis', label: 'Kanji', icon: 'book' },
  { to: '/perfil', label: 'Perfil', icon: 'trophy' },
]

export function Layout() {
  const { profile, level } = useProfile()
  const dueCount = useDueCount()

  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-extrabold text-white shadow-lg shadow-fuchsia-500/30">
              {level.level}
            </span>
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Nivel
              </p>
              <p className="text-sm font-bold text-white">{profile.xp} XP</p>
            </div>
          </div>

          <div className="flex-1">
            <ProgressBar
              value={level.progress}
              label={`Progreso al nivel ${level.level + 1}`}
              barClassName="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-violet-400 animate-shine"
            />
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              {level.xpIntoLevel}/{level.xpForNext} XP para el nivel{' '}
              {level.level + 1}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl bg-orange-500/15 px-3 py-2 text-orange-300">
            <Icon name="flame" className="h-5 w-5" />
            <span className="text-sm font-bold">{profile.streakDays}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 glass">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `pressable relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[11px] font-bold ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-[var(--muted)] hover:text-white'
                }`
              }
            >
              <Icon name={item.icon} className="h-6 w-6" />
              {item.label}
              {item.to === '/repaso' && dueCount > 0 && (
                <span className="absolute right-3 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white">
                  {dueCount > 99 ? '99+' : dueCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
