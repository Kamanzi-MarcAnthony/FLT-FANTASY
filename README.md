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
