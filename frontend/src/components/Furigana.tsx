import type { JapaneseToken } from '../types/data'

interface FuriganaProps {
  tokens: JapaneseToken[]
  /** Oculta las lecturas para practicar leer sin ayuda. */
  hideReadings?: boolean
  /** Resalta la palabra marcada como objetivo. */
  highlightTarget?: boolean
  className?: string
}

/**
 * Pinta japonés con furigana usando `<ruby>`, que es lo que hacen los libros
 * infantiles: la lectura pequeñita encima de los kanji.
 */
export function Furigana({
  tokens,
  hideReadings = false,
  highlightTarget = true,
  className = 'text-3xl',
}: FuriganaProps) {
  return (
    <p className={`leading-[2.1] text-white ${className}`} lang="ja">
      {tokens.map((token, index) => {
        const highlight = highlightTarget && token.isTarget
        const tokenClass = highlight
          ? 'rounded-lg bg-amber-300/25 px-0.5 text-amber-100'
          : undefined

        if (!token.reading || hideReadings) {
          return (
            <span key={index} className={tokenClass}>
              {token.surface}
            </span>
          )
        }

        return (
          <ruby key={index} className={tokenClass}>
            {token.surface}
            <rp>（</rp>
            <rt className="text-[0.42em] text-[var(--muted)]">{token.reading}</rt>
            <rp>）</rp>
          </ruby>
        )
      })}
    </p>
  )
}
