# Olcorp Client Application Tracker — Server (Starter)

A runnable backend for `tracker.olcorp.ca` implementing the access model from the spec:
**one-time link → device session → manual login fallback.** Node + Express + SQLite.

## What's implemented

- **Magic-link entry** (`GET /o/:token`) — single-use, expiring token; on use it sets a device session cookie and redirects to a **clean URL** (token stripped from the address bar).
- **Second factor** (`POST /verify`) — date-of-birth confirm after a magic link.
- **Manual login** (`POST /login`) — UCI + date of birth + principal applicant's last name; the always-available fallback for a new device.
- **Sliding device session** — secure `HttpOnly` cookie, renews on each visit (default 75 days).
- **Consultant admin** (`/admin`, Basic Auth) — list files, **issue a QR + secure link** per client, **revoke** outstanding links & sessions.
- **Security** — hashed tokens (never stored raw), rate limiting + lockout, access logging, no PII in the URL.

## Run it locally

```bash
npm install          # dependencies (already listed in package.json)
npm run seed         # load two sample clients
npm start            # starts on http://localhost:3000
```

Then:

- **Client side:** open <http://localhost:3000> → sign in with
  `UCI 11-0099-8877 · DOB 1990-05-14 · Last name Reformina`.
- **Consultant side:** open <http://localhost:3000/admin>
  (Basic Auth — default `admin` / `change-me`; change via env). From here you can:
  - **+ Add Client** — enter identity, file details, pick the current stage, and type the
    document checklist (one item per line; `[x]` done, `[ ]` pending). **Edit** re-opens the same form.
  - **Status** — paste the SINP and IRCC status copied from each portal. Status rows are
    `Label | Value | state` (state = `done`/`prog`/`wait`); messages are `date | message`.
  - **Issue link** — see the QR + one-time secure link; open it in a private window to
    experience the scan → verify → tracker flow.

## Configure

Copy `.env.example` to `.env` (or set the vars in your shell):

| Var | Default | Meaning |
|-----|---------|---------|
| `PORT` | 3000 | Port |
| `BASE_URL` | `http://localhost:3000` | Public URL; set to `https://tracker.olcorp.ca` in prod (goes into the QR) |
| `LINK_TTL_HOURS` | 72 | One-time link lifetime |
| `SESSION_DAYS` | 75 | Sliding device-session length |
| `COOKIE_SECURE` | false | **Set `true` in production (HTTPS)** |
| `ADMIN_USER` / `ADMIN_PASS` | admin / change-me | Consultant admin login — **change these** |

## Deploy (going live)

1. Point the subdomain `tracker.olcorp.ca` (a DNS record on the domain you already own) at your host.
2. Run this app on any Node host (a small VPS, or Render / Railway / Fly.io). Serve over **HTTPS** (free via Let's Encrypt or the platform) and set `COOKIE_SECURE=true`, `BASE_URL=https://tracker.olcorp.ca`.
3. SQLite needs no separate database service; the `data.db` file lives on disk. For multi-instance scale, switch to Postgres (the data layer in `db.js` is small and easy to port).

## Files

```
server.js        Express app + all routes (the three-keys flow)
db.js            SQLite schema + data access
lib/security.js  token gen/hashing, normalization, rate limiting/lockout
render.js        server-side HTML (login, verify, tracker, admin) — olcorp.ca theme
stages.js        milestone definitions (Title Case)
seed.js          sample clients
.env.example     configuration template
```

## Notes / next steps

- **SINP & IRCC status:** stored as text on the client row (`sinp` / `ircc` columns — JSON with `synced`, `rows`, `messages`) and edited from the **Status** admin form. Text only, so storage stays tiny — no image handling. The SINP panel shows only for SINP-stream files.
- **Logo:** `render.js` uses a text `olcorp.ca` wordmark. Drop your logo file in a `/public` folder and reference it if you prefer the image.
- **Admin auth** here is simple Basic Auth for the starter. For production, move the consultant side to a proper account with 2FA.
- This starter is the access + session layer. It is not a substitute for a security review before handling live client data.
