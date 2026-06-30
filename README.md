# Reines Platform

Monorepo for **Reines Property Development Limited**:

| Folder | Description |
|--------|-------------|
| `reines-web/` | Next.js website, admin/client portals, and `/api/mobile/*` backend |
| `reines-mobile/` | Expo React Native app (CLIENT + PROJECT_MANAGER) |

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon) — connection string in `reines-web/.env`

## Web (`reines-web`)

```bash
cd reines-web
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, etc.
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Deploy:** set host **root directory** to `reines-web`.

## Mobile (`reines-mobile`)

```bash
cd reines-mobile
# create .env with EXPO_PUBLIC_API_URL pointing at your API (local IP or production domain)
npm install
npm start
```

## Environment variables

### Web (`reines-web/.env`)

- `DATABASE_URL` — Neon Postgres
- `AUTH_SECRET` — JWT / NextAuth secret
- `NEXTAUTH_URL` — `http://localhost:3000` locally, `https://yourdomain.com` in production
- `PAYCHANGU_*`, `GROQ_*` — as needed

### Mobile (`reines-mobile/.env`)

- `EXPO_PUBLIC_API_URL` — e.g. `http://192.168.x.x:3000` (dev) or `https://yourdomain.com` (prod)

Do not commit `.env` files.
