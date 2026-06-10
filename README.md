# 🌿 Devakusuma Nursery Management App

An **offline-first PWA** for running a plant nursery — inventory, growth tracking,
billing with PDF invoices, and an owner analytics dashboard. Built to feel like a
nursery tool, not business software (large buttons, ≥16pt text, no jargon, 3-tap actions).

Stack: **React + Vite + TypeScript**, **Tailwind CSS**, **Firebase Firestore**
(offline-first sync + cloud backup), **pdfmake** invoices, installable as a PWA on Android.

## The workflow it supports

```
BUY small plants → ADD STOCK → plant GROWS → CHANGE SIZE → SELL → CREATE BILL → PDF → WhatsApp
                       │                          │                     │
                       ▼                          ▼                     ▼
                 inventory qty ↑          qty moves size→size    inventory qty ↓ (auto)
        All events feed ▶ STOCK VALUE · LOW-STOCK ALERTS · OWNER DASHBOARD
```

## Features (PRD Phase 1)

| Module | Screen | What it does |
|---|---|---|
| 1 | Home | 6 large icon buttons + low-stock banner |
| 2 / 9 | Plants Available | List inventory by plant & size, instant search |
| 3 | Add Plants | Add stock; merges into existing plant+size |
| 4 | Change Plant Size | Move quantity between sizes (growth) |
| 5 / 7 | Create Bill | Auto-priced items, auto stock deduction |
| 6 | PDF Invoice | Download · Share on WhatsApp · Print |
| 8 | Stock Value | Per-entry value + grand total |
| 10 | Low Stock Alert | Home banner when below threshold |
| 11 | Owner Dashboard | PIN-gated sales analytics + monthly report PDF |

## Getting started

```bash
npm install

# 1. Create a Firebase project, enable Firestore + Authentication.
# 2. Copy env and fill in your Firebase keys:
cp .env.example .env

# 3. (Optional) seed sample plants — see scripts/seed.mjs for credentials:
npm run seed

# 4. Run the app:
npm run dev
```

Open the dev URL on an Android phone and use **“Add to Home screen”** to install the PWA.

The **Owner Dashboard** PIN defaults to `1234` (set `VITE_OWNER_PIN` in `.env`).

## Project structure

```
src/
  app/            App router + Home screen (Module 1)
  features/
    inventory/    Plants Available, Add Stock, Search (Modules 2,3,9)
    growth/       Change Plant Size (Module 4)
    billing/      Create Bill + invoice actions (Modules 5,6,7)
    stockValue/   Stock Value (Module 8)
    dashboard/    Owner Dashboard (Module 11)
  lib/            firebase, repository (transactions), logic, analytics, invoice, report, share, i18n
  state/          DataProvider (live Firestore subscriptions + role)
  components/     Shared large-tap-target UI
scripts/seed.mjs  Sample data seeder
firestore.rules   Firestore security rules
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check + production build |
| `npm test` | Run unit tests (logic & analytics) |
| `npm run seed` | Seed sample plants into Firestore |

## Roadmap (Phase 2)

Telugu language (i18n already scaffolded), voice input, and an AI business assistant.
