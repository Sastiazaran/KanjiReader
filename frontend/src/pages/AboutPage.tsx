import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'

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
]

export function AboutPage() {
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
