# CLAUDE.md — Backend Project Reference

## Project Overview

REST API для управления заметками (Notes CRUD) с session-based аутентификацией.
Express.js + TypeScript + Prisma 7 + PostgreSQL.

## Tech Stack

| Инструмент | Версия | Примечание |
|---|---|---|
| Express | 5.x | |
| TypeScript | 5.x | |
| Prisma | 7.x | Новый API — см. ниже |
| PostgreSQL | 17 | |
| Zod | 4.x | Валидация входных данных |
| tsx | 4.x | Запуск TS без компиляции (dev + prod) |
| express-session | latest | Сессии |
| connect-pg-simple | latest | Хранилище сессий в PostgreSQL |
| bcryptjs | latest | Хэширование паролей |
| Node | 24 | |

## Directory Structure

```
backend/
  src/
    app.ts                    # Express app: CORS, session, middlewares, routes
    server.ts                 # Точка входа: dotenv + listen
    db.ts                     # pg.Pool singleton — используется в prisma.ts и connect-pg-simple
    prisma.ts                 # Singleton PrismaClient (через pool из db.ts + PrismaPg adapter)
    types/
      session.d.ts            # Расширение типов express-session (userId, role)
    controllers/
      auth.ts                 # register, login, logout, me
      notes.ts                # CRUD handlers, фильтрация по userId
    routes/
      auth.ts                 # /api/v1/auth/*
      notes.ts                # /api/v1/notes/* (все роуты защищены requireAuth)
    middleware/
      errorHandler.ts         # AppError class + глобальный error handler
      validate.ts             # Zod middleware — validate(schema)
      requireAuth.ts          # Проверяет req.session.userId, иначе 401
      requireRole.ts          # Проверяет req.session.role, иначе 403
    schemas/
      note.ts                 # createNoteSchema, updateNoteSchema, patchNoteSchema
      auth.ts                 # registerSchema, loginSchema
    generated/
      prisma/                 # Auto-generated Prisma client — НЕ редактировать вручную
  prisma/
    schema.prisma             # Схема БД (модели Note, User, enum Role)
    migrations/               # SQL миграции
  prisma.config.ts            # Конфиг Prisma 7 (DATABASE_URL, schema path)
  Dockerfile                  # node:24-alpine, tsx runtime, entrypoint.sh
  docker-compose.yml          # services: db (postgres:17), backend
  entrypoint.sh               # prisma migrate deploy -> tsx src/server.ts
  .env                        # DATABASE_URL, DB_PASSWORD, PORT, SESSION_SECRET (не в git)
  .env.example                # Шаблон переменных окружения
  tsconfig.json               # CommonJS, ES2020, outDir: dist
```

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | нет | Регистрация. Body: `{email, password}` |
| POST | `/login` | нет | Вход. Body: `{email, password}` |
| POST | `/logout` | да | Выход, уничтожает сессию |
| GET | `/me` | да | Данные текущего пользователя |

### Notes — `/api/v1/notes` (все роуты требуют авторизации)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Заметки текущего пользователя (orderBy createdAt desc) |
| GET | `/:id` | Заметка по ID (только своя) |
| POST | `/` | Создать заметку |
| PUT | `/:id` | Полное обновление (только своя) |
| PATCH | `/:id` | Частичное обновление (только своя) |
| DELETE | `/:id` | Удалить (только свою) |

## Модели БД

### User
```typescript
{
  id:           number   // autoincrement
  email:        string   // unique
  passwordHash: string   // никогда не возвращать клиенту
  role:         Role     // USER | ADMIN, default: USER
  createdAt:    Date
  updatedAt:    Date
  notes:        Note[]
}
```

### Note
```typescript
{
  id:        number
  title:     string   // min 1, max 255
  content:   string   // min 1
  userId:    number   // FK -> User.id
  createdAt: Date
  updatedAt: Date
}
```

## Prisma 7 — Важные особенности

- **Generator**: `provider = "prisma-client"` (НЕ `prisma-client-js` как в Prisma <6)
- **Config**: `prisma.config.ts` — DATABASE_URL задаётся здесь, НЕ в `schema.prisma`
- **Datasource** в `schema.prisma` НЕ содержит `url` — только `provider = "postgresql"`
- **Adapter**: используется `@prisma/adapter-pg` (PrismaPg) вместе с `pg.Pool` из `src/db.ts`
- **Клиент** импортируется из `./src/generated/prisma/client`
- **Generate**: `npx prisma generate` — после изменений схемы
- **Миграции**: `npx prisma migrate dev --name <name>` (dev) / `npx prisma migrate deploy` (prod)

## Сессии

- Хранилище: PostgreSQL таблица `session` (создаётся автоматически через `createTableIfMissing: true`)
- Конфиг в `src/app.ts`: `resave: false`, `saveUninitialized: false`
- Cookie: `httpOnly: true`, `secure: false` (для production за HTTPS nginx поставить `true`)
- Срок жизни: 7 дней
- В сессии хранится: `userId`, `role`
- Типы расширены в `src/types/session.d.ts`

## Роли (готово к расширению)

- Enum `Role` в схеме: `USER`, `ADMIN`
- Роль записывается в сессию при login/register
- Middleware `requireRole('ADMIN')` — проверяет `req.session.role`
- Пример использования: `router.get('/admin', requireAuth, requireRole('ADMIN'), handler)`

## Dev Commands

```bash
npm run dev      # nodemon + tsx (hot reload)
npm run prod     # tsx src/server.ts (без компиляции)
npm run build    # tsc -> dist/
npm start        # node dist/server.js (после build)
```

## Docker

```bash
docker-compose up -d --build       # первый запуск
docker-compose logs -f backend     # логи
docker-compose up -d --build backend  # перезапуск после изменений
```

Entrypoint автоматически применяет миграции (`prisma migrate deploy`) перед стартом.

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/notes_db"
DB_PASSWORD=PASSWORD
PORT=3000
SESSION_SECRET=your_very_long_random_secret_here
```

В Docker: `DATABASE_URL` использует имя сервиса `db` вместо `localhost`.
`SESSION_SECRET` — обязательно поменять на длинную случайную строку в production.

## CORS

Разрешённые origins (`src/app.ts`):
- `http://localhost:5173` (фронтенд dev)
- `http://94.176.182.194` (production VPS)

`credentials: true` — обязательно, иначе cookie не передаётся с фронтенда.
Фронтенд должен использовать `credentials: 'include'` в fetch / `withCredentials: true` в axios.

## Error Handling

- `AppError(statusCode, message)` — кастомные ошибки
- `401` — не авторизован (нет сессии)
- `403` — нет доступа (чужая заметка или не та роль)
- `409` — email уже занят при регистрации
- Zod валидация: `400` с `errors: [{field, message}]`

## Architecture Patterns

- **package.json type**: `"commonjs"` (ESM не используется)
- **tsx runtime**: TypeScript запускается без компиляции (dev + prod/Docker)
- **db.ts**: единый `pg.Pool`, шарится между Prisma и connect-pg-simple
- **passwordHash** никогда не включать в ответы — всегда использовать `select: { passwordHash: false }` или явный select без него
- Добавление новых ресурсов: schema -> migrate -> generate -> controller -> route -> app.ts
