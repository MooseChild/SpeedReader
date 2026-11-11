# SpeedReader: Next.js + Prisma app. Build once, run anywhere Docker runs.
FROM node:20-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production \
    PORT=3000 \
    BOOKS_STORAGE_PATH=/mnt/books
EXPOSE 3000

# Create the tables on first start (safe to repeat), then serve.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
