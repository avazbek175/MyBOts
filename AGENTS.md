# Ultimate Movie Stream Bot - Agent Guide

## Project Overview
Enterprise-grade Telegram Movie & Series Streaming Bot built with Node.js, Telegraf.js, MongoDB, Redis, and TypeScript.

## Tech Stack
- Node.js 22+, TypeScript (strict)
- Telegraf.js v4 (Telegram Bot API)
- MongoDB Atlas + Mongoose ODM
- Redis Cloud (ioredis)
- Express.js (webhook server)
- Docker + docker-compose
- Vercel (serverless deployment)

## Commands
```bash
npm run dev        # Start dev server with hot reload (tsx watch)
npm run build      # Build to dist/
npm run start      # Start production server
npm run typecheck  # tsc --noEmit
```

## Architecture
- src/app.ts - Express server + bot initialization
- src/bot/index.ts - Telegraf bot instance with all handlers
- src/api/webhook.ts - Vercel serverless entry point
- src/config/* - Configuration (env, database, redis, constants)
- src/models/* - Mongoose models (15 collections)
- src/middlewares/* - Bot middlewares (auth, subscription, premium, admin, etc.)
- src/services/* - Business logic layer (14 services)
- src/controllers/* - Command/callback handlers (10 controllers)
- src/keyboards/* - Inline keyboard builders (6 files)
- src/utils/* - Utility functions (logger, helpers, validators, formatters, cache)

## Database Collections
users, movies, series, seasons, episodes, categories, channels, subscriptions, payments, favorites, watchHistory, broadcasts, logs, settings, admins

## Key Patterns
- MVC + Service Layer pattern
- Redis caching with configurable TTL
- Mandatory channel subscription check
- Premium system (Telegram Stars payments)
- Role-based admin system (owner, superadmin, admin, moderator, support)
- Fuse.js fuzzy search + MongoDB text indexes
- Pagination (default 10 items/page)

## Environment Variables (see .env.example)
BOT_TOKEN, MONGODB_URI, REDIS_URL, JWT_SECRET, OWNER_ID required.

## Deployment
- Vercel: src/api/webhook.ts (serverless)
- Docker: docker-compose up --build
- GitHub Actions: CI/CD pipeline in .github/workflows/ci-cd.yml
