# Olcorp Client Application Tracker — Server (Starter)

A runnable backend for `tracker.olcorp.ca` implementing the access model from the spec:
**one-time link → device session → manual login fallback.** Node + Express + SQLite.

## What's implemented

- **Magic-link entry** (`GET /o/:token`) — single-use, expiring token; on use it sets a device session cookie and redirects to a **clean URL** (token stripped from the address bar).
- **Second factor** (`POST /verify`) — date-of-birth confirm after a magic link.
- **Manual login** (`POST /login`) — UCI + date of birth + principal applicant's last name; the always-available fallback for a new device.
- **Sliding device session** — secure `HttpOnly` cookie, renews on each visit (default 75 days).
- **Consultant admin** (`/admin`, Basic Auth) — add/edit clients, paste SINP/IRCC status, **issue a QR + secure link** per client, **email the link** to the client, **archive / restore / delete** files, and view the **access log**.
- **Client email notifications** — on a status update you can email the client a short note with a fresh secure link (needs SMTP configured; degrades gracefully if not).
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
    experience the scan → verify → tracker flow. If the client has an email on file (and SMTP
    is configured), you can **email the link** to them from this page.
  - On the **Status** form, tick **"Email the client that there is an update"** to send a fresh
    secure link automatically when you save.
  - **Archive** a file to move it out of the active list (it can be restored); **Delete** on an
    archived file removes it permanently. **Access log** shows every sign-in and link open.

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
| `SMTP_HOST` / `SMTP_PORT` | (blank) / 587 | Email server. Leave blank to run without email. |
| `SMTP_USER` / `SMTP_PASS` | (blank) | Mailbox login. For Gmail, use an **App Password**. |
| `MAIL_FROM` | (from SMTP_USER) | The "From" address on notification emails. |

## Programmatic API (update from your own automation)

Set a long random `API_KEY` (see the config table) to turn on a small JSON API, so a script or a
Cowork skill can push updates without the browser. Authenticate every call with a header, either
`Authorization: Bearer <API_KEY>` or `X-API-Key: <API_KEY>`. All bodies are JSON.

Endpoints:

- `GET  /api/ping` — check the key works.
- `GET  /api/clients` — list active clients.
- `GET  /api/clients/:id` — one client.
- `POST /api/clients` — create (or update, if you pass `id`). To create: `uci`, `dob`, `last`,
  `full_name` are required. On update, omitted fields keep their current value.
- `POST /api/clients/:id/status` — update `sinp` and/or `ircc` (each `{synced, rows, messages}`),
  and optionally `current_stage`, `status_label`, `next_action`; set `"notify": true` to email the
  client a fresh secure link. This is the call your portal automation will use most.
- `POST /api/clients/:id/link` — issue a secure link (returns it); `{"email": true}` also emails it.
- `POST /api/clients/:id/archive` — archive a file.

Status shapes match the app: `rows` is a list of `[label, value, state]` (state = `done`/`prog`/`wait`),
`messages` is a list of `{date, text}`, `checklist` is a list of `{label, done}`, `stage_dates` is
`{stageKey: "label"}` where stageKey is one of intake, sinp, nom, eapr, bio, medical, bg, decision, copr.

Example — create a client:

```bash
curl -X POST https://tracker.olcorp.ca/api/clients \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"id":"reformina","full_name":"Ernalyn Dabalos Reformina","uci":"11-0099-8877",
       "dob":"1990-05-14","last":"Reformina","stream":"SINP · Permanent Residence",
       "current_stage":"eapr","status_label":"AOR Received"}'
```

Example — push a status update (what an automation run would send):

```bash
curl -X POST https://tracker.olcorp.ca/api/clients/reformina/status \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"ircc":{"synced":"Sep 12, 2026",
        "rows":[["Application Status","We Are Processing Your Application","prog"],
                ["Biometrics","Completed","done"]],
        "messages":[{"date":"Sep 12, 2026","text":"Your biometrics have been received."}]},
       "current_stage":"bio","notify":true}'
```

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
- **Logo:** the real olcorp.ca logo ships in `public/logo.png` and shows in the page header. Replace that file to change it.
- **Email:** notifications use SMTP (see the config table). With Gmail, turn on 2-step verification and create an **App Password** for `SMTP_PASS`. Without SMTP set, the app still runs and simply does not send.
- **Admin auth** here is simple Basic Auth for the starter. For production, move the consultant side to a proper account with 2FA.
- This starter is the access + session layer. It is not a substitute for a security review before handling live client data.
