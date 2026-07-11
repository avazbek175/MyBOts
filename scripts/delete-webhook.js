const https = require('https')

const BOT_TOKEN = process.env.BOT_TOKEN

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN environment variable is required')
  process.exit(1)
}

function telegramRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(params)
    const url = new URL(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`)
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { reject(new Error(data)) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  console.log('🗑  Deleting webhook...')
  const result = await telegramRequest('deleteWebhook', { drop_pending_updates: true })
  if (result.ok) {
    console.log('✅ Webhook deleted successfully')
  } else {
    console.error('❌ Failed:', result.description)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
