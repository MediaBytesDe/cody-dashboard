# Cody Dashboard

Lokales Task- & Projekt-Tracking Dashboard.

## Tech Stack
- Next.js 15 (App Router, Turbopack)
- TypeScript (strict)
- Tailwind CSS
- Drizzle ORM + PostgreSQL
- pnpm

## Setup

```bash
# 1. PostgreSQL starten
docker compose up -d

# 2. Dependencies installieren
pnpm install

# 3. Datenbank-Schema pushen
pnpm db:push

# 4. (Optional) Seed-Daten laden
pnpm db:seed

# 5. Dev-Server starten
pnpm dev
```

Dashboard unter: http://localhost:3000

## Drizzle Studio
```bash
pnpm db:studio
```
