# Deploying tracker.olcorp.ca to Render (with GitHub)

A click-by-click guide. No command line needed. ~20 minutes.

> **Before you start — one thing to decide (data residency).** Render's servers are in the US/EU,
> not Canada. Hosting client PII outside Canada is allowed under PIPEDA with appropriate safeguards,
> but you must be comfortable with it and disclose it in your privacy policy. If you'd rather keep the
> data in Canada, tell me and we'll switch to a Canadian host instead — the app is identical, only the
> hosting steps change.

---

## Step 1 — Put the code in a private GitHub repo

1. Unzip `olcorp-tracker-server.zip` on your computer.
2. Go to <https://github.com/new>. Name it `olcorp-tracker`, set it **Private**, click **Create repository**.
3. On the new repo page, click **uploading an existing file**.
4. Open the unzipped `olcorp-tracker-server` folder, select **all the files and folders inside it**
   (server.js, db.js, render.js, render.yaml, package.json, the `lib` folder, etc. — but *not* a
   `node_modules` folder; there shouldn't be one), and drag them into the upload area.
5. Click **Commit changes**.

That's it — the code is on GitHub.

## Step 2 — Create the service on Render

1. Go to <https://render.com> and sign up / log in (you can sign in with GitHub).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub and pick the `olcorp-tracker` repo. Render reads `render.yaml` and proposes a
   web service named **olcorp-tracker** with a 1 GB disk. Click **Apply**.
4. Render will ask you to fill three values (they're marked secret in the blueprint):
   - **ADMIN_USER** — your consultant login name (e.g. `jayvee`).
   - **ADMIN_PASS** — a **strong** password. This guards the admin area — treat it like a portal password.
   - **BASE_URL** — leave this as `https://olcorp-tracker.onrender.com` for now (Render shows you the
     exact URL; we'll switch it to your domain in Step 4).
5. Click **Create / Deploy**. The first build takes a few minutes (it compiles the database library).

When it finishes, open the Render URL it gives you (something like `https://olcorp-tracker.onrender.com`).
You should see the client **Sign In** page. Add `/admin` to the URL and log in with the ADMIN_USER /
ADMIN_PASS you set — you should see the (empty) **Consultant · Active Files** page. 🎉

## Step 3 — (Optional) confirm it works before pointing your domain

From `/admin`, click **+ Add Client**, create a test file, then open the main URL in a private window and
sign in as that client to confirm the flow. Delete the test client later by editing the database, or just
leave it — you'll be adding real files soon.

## Step 4 — Point tracker.olcorp.ca at it

1. In Render, open the service → **Settings** → **Custom Domains** → **Add Custom Domain** →
   enter `tracker.olcorp.ca`. Render shows you a **CNAME target** (e.g. `olcorp-tracker.onrender.com`).
2. Go to wherever **olcorp.ca's DNS** is managed (your domain registrar or web host — the same place the
   main site's DNS lives). Add a record:
   - **Type:** CNAME
   - **Name / Host:** `tracker`
   - **Value / Target:** the CNAME target Render gave you
   - Save.
3. Back in Render, it will verify the domain and automatically issue an HTTPS certificate (a few minutes).
4. Once the domain shows **Verified**, update the **BASE_URL** environment variable
   (service → **Environment**) to `https://tracker.olcorp.ca` and save — Render redeploys automatically.
   This makes the QR codes and secure links use your real domain.

## Step 5 — Go live

Open <https://tracker.olcorp.ca/admin>, log in, and start adding your real client files and pasting their
SINP/IRCC status. Each client gets their QR / secure link from the **Issue link** button.

---

## Good to know

- **Cost:** the `starter` plan is ~$7/month (always-on) plus a few cents for the 1 GB disk.
- **Your data persists** on the mounted disk across deploys and restarts. Don't run the seed script in
  production — that's only for local sample data.
- **Updates:** because `autoDeploy` is on, if I hand you an updated version later, you upload the changed
  files to the GitHub repo and Render redeploys itself.
- **Backups:** in Render, the disk can be snapshotted; consider enabling periodic backups since this holds
  client data.
- **Admin security:** the admin area uses a username/password prompt. Keep ADMIN_PASS strong and private.
  If you ever want it hardened further (proper accounts + 2FA), that's a later enhancement.
- **Email (optional):** to email clients an update link, set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
  (and `MAIL_FROM`) in Render's Environment tab. For Gmail (consulting@olcorp.ca), turn on 2-step
  verification and create an App Password to use as `SMTP_PASS`. Leave these blank and the tracker
  runs normally, just without sending email.
