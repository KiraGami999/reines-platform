# Reines Platform

Monorepo for **Reines Property Development Limited**:

- `reines-web` — Next.js website, admin/client portals, and mobile API
- `reines-mobile` — Expo React Native app (CLIENT + PROJECT_MANAGER)

## Prerequisites

- Node.js 20+
- npm
- Neon PostgreSQL database (or local Postgres for development)

## Web (`reines-web`)

```bash
cd reines-web
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, etc.
npm install
npx prisma generate
npx prisma db push     # first-time setup or after schema changes
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | JWT + session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; your domain in production |

### Deploy (Vercel / similar)

Set **Root directory** to `reines-web` and add the same env vars in the host dashboard.

## Mobile (`reines-mobile`)

```bash
cd reines-mobile
cp .env.example .env   # set EXPO_PUBLIC_API_URL to your backend URL
npm install --legacy-peer-deps
npm start
```

For local dev, point the API at your machine's LAN IP (not `localhost`):

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Scan the QR code with **Expo Go** (Android/iOS).

## WSL note

If the repo lives under `/mnt/c/...`, prefer cloning to `~/reines-platform` for faster `npm install`. Paths are equivalent:

```bash
cd ~/reines-platform/reines-web
```
