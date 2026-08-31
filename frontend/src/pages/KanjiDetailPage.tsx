import { Link, useLocation, useParams } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { useProgressRows } from '../hooks/useGameState'
import { MASTERED_LEVEL } from '../lib/progress-service'
import { StoryCard } from '../components/StoryCard'
import { PhotoCard } from '../components/PhotoCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Icon } from '../components/ui/Icon'
import { uniquePhotosByFile } from '../lib/photos'

interface DetailLocationState {
  from?: string
}

/** Only allow same-app absolute paths (blocks open redirects). */
function safeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}

export function KanjiDetailPage() {
  const { id: idParam } = useParams()
  const location = useLocation()
  const id = Number(idParam)
  const {
    loading,
    error,
    getKanjiById,
    vocabByKanjiId,
    sentencesByKanjiId,
    photosByKanjiId,
    mediaMap,
  } = useKanjiData()
  const progressRows = useProgressRows()

  const kanji = Number.isFinite(id) ? getKanjiById(id) : undefined
  const progress = progressRows.find((row) => row.kanjiId === id)
  const vocab = kanji ? (vocabByKanjiId.get(kanji.id) ?? []) : []
  const sentences = kanji ? (sentencesByKanjiId.get(kanji.id) ?? []) : []
  const photos = uniquePhotosByFile(
    kanji ? (photosByKanjiId.get(kanji.id) ?? []) : [],
  )
  const returnTo = safeReturnPath(
    (location.state as DetailLocationState | null)?.from,
  )

  if (loading) return <p className="text-center text-[var(--muted)]">Cargando…</p>
  if (error) {
    return (
      <p className="rounded-3xl bg-rose-500/15 p-4 text-center text-rose-200">
        {error}
      </p>
    )
  }
  if (!kanji) {
    return (
      <p className="text-center text-[var(--muted)]">
        No encontramos ese kanji.{' '}
        <Link to="/kanjis" className="font-bold text-violet-300">
          Ver la lista
        </Link>
      </p>
    )
  }

  const srsLevel = progress?.srsLevel ?? 0

  return (
    <div className="space-y-5">
      <Link
        to={returnTo ?? '/kanjis'}
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--muted)] hover:text-white"
      >
        <Icon name="back" className="h-4 w-4" />
        {returnTo ? 'Volver a la lección' : 'Todos los kanji'}
      </Link>

      <StoryCard
        kanji={kanji}
        mediaMap={mediaMap}
        vocab={vocab}
        sentences={sentences}
      />

      {photos.length > 0 && (
        <section className="space-y-3 rounded-3xl border border-white/12 bg-white/5 p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Así se ve en Japón
          </h2>
          {photos.slice(0, 2).map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </section>
      )}

      <section className="rounded-3xl border border-white/12 bg-white/5 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Tu memoria de este kanji
          </h2>
          <span className="text-xs font-bold text-white">
            Nivel {srsLevel}/{MASTERED_LEVEL}
          </span>
        </div>
        <ProgressBar
          value={srsLevel / MASTERED_LEVEL}
          barClassName="bg-gradient-to-r from-emerald-400 to-amber-300"
          label="Nivel de memoria"
        />
        <p className="mt-2 text-xs text-[var(--muted)]">
          {progress
            ? `Próximo repaso: ${new Date(progress.nextReview).toLocaleDateString('es')}`
            : 'Todavía no lo has practicado en un juego.'}
        </p>
      </section>

      {vocab.length > 1 && (
        <section className="rounded-3xl border border-white/12 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Palabras que lo usan
          </h2>
          <ul className="space-y-2">
            {vocab.slice(0, 12).map((word) => (
              <li
                key={word.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/8 pb-2 last:border-0"
              >
                <span className="text-lg text-white" lang="ja">
                  {word.expression}
                  {word.reading && (
                    <span className="ml-2 text-sm text-[var(--muted)]">
                      {word.reading}
                    </span>
                  )}
                </span>
                <span className="text-sm text-[var(--muted)]">{word.glossary}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            Las traducciones de los ejemplos vienen en inglés desde Kanji alive.
          </p>
        </section>
      )}
    </div>
  )
}
