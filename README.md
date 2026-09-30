# Fantasy Football

Vue 3 front end + Express API. See [PLAN.md](./PLAN.md) for the full roadmap.

## Run locally
```bash
npm run install:all
cp server/.env.example server/.env
npm run dev:server   # http://localhost:3000/api/health
npm run dev:client   # http://localhost:5173
```

## Test / build
```bash
npm test        # API tests
npm run build   # client production build
```

## Status
- [x] Milestone 1: scaffold, CI, error format
- [ ] 2 Auth and roles · 3 Leagues · 4 Details + Tracker · 5 Players · 6 Points · 7 Deploy
