import { Link } from 'react-router-dom'
import { useKanjiData } from '../hooks/useKanjiData'
import { uniquePhotosByFile } from '../lib/photos'
import { Icon } from '../components/ui/Icon'

const DONATE_URL =
  'https://www.paypal.com/donate/?hosted_button_id=26C3BSMGJGESY'

const SOURCES = [
  {
    name: 'KANJIDIC2',
    detail:
      'Significados, lecturas, número de trazos, curso escolar y frecuencia de uso.',
    license: 'Licencia EDRDG',
    url: 'https://www.edrdg.org/wiki/index.php/KANJIDIC_Project',
  },
  {
    name: 'RADKFILE',
    detail: 'Descomposición en componentes, la base de nuestras historias.',
    license: 'Licencia EDRDG',
    url: 'https://www.edrdg.org/krad/kradinf.html',
  },
  {
    name: 'Kanji alive',
    detail: 'Audio de palabras, animaciones de trazos e imágenes SVG.',
    license: 'CC BY 4.0',
    url: 'https://kanjialive.com',
  },
  {
    name: 'jadb',
    detail: 'Proyecto de referencia para reunir los datos abiertos japoneses.',
    license: 'Código MIT',
    url: 'https://git.pvv.ntnu.no/mugiten/jadb',
  },
  {
    name: 'Wikimedia Commons',
    detail: 'Fotos de carteles, estaciones y calles de Japón (sección «Kanji en la calle»).',
    license: 'Varias licencias libres',
    url: 'https://commons.wikimedia.org',
  },
]

export function AboutPage() {
  const { photos } = useKanjiData()
  const gallery = uniquePhotosByFile(photos)

  return (
    <div className="space-y-5">
      <header className="animate-pop rounded-[28px] bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-6 shadow-2xl shadow-teal-900/40">
        <h1 className="text-2xl font-extrabold text-white">Créditos</h1>
        <p className="mt-1 text-sm text-white/85">
          KanjiReader se construye solo con datos y medios abiertos.
        </p>
      </header>

      <section className="space-y-3">
        {SOURCES.map((source) => (
          <a
            key={source.name}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="pressable block rounded-3xl border border-white/12 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-extrabold text-white">{source.name}</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[var(--muted)]">
                {source.license}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{source.detail}</p>
          </a>
        ))}
      </section>

      <section className="rounded-3xl border border-white/12 bg-white/5 p-5 text-sm text-[var(--muted)]">
        <div className="mb-2 flex items-center gap-2 text-white">
          <Icon name="sparkle" className="h-5 w-5 text-amber-300" />
          <h2 className="font-extrabold">Cómo se arman las historias</h2>
        </div>
        <p>
          Cada kanji se separa en sus componentes usando RADKFILE. A esas piezas
          les damos un nombre sencillo en español y las combinamos en una frase
          corta que ayuda a recordar el significado. No son etimologías
          históricas: son trucos de memoria pensados para quien empieza.
        </p>
        <p className="mt-3">
          Las <strong className="text-white">frases de ejemplo</strong> y los{' '}
          <strong className="text-white">cuentos</strong> están escritos para este
          proyecto: los cuentos solo usan kanji que ya se han estudiado, como los
          libros de lectura graduada. La explicación de cuándo suena on y cuándo
          kun se calcula comparando la palabra con las lecturas de KANJIDIC2.
        </p>
      </section>

      {gallery.length > 0 && (
        <section className="rounded-3xl border border-white/12 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Fotos de «Kanji en la calle»
          </h2>
          <ul className="space-y-2 text-[13px]">
            {gallery.map((photo) => (
              <li
                key={photo.id}
                className="flex flex-wrap items-baseline gap-x-2 border-b border-white/8 pb-2 last:border-0"
              >
                <span className="text-white" lang="ja">
                  {photo.text}
                </span>
                <span className="text-[var(--muted)]">
                  {photo.credit.author} ·{' '}
                  <a
                    href={photo.credit.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-white"
                  >
                    {photo.credit.license}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-3xl border border-white/8 bg-white/[0.03] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white/80">
              ¿Te está ayudando a aprender?
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
              Si quieres, puedes invitarme un café. Es opcional y mantiene el
              proyecto vivo.
            </p>
          </div>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noreferrer"
            className="pressable inline-flex shrink-0 items-center gap-2 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-100 hover:bg-rose-500/20"
          >
            <Icon name="heart" className="h-4 w-4 text-rose-300" />
            Invítame un café
          </a>
        </div>
      </section>

      <Link
        to="/perfil"
        className="pressable inline-flex items-center gap-1 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white"
      >
        <Icon name="back" className="h-4 w-4" />
        Volver al perfil
      </Link>
    </div>
  )
}
