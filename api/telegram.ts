import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Firestore } from 'firebase-admin/firestore';
import { getDb } from './_firebase';

/**
 * Telegram internal-agent webhook (Phase 1 — command bot).
 * Reads the same Firestore the app uses and answers business questions.
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
const ALLOWED = (process.env.ALLOWED_TELEGRAM_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const inr = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(Math.round(n))}`;

async function send(chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
}

function periodStart(p: 'today' | 'week' | 'month' | 'year'): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (p === 'today') return d.getTime();
  if (p === 'week') {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  }
  if (p === 'month') {
    d.setDate(1);
    return d.getTime();
  }
  d.setMonth(0, 1);
  return d.getTime();
}

const norm = (s: string) => s.trim().toLowerCase();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readAll(db: Firestore, name: string): Promise<any[]> {
  const snap = await db.collection(name).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function helpText(): string {
  return [
    '🌿 <b>Devakusuma Nursery — Assistant</b>',
    '',
    'Commands:',
    '/stock <i>[name]</i> — stock by plant & size',
    '/lowstock — items below threshold',
    '/sales — revenue today/week/month/year',
    '/profit — this month income − expenses',
    '/dues — customers who owe money',
    '/top — best seller this month',
    '/ping — check the bot is alive',
  ].join('\n');
}

async function route(text: string, chatId: number): Promise<void> {
  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(' ').trim();
  const c = (cmd || '').toLowerCase().replace(/@.*$/, '');

  if (c === '/start' || c === '/help' || c === '') return send(chatId, helpText());
  if (c === '/ping') return send(chatId, '🏓 pong — bot is alive.');

  const db = getDb();
  if (!db) return send(chatId, '⚙️ Firestore not connected yet. Set FIREBASE_SERVICE_ACCOUNT in Vercel.');

  switch (c) {
    case '/stock':
      return stock(db, arg, chatId);
    case '/lowstock':
      return lowstock(db, chatId);
    case '/sales':
      return sales(db, chatId);
    case '/profit':
      return profit(db, chatId);
    case '/dues':
      return dues(db, chatId);
    case '/top':
      return top(db, chatId);
    default:
      return send(chatId, 'Unknown command. Try /help');
  }
}

async function stock(db: Firestore, arg: string, chatId: number): Promise<void> {
  const plants = await readAll(db, 'plants');
  const q = norm(arg);
  const matched = q ? plants.filter((p) => norm(p.plantName).includes(q)) : plants;
  if (matched.length === 0) return send(chatId, `No plants found${q ? ` for "${arg}"` : ''}.`);

  const byPlant = new Map<string, { size: string; quantity: number; sellingPrice: number }[]>();
  for (const p of matched) {
    const arr = byPlant.get(p.plantName) ?? [];
    arr.push({ size: p.size, quantity: p.quantity, sellingPrice: p.sellingPrice });
    byPlant.set(p.plantName, arr);
  }
  const lines: string[] = [];
  for (const [name, sizes] of [...byPlant].sort((a, b) => a[0].localeCompare(b[0])).slice(0, 25)) {
    lines.push(`<b>${name}</b>`);
    for (const s of sizes.sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }))) {
      lines.push(`  • ${s.size}: ${s.quantity} @ ${inr(s.sellingPrice)}`);
    }
  }
  return send(chatId, lines.join('\n'));
}

async function lowstock(db: Firestore, chatId: number): Promise<void> {
  const plants = await readAll(db, 'plants');
  const low = plants.filter((p) => p.quantity < (p.minThreshold ?? 0));
  if (low.length === 0) return send(chatId, '✅ No low-stock items.');
  const lines = low.map((p) => `⚠️ ${p.plantName} ${p.size}: ${p.quantity} left (min ${p.minThreshold})`);
  return send(chatId, `<b>Low stock (${low.length})</b>\n` + lines.join('\n'));
}

async function sales(db: Firestore, chatId: number): Promise<void> {
  const bills = await readAll(db, 'bills');
  const rev = (since: number) =>
    bills.filter((b) => b.date >= since).reduce((s, b) => s + (b.grandTotal ?? 0), 0);
  return send(
    chatId,
    [
      '<b>Sales</b>',
      `Today: ${inr(rev(periodStart('today')))}`,
      `Week: ${inr(rev(periodStart('week')))}`,
      `Month: ${inr(rev(periodStart('month')))}`,
      `Year: ${inr(rev(periodStart('year')))}`,
    ].join('\n'),
  );
}

async function profit(db: Firestore, chatId: number): Promise<void> {
  const [bills, expenses] = await Promise.all([readAll(db, 'bills'), readAll(db, 'expenses')]);
  const since = periodStart('month');
  const income = bills.filter((b) => b.date >= since).reduce((s, b) => s + (b.grandTotal ?? 0), 0);
  const spent = expenses.filter((e) => e.date >= since).reduce((s, e) => s + (e.amount ?? 0), 0);
  return send(
    chatId,
    [
      '<b>This month</b>',
      `Income: ${inr(income)}`,
      `Expenses: ${inr(spent)}`,
      `Net profit: <b>${inr(income - spent)}</b>`,
    ].join('\n'),
  );
}

async function dues(db: Firestore, chatId: number): Promise<void> {
  const customers = await readAll(db, 'customers');
  const owing = customers.filter((c) => (c.balance ?? 0) > 0).sort((a, b) => b.balance - a.balance);
  if (owing.length === 0) return send(chatId, '✅ No outstanding dues.');
  const today = periodStart('today');
  const total = owing.reduce((s, c) => s + c.balance, 0);
  const lines = owing.slice(0, 25).map((c) => {
    const overdue = c.dueDate && c.dueDate < today ? ' ⏰ overdue' : '';
    const due = c.dueDate ? ` (due ${new Date(c.dueDate).toLocaleDateString('en-IN')})` : '';
    return `• ${c.name}: ${inr(c.balance)}${due}${overdue}`;
  });
  return send(chatId, `<b>Dues — total ${inr(total)}</b>\n` + lines.join('\n'));
}

async function top(db: Firestore, chatId: number): Promise<void> {
  const bills = await readAll(db, 'bills');
  const since = periodStart('month');
  const units = new Map<string, number>();
  for (const b of bills.filter((x) => x.date >= since)) {
    for (const it of b.items ?? []) units.set(it.plantName, (units.get(it.plantName) ?? 0) + it.qty);
  }
  const ranked = [...units.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return send(chatId, 'No sales yet this month.');
  const lines = ranked.slice(0, 5).map(([name, q], i) => `${i + 1}. ${name} — ${q} units`);
  return send(chatId, '<b>Top sellers this month</b>\n' + lines.join('\n'));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(200).send('ok');
    return;
  }
  if (SECRET && req.headers['x-telegram-bot-api-secret-token'] !== SECRET) {
    res.status(401).send('bad secret');
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = req.body;
  const msg = update?.message ?? update?.edited_message;
  const chatId: number | undefined = msg?.chat?.id;
  const fromId = String(msg?.from?.id ?? '');
  const text: string = (msg?.text ?? '').trim();

  if (!chatId) {
    res.status(200).send('ok');
    return;
  }
  if (ALLOWED.length && !ALLOWED.includes(fromId)) {
    await send(chatId, `🚫 Not authorized. Your Telegram ID: ${fromId}`);
    res.status(200).send('ok');
    return;
  }

  try {
    await route(text, chatId);
  } catch (e) {
    await send(chatId, '⚠️ ' + (e as Error).message);
  }
  res.status(200).send('ok');
}
