FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm ci --only=production || npm install

COPY src/ ./src/
RUN npm install typescript tsx @types/node --no-save
RUN npx tsc

FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY package.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/app.js"]
