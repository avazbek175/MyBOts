# 🎬 Ultimate Movie Stream Bot

Enterprise-grade Telegram Movie & Series Streaming Bot (Netflix-like).

## Tech Stack

- Node.js 22+ / TypeScript
- Telegraf.js (Telegram Bot API)
- MongoDB Atlas + Mongoose
- Redis Cache (ioredis)
- Express.js (Webhook)
- Docker / docker-compose
- Vercel (Serverless)

## Features

- 🎬 Movie & Series management (by file_id)
- 📂 Categories (dynamic)
- 🔍 Fuzzy search by code, name, genre, year
- 💎 Premium system (Telegram Stars payment)
- 📢 Mandatory channel subscription
- ❤️ Favorites & Watch History
- 🤖 AI-based recommendations
- 🔥 Trending / Top rated / Most viewed
- 👑 Admin panel (inline keyboard)
- 📨 Broadcast system
- 📊 Statistics & Logging
- 🛡 Role system (Owner → Support)
- 🚀 100K+ users optimized

## Quick Start

```bash
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

## Docker

```bash
docker-compose up --build
```

## Vercel Deploy

Add these env vars in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | your_bot_token |
| `BOT_USERNAME` | your_bot_username |
| `BOT_WEBHOOK_URL` | https://your-app.vercel.app/api/webhook |
| `MONGODB_URI` | mongodb+srv://... |
| `REDIS_URL` | redis://... |
| `REDIS_PASSWORD` | your_redis_password |
| `JWT_SECRET` | your_jwt_secret |
| `JWT_EXPIRES_IN` | 7d |
| `OWNER_ID` | telegram_id |
| `OWNER_USERNAME` | your_username |
| `NODE_ENV` | production |
