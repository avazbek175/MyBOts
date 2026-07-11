# 🎬 Ultimate Movie Stream Bot

Enterprise-grade Telegram Movie & Series Streaming Bot with Netflix-like interface.

## 📋 Overview

Ultimate Movie Stream Bot is a full-featured streaming platform for Telegram that offers movies and TV series streaming with a premium subscription model. Built with TypeScript, MongoDB, Redis, and modern web technologies, it provides a seamless user experience with features like fuzzy search, AI recommendations, comprehensive admin panel, and advanced caching.

![Ultimate Movie Stream Bot](https://raw.githubusercontent.com/zedasdzdx/MyBOts/main/assets/bot-screenshot.png)

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- MongoDB Atlas (or local MongoDB)
- Redis Cloud (or local Redis)

### Installation

```bash
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### Docker

```bash
docker-compose up --build
```

### Vercel (Serverless)

Deploy directly to Vercel with the following environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | ✅ | Telegram Bot API token |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `REDIS_URL` | ✅ | Redis connection URL |
| `JWT_SECRET` | ✅ | Secret for JWT authentication |
| `OWNER_ID` | ✅ | Owner's Telegram user ID |
| `OWNER_USERNAME` | ✅ | Owner's Telegram username |
| `BOT_USERNAME` | ✅ | Bot's Telegram username |
| `BOT_WEBHOOK_URL` | ✅ | Webhook URL for Telegram |

## 📦 Features

### 🎭 Core Features

- **🎬 Movie & Series Management**: Upload and manage movies/series with file_id support
- **📂 Dynamic Categories**: Organize content into customizable categories
- **🔍 Smart Search**: Fuzzy search by code, name, genre, year, and more
- **💎 Premium System**: Telegram Stars payment integration
- **👑 Role-based Admin**: Multiple admin levels (owner, superadmin, admin, moderator, support)

### 🎯 User Experience

- **📢 Mandatory Channel**: Subscribers must join announcement channel
- **❤️ Favorites & Watch History**: Save favorite movies and track viewing history
- **🤖 AI Recommendations**: Intelligent movie suggestions based on viewing patterns
- **🔥 Trending & Stats**: Top rated, most viewed, and trending content
- **🗂️ Pagination**: Clean pagination with 10 items per page by default
- **🌐 International**: Fully localized interface with Persian/English support

### 🔧 Admin Features

- **📊 Dashboard**: Real-time statistics and analytics
- **🎬 Content Management**: Add, edit, delete movies, series, seasons, episodes
- **📢 Broadcast System**: Send announcements to all users
- **👥 User Management**: Ban/unban users, grant premium access
- **💳 Payment Management**: Handle refunds and subscription payments
- **📝 Logs**: Track admin actions and system logs
- **⚙ Settings**: Configure maintenance mode, page size, channels, etc.
- **🛡 Moderator Management**: Add/remove moderators with permissions

### ⚡ Technical Features

- **📦 Redis Caching**: Configurable TTL for optimal performance (100K+ users)
- **🔍 Fuzzy Search**: Fuse.js for intelligent content discovery
- **💾 MongoDB Text Indexes**: Efficient database queries
- **📡 Webhooks**: Telegram webhook integration for real-time updates
- **🔒 JWT Authentication**: Secure user authentication and authorization
- **🛡️ Anti-Spam & Rate Limiting**: Security features to prevent abuse
- **🔧 Error Handling**: Comprehensive error reporting and recovery
- **📈 Monitoring**: Health checks and system monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Telegraf Bot  │    │   Express Server │    │    MongoDB      │
│                 │    │                  │    │                 │
│ • Start/Help    │    │ • Webhook (/api) │    │ • users         │
│ • Commands      │    │ • Health (/health)│    │ • movies        │
│ • Callbacks     │    │ • Status (/status)│    │ • series        │
│ • Middleware    │◄──►│ • Middleware     │◄──►│ • categories    │
│ • FSM Sessions  │    │ • Error Handling │    │ • subscriptions │
└─────────────────┘    └──────────────────┘    │ • payments      │
                                            │ • favorites     │
                                            │ • watchHistory  │
                                            │ • broadcasts    │
                                            │ • logs         │
                                            │ • settings     │
                                            │ • admins       │
                                            └─────────────────┘

                    ┌─────────────────────────────┐
                    │         Redis Cache         │
                    │ (movie, series, categories) │
                    └─────────────────────────────┘
```

### Key Components

#### 1. **src/app.ts** - Express Server
- Main application entry point
- Webhook server for Telegram integration
- Health check and status endpoints
- Database connection management
- Configuration and middleware setup

#### 2. **src/bot/index.ts** - Telegraf Bot Instance
- 500+ command and callback handlers
- Middleware pipeline (auth, subscription, premium, admin)
- FSM state management for admin operations
- ReplyKeyboard and inline keyboard handlers
- Message event listeners (text, video, document)

#### 3. **src/services/*/*.ts** - Business Logic Layer
- 14 service classes implementing MVC pattern
- CRUD operations and advanced queries
- Cache management
- Cache invalidation
- Data validation and sanitization

#### 4. **src/controllers/*/*.ts** - Request Handlers
- Telegram command/callback handlers
- Business logic orchestration
- Reply markup generation
- User interaction flow management

#### 5. **src/middlewares/*/*.ts** - Authentication & Security
- Auth middleware (JWT verification)
- Subscription middleware (channel check)
- Premium middleware (access control)
- Admin middleware (role-based access)
- Rate limiting middleware
- Anti-spam middleware

#### 6. **src/models/*/*.ts** - Database Models
- 15 Mongoose collections
- Complex schemas with validation
- Indexes for optimal performance
- Relationship definitions

#### 7. **src/config/*/*.ts** - Configuration
- Environment variables
- MongoDB connection settings
- Redis configuration
- Application constants
- Cache TTL settings

## 📊 Database Schema

### Collections

| Collection | Description | Key Features |
|------------|-------------|-------------|
| **users** | User profiles | Roles, premium status, last activity |
| **movies** | Movie database | Movie codes, file IDs, metadata |
| **series** | Series database | Series codes, metadata |
| **seasons** | Season data | Episode organization |
| **episodes** | Episode data | Individual episode details |
| **categories** | Content categories | Dynamic categorization |
| **channels** | Announcement channels | Mandatory subscription |
| **subscriptions** | User subscriptions | Premium status tracking |
| **payments** | Payment records | Transaction history |
| **favorites** | User favorites | Saved content |
| **watchHistory** | Viewing history | User engagement tracking |
| **broadcasts** | Broadcast messages | Announcement system |
| **logs** | System logs | Admin and error logging |
| **settings** | Bot settings | Configuration management |
| **admins** | Admin users | Role management |

### Indexes

- Text indexes for movies: `movieName`, `movieCode`, `description`
- Text indexes for series: `seriesName`, `seriesCode`, `description`
- Compound indexes for performance optimization
- TTL indexes for cache cleanup

## ⚙️ Configuration

### Environment Variables

See `.env.example` for all configuration options.

### Cache Configuration

```javascript
{
  "ttl": 300,           // 5 minutes for general cache
  "movieTtl": 600,      // 10 minutes for movie data
  "topTtl": 120         // 2 minutes for top lists
}
```

### Rate Limiting

```javascript
{
  "rateLimit": 5,       // 5 requests per window
  "rateWindow": 1000    // 1 second window
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Configure environment variables:
   - `BOT_TOKEN`: Your Telegram bot token
   - `MONGODB_URI`: MongoDB connection string
   - `REDIS_URL`: Redis connection URL
   - `JWT_SECRET`: Secret key for JWT
   - `OWNER_ID`: Your Telegram ID
   - `OWNER_USERNAME`: Your Telegram username
   - `NODE_ENV`: "production"

The bot automatically handles webhooks through Vercel's serverless functions.

### Docker

```bash
docker-compose up --build
```

Docker setup includes:
- MongoDB with authentication
- Redis with persistence
- Bot application
- Health checks and monitoring

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
```

## 🗂️ Project Structure

```
📦 src/
├── 📁 api/
│   └── webhook.ts              # Vercel serverless function
├── 📁 bot/
│   └── index.ts               # Telegraf bot instance (575 lines)
├── 📁 config/
│   ├── index.ts               # Environment config
│   ├── redis.ts               # Redis configuration
│   └── database.ts            # DB connection settings
├── 📁 controllers/
│   ├── start.controller.ts    # Bot start commands
│   ├── movie.controller.ts    # Movie operations
│   ├── series.controller.ts   # Series operations
│   ├── ... (10 more)          # Admin, auth, premium controllers
├── 📁 middlewares/
│   ├── auth.ts               # Authentication
│   ├── subscription.ts       # Channel subscription
│   ├── premium.ts            # Premium access
│   ├── admin.ts              # Admin permissions
│   ├── errorHandler.ts       # Error handling
│   └── rateLimit.ts          # Rate limiting
├── 📁 models/                 # 15 Mongoose schemas
├── 📁 services/              # 14 business logic services
├── 📁 keyboards/            # 6 inline keyboard builders
├── 📁 utils/                 # Utility functions
└── 📁 types/                 # TypeScript definitions

📄 README.md                    # This document
📄 .env.example               # Environment template
📄 package.json              # Project dependencies
📄 docker-compose.yml        # Docker configuration
📄 AGENTS.md                 # Technical documentation
```

## 🧪 Testing & Quality Assurance

### Type Checking

```bash
npm run typecheck
# Validates TypeScript types (strict mode)
```

### Linting

```bash
npm run lint
# Checks code style and conventions
```

### Formatting

```bash
npm run format
# Auto-formats code with Prettier
```

### Performance

The bot is optimized for 100K+ concurrent users:
- Redis caching reduces database load
- Connection pooling for MongoDB
- Efficient query indexes
- Automatic garbage collection

## 💡 Development Notes

### Key Patterns

1. **MVC + Service Layer**: Separation of concerns with business logic in services
2. **Redis Caching**: Layered caching strategy for optimal performance
3. **FSM State Management**: Admin workflows using finite state machines
4. **Comprehensive Error Handling**: Graceful error recovery and logging
5. **TypeScript Strict Mode**: Full type safety throughout the codebase

### Performance Optimizations

- LRU caching for frequently accessed data
- Batch operations for database writes
- Connection pooling for database access
- CDN for static assets
- Automatic cache invalidation

### Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting and anti-spam protection
- Input validation and sanitization
- Environment-based configuration

## 🎯 Getting Help

### Documentation

- 📚 `AGENTS.md` - Technical architecture guide
- 🔧 `src/` - Source code with extensive comments
- 📝 See source code for comprehensive API documentation

### Community

- 🐛 Report bugs through GitHub issues
- 💡 Request features through discussions
- 🗣️ Ask questions in the repository's discussion forums

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🌟 Credits

- **Telegram Bot API**: Built on Telegraf.js v4
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis Cloud with ioredis
- **Web Server**: Express.js with security middleware
- **Deployment**: Vercel for serverless functions
- **Docker**: Docker Compose for orchestration

## 🔄 Updates & Changelog

### Recent Changes

- **v1.0.0**: Initial release with full feature set
- **Features**: Complete Netflix-like experience
- **Performance**: Optimized for 100K+ users
- **Security**: Enterprise-grade security measures

See `CHANGELOG.md` for detailed version history.

---

*Built with ❤️ for movie enthusiasts*
