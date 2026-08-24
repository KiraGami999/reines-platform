# Reines Web Portal

Next.js client/admin portal for Reines Property Development.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication

Auth uses [Auth.js](https://authjs.dev) (NextAuth v5) with JWT sessions.

### Required env

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Signs session cookies (and related tokens). Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Public site URL, e.g. `https://reines.co.mw` or `http://localhost:3000`. |

### Google Sign-In (optional)

Clients can sign in or register with Google when these are set:

| Variable | Purpose |
|----------|---------|
| `AUTH_GOOGLE_ID` | Google OAuth 2.0 Client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth 2.0 Client Secret |

**Google Cloud Console setup**

1. Create an OAuth 2.0 Client ID (application type: **Web application**).
2. Add authorized redirect URIs:
   - Production: `https://reines.co.mw/api/auth/callback/google`
   - Local: `http://localhost:3000/api/auth/callback/google`
3. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` on the host (e.g. Vercel).
4. Redeploy. The “Sign in with Google” / “Sign up with Google” buttons appear on `/login` and `/register` only when both vars are present.

Same-email Google and password accounts are linked so existing clients can use either method. New Google users are created as `CLIENT` (unverified until KYC).

### Session policy

- JWT session lifetime: **7 days**
- Role / verification refresh from the database: at most **once per 24 hours**
- Deleted users lose a valid session on the next refresh window
