import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { useProgressRows } from '../hooks/useGameState'
import { MASTERED_LEVEL } from '../lib/progress-service'

type SortMode = 'frequency' | 'strokes' | 'grade'

const GRADE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: '1', label: '1.º' },
  { value: '2', label: '2.º' },
  { value: '3', label: '3.º' },
  { value: '4', label: '4.º' },
  { value: '5', label: '5.º' },
  { value: '6', label: '6.º' },
  { value: '8', label: 'Secundaria' },
]

const PAGE_SIZE = 72

export function KanjiListPage() {
  const { loading, error, kanjis } = useKanjiData()
  const progressRows = useProgressRows()
  const [grade, setGrade] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('frequency')
  const [page, setPage] = useState(0)

  const levelByKanji = useMemo(
    () => new Map(progressRows.map((row) => [row.kanjiId, row.srsLevel])),
    [progressRows],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = kanjis.filter((k) => {
      if (grade && String(k.grade) !== grade) return false
      if (!needle) return true
      return (
        k.kanji === needle ||
        k.keyword.toLowerCase().includes(needle) ||
        k.meaning.toLowerCase().includes(needle)
      )
    })

    return [...list].sort((a, b) => {
      if (sort === 'strokes') return a.strokes - b.strokes
      if (sort === 'grade') return (a.grade ?? 9) - (b.grade ?? 9)
      return (
        (a.frequency ?? Number.MAX_SAFE_INTEGER) -
        (b.frequency ?? Number.MAX_SAFE_INTEGER)
      )
    })
  }, [kanjis, grade, query, sort])

  const visible = filtered.slice(0, (page + 1) * PAGE_SIZE)

  if (loading) return <p className="text-center text-[var(--muted)]">Cargando…</p>
  if (error) {
    return (
      <p className="rounded-3xl bg-rose-500/15 p-4 text-center text-rose-200">
        {error}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-white">Todos los kanji</h1>
        <p className="text-sm text-[var(--muted)]">
          {filtered.length} caracteres ordenados por importancia real en el idioma
        </p>
      </header>

      <div className="space-y-3 rounded-3xl border border-white/12 bg-white/5 p-4">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0)
          }}
          placeholder="Buscar por significado o pegar un kanji"
          className="w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-white placeholder:text-[var(--muted)] focus:border-violet-400 focus:outline-none"
        />

        <div className="flex flex-wrap gap-2">
          {GRADE_FILTERS.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => {
                setGrade(option.value)
                setPage(0)
              }}
              className={`pressable rounded-full px-3.5 py-1.5 text-xs font-extrabold ${
                grade === option.value
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                  : 'bg-white/10 text-[var(--muted)] hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
          Ordenar por
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-xl border border-white/12 bg-black/20 px-3 py-2 text-white focus:border-violet-400 focus:outline-none"
          >
            <option value="frequency">Más usados</option>
            <option value="strokes">Menos trazos</option>
            <option value="grade">Curso escolar</option>
          </select>
        </div>
      </div>

      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {visible.map((kanji) => {
          const level = levelByKanji.get(kanji.id) ?? -1
          const learned = level >= 1
          const mastered = level >= MASTERED_LEVEL
          return (
            <li key={kanji.id}>
              <Link
                to={`/kanji/${kanji.id}`}
                className={`pressable relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-3xl ${
                  mastered
                    ? 'border-amber-300/60 bg-amber-400/15 text-white'
                    : learned
                      ? 'border-emerald-400/50 bg-emerald-500/10 text-white'
                      : 'border-white/12 bg-white/5 text-white/85 hover:border-violet-400/60'
                }`}
                lang="ja"
                title={kanji.keyword}
              >
                {kanji.kanji}
              </Link>
            </li>
          )
        })}
      </ul>

      {visible.length < filtered.length && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="pressable w-full rounded-2xl border border-white/15 bg-white/5 py-3 font-extrabold text-white"
        >
          Ver más
        </button>
      )}
    </div>
  )
}
