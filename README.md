# KanjiReader

App web para aprender kanji jugando: un **mapa de mundos** por curso escolar japonés,
etapas ordenadas por **frecuencia real de uso**, **historias mnemotécnicas** generadas a
partir de los componentes de cada carácter, minijuego de preguntas con vidas y combos,
XP, niveles, rachas, insignias y repaso espaciado (SRS Leitner) en **IndexedDB**.

Stack: **React 19**, **TypeScript**, **Vite 8**, **Tailwind 4**, **Dexie** (+ `dexie-react-hooks`),
**react-router-dom**.

## Cómo funciona el aprendizaje

| Concepto | Qué es |
|----------|--------|
| **Mundo** | Un curso escolar japonés (1.º a 6.º de primaria y cuatro bloques de secundaria). |
| **Etapa** | Seis kanji del mundo, empezando siempre por los más frecuentes del idioma. |
| **Historia** | Frase mnemotécnica en español construida con los componentes del kanji (RADKFILE). |
| **Partida** | Preguntas de opción múltiple (kanji → significado, significado → kanji, lectura) con 3 vidas, combos y XP. |
| **Repaso** | Cola diaria con intervalos Leitner: 1, 3, 7, 14 y 30 días. |
| **Progreso** | XP, nivel, racha diaria, estrellas por etapa e insignias, todo en el navegador. |

## Frontend

```bash
cd frontend
npm install
npm run export-data    # genera public/data/*.json (requiere vendor/, ver vendor/README.md)
npm run dev
```

Abre `http://localhost:5173`. En desarrollo, los medios de `vendor/kanji-data-media` se
sirven bajo `/kanji-media` (ver `vite.config.ts`).

### Scripts útiles

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `frontend/dist` |
| `npm run lint` | ESLint (incluye reglas del compilador de React) |
| `npm run export-data` | Regenera `kanjis.json`, `vocab.json`, `media-map.json` y `curriculum.json` |

### Datos generados (`frontend/public/data`)

| Archivo | Contenido |
|---------|-----------|
| `kanjis.json` | 2 136 kanji jōyō con lecturas, significados en español, grado escolar, frecuencia, componentes e historia. |
| `vocab.json` | Palabras de ejemplo por kanji (glosas en inglés, de Kanji alive). |
| `media-map.json` | Relación kanji → archivos de audio, animación MP4 y trazos SVG. |
| `curriculum.json` | Mundos y etapas ya ordenados por nivel e importancia. |

### Variables de entorno (opcional)

| Variable | Uso |
|----------|-----|
| `VITE_KANJI_MEDIA_BASE` | URL base para MP3/MP4/SVG en producción (p. ej. un CDN). En dev se usa `/kanji-media`. |

En el script de exportación:

| Variable | Descripción |
|----------|-------------|
| `KANJIDIC2_PATH` | Ruta a `kanjidic2.xml` (por defecto `vendor/jadb/data/tmp/kanjidic2.xml`) |
| `RADKFILE_PATH` | Ruta a `radkfile_utf8` (por defecto `vendor/jadb/data/tmp/radkfile_utf8`) |
| `KA_DATA_PATH` | Ruta a `ka_data.csv` de Kanji alive |
| `DATA_OUT_DIR` | Carpeta de salida (por defecto `frontend/public/data`) |

## Estructura del frontend

```text
src/
  components/        Layout, StoryCard, QuizGame, StrokeOrder, AudioPlayer, ui/
  context/           Carga de los JSON y acceso a kanji, mundos y vocabulario
  db/db.ts           Dexie v2: progress, profile, stageResults, badges
  hooks/             useKanjiData, useGameState (perfil, etapas, cola de repaso)
  lib/game.ts        XP, niveles, estrellas, insignias, temas de color
  lib/quiz.ts        Generación de preguntas y distractores
  lib/progress-service.ts  SRS, sesiones, insignias y reinicio de progreso
  pages/             Mapa, Mundo, Etapa, Lista, Ficha, Repaso, Perfil, Créditos
scripts/
  export-data.mjs    Pipeline de datos
  lib/story.mjs      Generador de historias
  lib/component-names.mjs  Nombres en español de los 253 componentes de RADKFILE
```

## Backend (Fase 2)

Borrador de API y estructura: [`backend/README.md`](backend/README.md).

## Datos locales (`vendor/`)

Resumen en [`vendor/README.md`](vendor/README.md): clones de **jadb** y **kanji-data-media**,
audio y animaciones.

La exportación **no depende de `jadb.sqlite`**: usa KANJIDIC2 + RADKFILE + `ka_data.csv`.

## Licencias

- **KANJIDIC2 y RADKFILE (EDRDG):** ver [EDRDG](https://www.edrdg.org/).
- **Kanji alive** (medios y `ka_data.csv`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — atribución en la app (página Créditos).
- Las historias mnemotécnicas se generan en este repositorio a partir de la
  descomposición de RADKFILE; no son etimologías históricas.
