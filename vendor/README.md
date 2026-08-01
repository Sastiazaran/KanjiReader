# Datos externos (open source)

## kanji-data-media

- **Repo:** https://github.com/kanjialive/kanji-data-media (CC BY 4.0)
- **Estado en esta máquina:**
  - **Audio:** `kanji-data-media/examples-audio/mp3/` — ~10 187 archivos `.mp3` (descargados desde `https://media.kanjialive.com/examples_audio/audio-mp3.zip`).
  - **Animaciones MP4:** `kanji-data-media/kanji-animations/mp4/kanji-animations/` — extraídos de `animations-mp4.zip`.
  - **Trazos SVG:** `kanji-data-media/kanji-strokes/strokes/` — extraídos de `kanji_strokes.zip`.
  - **Metadatos:** `kanji-data-media/language-data/ka_data.csv` (prefijos romanizados para enlazar kanji ↔ archivos de audio).

Los MP3 completos **no** vienen en el clon de Git; hay que descargar el ZIP del CDN (como ya se hizo aquí) o seguir el README en `examples-audio/`.

## jadb

- **Repo:** https://git.pvv.ntnu.no/mugiten/jadb (código MIT, datos con licencias EDRDG / varias).
- **No se distribuye `jadb.sqlite` en el repo:** hay que generarla.
- En `jadb/data/tmp/` están descargados (regenerables) los ficheros usados por el volcado:
  - `JMdict.xml` / variantes, `kanjidic2.xml`, `radkfile_utf8`.

### Generar `jadb.sqlite` con Dart (puede fallar con JMdict muy reciente)

Desde `vendor/jadb`:

```bash
export PATH="/opt/homebrew/bin:$PATH"   # o donde tengas dart-sdk
dart pub get
rm -f jadb.sqlite
for f in $(ls migrations/*.sql | sort); do sqlite3 jadb.sqlite < "$f"; done
JADB_PATH="$(pwd)/jadb.sqlite" dart run jadb create-db --libsqlite /opt/homebrew/opt/sqlite/lib/libsqlite3.dylib
```

En macOS, `radkfile` requiere UTF-8:

```bash
iconv -f EUC-JP -t UTF-8 data/tmp/radkfile > data/tmp/radkfile_utf8
```

**Problema conocido (marzo 2026):** el XML actual de JMdict puede provocar inserciones duplicadas que chocan con restricciones `UNIQUE` del esquema jadb (`JMdict_SenseGlossary`, `JMdict_SenseSeeAlso`, etc.). Si falla, opciones:

- Construir con el **flake Nix** del propio repo jadb (entorno reproducible).
- Vigilar actualizaciones en el repo jadb o usar un snapshot de JMdict compatible si el proyecto lo documenta.

### Reconstruir `data/tmp` desde EDRDG

URLs usadas en el flake oficial de jadb:

- `http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz` o `JMdict.gz`
- `https://www.edrdg.org/kanjidic/kanjidic2.xml.gz`
- `http://ftp.edrdg.org/pub/Nihongo/radkfile.gz`

Tras `gzip -dk`, renombrar el XML de diccionario a `JMdict.xml` y generar `radkfile_utf8` con `iconv` como arriba.

## Variables para el frontend (`npm run export-data`)

Definibles en el entorno al ejecutar el script (desde `frontend/`):

| Variable | Por defecto |
|----------|-------------|
| `KANJIDIC2_PATH` | `../vendor/jadb/data/tmp/kanjidic2.xml` |
| `RADKFILE_PATH` | `../vendor/jadb/data/tmp/radkfile_utf8` |
| `KA_DATA_PATH` | `../vendor/kanji-data-media/language-data/ka_data.csv` |
| `DATA_OUT_DIR` | `frontend/public/data` |

`radkfile_utf8` es **obligatorio**: de ahí sale la descomposición en componentes con la
que se construyen las historias mnemotécnicas de la app.

## Medios en Vite (desarrollo)

El archivo [`frontend/vite.config.ts`](../frontend/vite.config.ts) monta `vendor/kanji-data-media` en **`/kanji-media`** con soporte HTTP Range (`206` / `Accept-Ranges`), necesario para que Safari reproduzca los MP4 de trazos. En producción, define `VITE_KANJI_MEDIA_BASE` apuntando a un origen que sirva esos archivos (o un subconjunto) **también con Range**.
