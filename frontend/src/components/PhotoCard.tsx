import type { PhotoRecord } from '../types/data'
import { Icon } from './ui/Icon'

interface PhotoCardProps {
  photo: PhotoRecord
  /** Oculta la explicación hasta que se pulsa (modo «adivina qué dice»). */
  quiz?: boolean
  onReveal?: () => void
  revealed?: boolean
}

/**
 * Foto real de Japón con el texto que se puede leer, su lectura y por qué suena
 * así. La autoría va siempre pegada a la imagen, como pide la licencia.
 *
 * Las fotos no son 4:3: hay retratos, panorámicas y apaisadas. Se muestra el
 * archivo entero (`object-contain`) y el marco sigue su proporción.
 */
export function PhotoCard({ photo, quiz, revealed = true, onReveal }: PhotoCardProps) {
  const showAnswer = !quiz || revealed

  return (
    <figure className="overflow-hidden rounded-3xl border border-white/12 bg-black/25">
      <div className="bg-black">
        <img
          src={photo.file}
          alt={
            showAnswer
              ? `${photo.where}: cartel con el texto ${photo.text}`
              : 'Foto de un cartel en Japón'
          }
          loading="lazy"
          className="mx-auto block h-auto max-h-[min(70svh,40rem)] w-auto max-w-full object-contain"
        />
      </div>

      <figcaption className="space-y-2 p-4">
        {showAnswer ? (
          <>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl text-white" lang="ja">
                {photo.text}
              </span>
              <span className="text-sm text-[var(--muted)]" lang="ja">
                {photo.textReading}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-white/85">
              {photo.caption}
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={onReveal}
            className="pressable inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white"
          >
            <Icon name="sparkle" className="h-4 w-4 text-amber-300" />
            Ver qué dice
          </button>
        )}

        <p className="text-[11px] text-[var(--muted)]">
          {photo.where} · Foto de {photo.credit.author} ·{' '}
          <a
            href={photo.credit.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-white"
          >
            {photo.credit.license}
          </a>
        </p>
      </figcaption>
    </figure>
  )
}
