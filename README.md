# Fantasy Football

Vue 3 + Express + SQLite. Roadmap in [PLAN.md](./PLAN.md). Uses **Yarn**, Node 20+.

## Run locally
```bash
yarn install:all
cp server/.env.example server/.env      # set SUPER_ADMIN_EMAIL / PASSWORD
cp client/.env.example client/.env
yarn dev:server    # API  http://localhost:3000  (seeds the super admin on start)
yarn dev:client    # App  http://localhost:5173
```
Log in with the super admin from `server/.env`, add admins under **Admins**, create a league, open it, add players.

## Test / build
```bash
yarn test     # API tests
yarn build    # client build
```

## Deploy (GitHub + Render)
1. Push this repo to GitHub (CI runs automatically from `.github/workflows/ci.yml`).
2. On render.com: **New → Blueprint**, pick the repo. Render reads `render.yaml`.
3. When asked, enter `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`, then deploy.
4. Open the `*.onrender.com` URL and log in. Every push to `main` redeploys.

The API and the Vue app are served from one URL, so no CORS or cross-site cookie setup is needed.
Data lives on the persistent disk at `/var/data` (SQLite file + player photos).
