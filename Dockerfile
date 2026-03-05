# ──────────────────────────────────────────
# Этап 1: сборка (builder)
# ──────────────────────────────────────────
# FROM — берём готовый базовый образ с Node.js 24.
# alpine — облегчённая версия Linux (~5MB вместо ~200MB).
FROM node:24-alpine AS builder

# WORKDIR — рабочая папка внутри контейнера.
# Все следующие команды выполняются отсюда.
WORKDIR /app

# Копируем только package.json сначала — чтобы Docker кешировал зависимости.
# Если код изменился но package.json нет — npm install не запустится заново.
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Устанавливаем ВСЕ зависимости (включая dev) — они нужны для сборки
RUN npm install

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY tsconfig.json ./
COPY src ./src/

# Компилируем TypeScript → JavaScript в папку dist/
RUN npm run build

# ──────────────────────────────────────────
# Этап 2: продакшн образ
# ──────────────────────────────────────────
# Начинаем чистый образ — без исходников и dev-зависимостей.
# Это уменьшает итоговый размер образа.
FROM node:24-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Устанавливаем только продакшн зависимости (без devDependencies)
RUN npm install --omit=dev

# Генерируем Prisma Client в продакшн образе
RUN npx prisma generate

# Копируем скомпилированный JS из этапа builder
COPY --from=builder /app/dist ./dist

# Копируем entrypoint скрипт (запустит миграции и сервер)
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Говорим Docker что контейнер слушает порт 3000
EXPOSE 3000

# Запускаем через entrypoint
CMD ["./entrypoint.sh"]
