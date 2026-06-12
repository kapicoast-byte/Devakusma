/**
 * Register (or clear) the Telegram webhook so Telegram delivers messages to
 * the Vercel function at /api/telegram.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=123:ABC \
 *   WEBHOOK_URL=https://devakusma.vercel.app/api/telegram \
 *   TELEGRAM_WEBHOOK_SECRET=mysecret \
 *   node scripts/set-telegram-webhook.mjs
 *
 *   # to remove the webhook:
 *   TELEGRAM_BOT_TOKEN=123:ABC node scripts/set-telegram-webhook.mjs --delete
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.WEBHOOK_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  console.error('Set TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const del = process.argv.includes('--delete');
const api = `https://api.telegram.org/bot${token}`;

async function main() {
  if (del) {
    const r = await fetch(`${api}/deleteWebhook`, { method: 'POST' });
    console.log(await r.json());
    return;
  }
  if (!url) {
    console.error('Set WEBHOOK_URL (e.g. https://devakusma.vercel.app/api/telegram)');
    process.exit(1);
  }
  const body = { url, allowed_updates: ['message'], ...(secret ? { secret_token: secret } : {}) };
  const r = await fetch(`${api}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log('setWebhook:', await r.json());
  const info = await fetch(`${api}/getWebhookInfo`);
  console.log('getWebhookInfo:', await info.json());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
