const https = require('https')

const BOT_TOKEN = process.env.BOT_TOKEN
const WEBHOOK_URL = process.env.BOT_WEBHOOK_URL

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN environment variable is required')
  process.exit(1)
}

if (!WEBHOOK_URL) {
  console.error('❌ BOT_WEBHOOK_URL environment variable is required')
  process.exit(1)
}

async function telegramRequest(method, params = {}) {
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
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error(`Invalid response: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  console.log(`\n🔍 Checking webhook status...`)
  const info = await telegramRequest('getWebhookInfo')
  console.log(`   Current webhook: ${info.result?.url || '(empty)'}`)
  console.log(`   Pending updates: ${info.result?.pending_update_count || 0}`)

  console.log(`\n🔗 Setting webhook to: ${WEBHOOK_URL}`)
  
  const result = await telegramRequest('setWebhook', {
    url: WEBHOOK_URL,
    allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'successful_payment'],
    drop_pending_updates: true,
  })

  if (result.ok) {
    console.log(`✅ Webhook set successfully!`)
  } else {
    console.error(`❌ Failed to set webhook: ${result.description}`)
    process.exit(1)
  }

  console.log(`\n🔍 Verifying webhook...`)
  const verify = await telegramRequest('getWebhookInfo')
  console.log(`   URL: ${verify.result?.url}`)
  console.log(`   Has custom certificate: ${verify.result?.has_custom_certificate}`)
  console.log(`   Pending updates: ${verify.result?.pending_update_count}`)

  if (verify.result?.url === WEBHOOK_URL) {
    console.log(`\n✅ Webhook verified and working!`)
  } else {
    console.error(`\n❌ Webhook URL mismatch!`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
