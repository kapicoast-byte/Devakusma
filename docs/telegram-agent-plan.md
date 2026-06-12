# 🤖 Telegram Internal Agent — Build Plan

A Telegram bot that lets the owner/staff query and manage the nursery business by
chat — reading the same live Firestore data the app uses. Free, no phone number,
no business verification. Implements the PRD Phase 2 "AI Business Assistant."

---

## Why Telegram (vs WhatsApp)
- **Free & unlimited**, instant setup via @BotFather (no Meta verification, no dedicated number).
- **Lock to your team** with a simple allow-list of Telegram user IDs.
- **Proactive push** (daily summaries) is built-in and free.
- WhatsApp is only better when *customers* must reach us; for an *internal* tool Telegram is the clear pick.

---

## Architecture

```
You / staff (Telegram app)
        │  message
        ▼
Telegram Bot  ──webhook(HTTPS POST)──▶  /api/telegram  (Vercel serverless function, in THIS repo)
                                              │  firebase-admin (service account)
                                              ▼
                                        Firestore  (live inventory, bills, customers, expenses)
                                              │
                                  (optional) Claude API  →  natural-language understanding + tools
```

- The function lives **in this repo** under `/api/telegram.ts`. Vercel auto-detects functions in `/api`, so it deploys alongside the existing static PWA — **no new infrastructure**.
- Server-side Firestore access uses **firebase-admin** (already a devDependency) with a **service-account** credential, so it bypasses client rules safely on the server.

---

## Components / files to add

```
api/
  telegram.ts          # Vercel function: Telegram webhook handler
  _lib/
    auth.ts            # allow-list check (ALLOWED_TELEGRAM_IDS)
    firestore.ts       # firebase-admin init from service-account env
    queries.ts         # business reads: stock, sales, dues, low stock, profit, top seller
    telegram.ts        # sendMessage helper (Bot API)
    agent.ts           # (Tier B) Claude tool-use loop
scripts/
  set-telegram-webhook.mjs   # one-time: register the webhook URL with Telegram
vercel.json            # add a cron entry for the daily summary (Tier A/B)
```

`queries.ts` reuses the **same logic** already in `src/lib/logic.ts` / `analytics.ts`
(group by plant, low-stock, revenue by period, top customers) — ported to run server-side.

---

## Security
- **Allow-list:** `ALLOWED_TELEGRAM_IDS` (comma-separated). Any message from a non-listed
  `from.id` is ignored with a polite "not authorized." This is what makes it *internal*.
- **Webhook secret:** set a `secret_token` when registering the webhook; Telegram sends it
  back in the `X-Telegram-Bot-Api-Secret-Token` header — verify it to reject forged calls.
- Service-account key and bot token live only in **Vercel env vars**, never in the bundle.

---

## Tier A — Command bot (free, no AI key)

Deterministic slash-commands, instant, zero ongoing cost:

| Command | Replies with |
|---|---|
| `/stock <name>` | quantities & prices for that plant's sizes |
| `/lowstock` | all items below their threshold |
| `/sales` | revenue today / week / month / year |
| `/profit` | this month income − expenses |
| `/dues` | customers who owe money + overdue ones |
| `/top` | best-selling plant this month |
| `/expense <amt> <category>` | adds a business expense |
| `/help` | command list |

## Tier B — AI agent (natural language)

Same plumbing + a Claude tool-use loop so the owner can just type:
*"how many areca 2ft left?"*, *"who's overdue?"*, *"add 5000 expense for plants"*.

- **Model:** `claude-haiku-4-5` (fast, ~cents/day at this volume). `claude-sonnet-4-6` if we want smarter phrasing later.
- **Tools** (read/write Firestore via `queries.ts`):
  `check_inventory`, `low_stock`, `sales_summary`, `profit`, `customer_dues`, `top_sellers`, `add_expense`.
- Loop: message → Claude picks a tool → we run it against Firestore → feed result back → Claude replies in plain language. Cap iterations (e.g. 5).
- Prompt-cache the system prompt + tool list to keep cost minimal.

> Start with Tier A; flip on Tier B by adding the Anthropic key and the `agent.ts` handler — no other changes.

---

## Proactive daily summary (both tiers)
- A **Vercel Cron** (e.g. `0 3 * * *` UTC ≈ 8:30 AM IST) hits `/api/telegram?cron=daily`.
- It composes: yesterday's sales, today's dues, low-stock list, cash position — and pushes it to the allow-listed chats. Free.

---

## Environment variables (Vercel)
| Var | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | from @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | random string you choose (verify inbound) |
| `ALLOWED_TELEGRAM_IDS` | comma-separated user IDs allowed to use the bot |
| `FIREBASE_SERVICE_ACCOUNT` | service-account JSON (one line) for firebase-admin |
| `ANTHROPIC_API_KEY` | **Tier B only** |

---

## Setup checklist (one-time)
1. Telegram → **@BotFather** → `/newbot` → get **bot token**.
2. Telegram → **@userinfobot** → get **your user ID** (and each staff member's).
3. Firebase Console → Project settings → **Service accounts** → Generate private key → paste JSON into `FIREBASE_SERVICE_ACCOUNT` on Vercel.
4. Add the env vars above in Vercel → redeploy.
5. Run `node scripts/set-telegram-webhook.mjs` once to point Telegram at `https://devakusma.vercel.app/api/telegram`.
6. Message the bot → done.

---

## Cost
- Telegram: **₹0**.
- Vercel functions + cron: **free tier** covers this easily.
- Tier A: **₹0** ongoing. Tier B: a few **cents/day** of Claude usage at low volume.

---

## Testing
- Local: run the function with a sample Telegram update payload; assert replies for each command.
- Unit-test `queries.ts` against seeded Firestore data (reuses existing logic tests).
- End-to-end: send real messages from your phone after the webhook is set.

---

## Phased rollout
1. **Phase 1** — `/api/telegram` + allow-list + `/stock /lowstock /sales /dues` (Tier A).
2. **Phase 2** — `/profit /top /expense` + daily summary cron.
3. **Phase 3** — Tier B AI agent (add Anthropic key + `agent.ts`).
4. **Phase 4** — optional staff roles, and (later) a customer-facing WhatsApp ordering bot reusing the same `queries.ts`.

---

## What's needed to start building
- The **bot token** + your **Telegram user ID** (Phase 1).
- A **Firebase service-account key** (Phase 1).
- An **Anthropic API key** (only for Phase 3).
