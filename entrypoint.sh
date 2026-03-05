#!/bin/sh
set -e

echo "Применяем миграции..."
npx prisma migrate deploy

echo "Запускаем сервер..."
exec npx tsx src/server.ts
