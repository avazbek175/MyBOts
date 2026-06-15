import 'dotenv/config'

export const config = {
  bot: {
    token: process.env.BOT_TOKEN!,
    username: process.env.BOT_USERNAME!,
    webhookUrl: process.env.BOT_WEBHOOK_URL!,
  },
  mongodb: {
    uri: process.env.MONGODB_URI!,
  },
  redis: {
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  app: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    rateLimit: parseInt(process.env.API_RATE_LIMIT || '5'),
    rateWindow: parseInt(process.env.API_RATE_WINDOW || '1000'),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300'),
    movieTtl: parseInt(process.env.MOVIE_CACHE_TTL || '600'),
    topTtl: parseInt(process.env.TOP_CACHE_TTL || '120'),
  },
  owner: {
    ids: (process.env.OWNER_ID || '0').split(',').map(id => parseInt(id.trim())),
    usernames: (process.env.OWNER_USERNAME || 'admin').split(',').map(u => u.trim()),
  },
}

if (!config.bot.token) throw new Error('BOT_TOKEN is required')
if (!config.mongodb.uri) throw new Error('MONGODB_URI is required')
if (!config.jwt.secret) throw new Error('JWT_SECRET is required')
