# Backend KanjiReader (Fase 2)

API prevista para autenticación y sincronización de progreso. Aún no implementada; el MVP usa solo el frontend con IndexedDB.

## Estructura sugerida

```text
backend/
  src/
    index.ts
    db/
      postgres.ts
    middleware/
      auth.ts
    routes/
      auth.ts
      kanji.ts
      progress.ts
    controllers/
      authController.ts
      kanjiController.ts
      progressController.ts
    models/
      User.ts
      Progress.ts
  .env
```

## Variables de entorno (ejemplo)

- `DATABASE_URL` — PostgreSQL
- `JWT_SECRET` — firma de tokens
- `PORT` — por defecto `3000`
- `JADB_SQLITE_PATH` — ruta a `jadb.sqlite` si el servidor lee el diccionario desde SQLite
- `CORS_ORIGIN` — origen del frontend (p. ej. `http://localhost:5173`)

## Contrato HTTP (borrador)

| Método y ruta | Descripción |
|---------------|-------------|
| `POST /auth/register` | Body: `{ email, password }`. Crea usuario; responde `{ token, user }`. |
| `POST /auth/login` | Body: `{ email, password }`. Responde `{ token, user }`. |
| `GET /api/kanjis?level=N5` | Lista kanjis filtrados por JLPT (datos desde jadb o JSON cache). |
| `GET /api/kanjis/:id` | Detalle + vocabulario relacionado. |
| `GET /api/progress` | Header `Authorization: Bearer <jwt>`. Lista progreso del usuario. |
| `POST /api/progress` | Actualiza o crea una fila de progreso: `{ kanjiId, srsLevel, nextReview, lastSeen }`. |
| `POST /api/sync` | Body: `{ items: ProgressRow[] }`. Fusión por `updatedAt` / `kanjiId` en servidor. |

## Modelo PostgreSQL (referencia)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kanji_id INTEGER NOT NULL,
  srs_level INTEGER NOT NULL DEFAULT 0,
  next_review_date TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  updated_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, kanji_id)
);
```

## Cliente frontend (Fase 2)

- Guardar JWT (p. ej. `localStorage` o memoria + refresh).
- `axios` interceptors para adjuntar `Authorization`.
- Tras login: fusionar respuesta de `GET /api/progress` con tablas Dexie locales (`offline-first`).
