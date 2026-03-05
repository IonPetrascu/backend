FROM node:24-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем Prisma конфиг и схему
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем весь исходный код TypeScript
COPY tsconfig.json ./
COPY src ./src/

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
