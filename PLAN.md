# Fantasy Football App: Project Plan

Status: Phase 1 (Admin section). Plan first, code after sign-off.

---

## 1. Goal

A fantasy football web app deployed from GitHub. Phase 1 covers the **admin section**: an admin logs in, creates leagues, opens a league, and registers players into it.

## 2. Scope of Phase 1

| Screen | What it does |
|---|---|
| **Login** | Admin or Super Admin signs in with email and password |
| **Leagues Page** | Lists league cards and has a **Create League** button that opens the form |
| **League Details** | Shows full league info, scoring rules, the **Matchday Tracker**, and a Players List with an **Add Player** button |
| **Admin Management** (Super Admin only) | Lists admin accounts and adds new ones |

Out of scope for now: fantasy team selection and the actual transfer UI for regular users, live match entry, leaderboards. The data model and tracker prepare for them (transfer limits and deadlines are stored and enforced by a helper, ready for when transfers exist).

## 1a. Key Terms

| Term | Meaning |
|---|---|
| **Matchday** | The day (and time window) the actual game is played. One matchday per week. |
| **Matchweek** | The week **before** a matchday: the 7 days leading up to that matchday's kickoff. Matchweek N feeds Matchday N. |
| **Transfer** | A change to a fantasy squad during a matchweek. |
| **Transfer Deadline** | 6, 8 or 24 hours before matchday kickoff. After it, transfers are **inactive until the matchday ends**. |
| **Super Admin** | Top-level account that can create other admin accounts. Also has all admin abilities. |

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Front end | **Vue 3 + Vite**, Vue Router, Pinia | As requested; Pinia holds auth and league state |
| Back end | **Node.js + Express** | Simple REST API for leagues, players, auth |
| Database | **SQLite** (via `better-sqlite3`), upgradable to Postgres | Zero setup locally; Postgres later for production |
| Validation | **Zod** (server), inline validation (client) | Same rules on both sides |
| Auth | **JWT** in an httpOnly cookie, `bcrypt` password hashing | Secure admin login |
| Photo upload | **Multer**, stored in `/uploads` (later: S3 or Cloudinary) | Handles `multipart/form-data` |
| Tests | Vitest (front end), Jest + Supertest (back end) | Points engine and API |
| CI/CD | **GitHub Actions** | Test, build, deploy |

## 4. Repository Structure

```
fantasy-football/
├── PLAN.md
├── README.md
├── .github/workflows/
│   ├── ci.yml                 # lint + test on every PR
│   └── deploy.yml             # build + deploy on push to main
├── client/                    # Vue 3 app
│   └── src/
│       ├── views/             # LoginView, LeaguesView, LeagueDetailsView, AdminsView
│       ├── components/        # LeagueCard, CreateLeagueForm, AddPlayerForm, MatchdayTracker, AddAdminForm,
│       │                      # PlayerList, PlayerCard, ScoringChips, FormError
│       ├── stores/            # auth.js, leagues.js, players.js
│       ├── router/index.js    # guards: redirect to /login if not authed
│       └── api/http.js        # fetch/axios wrapper + error normalizer
└── server/
    ├── src/
    │   ├── app.js
    │   ├── db/                # schema.sql, migrations, connection
    │   ├── routes/            # auth, leagues, players
    │   ├── middleware/        # requireAdmin, errorHandler, upload
    │   ├── validators/        # zod schemas
    │   └── services/          # points.js (scoring), schedule.js (matchday generator), matchdayState.js
    └── tests/
```

## 5. Screens and Behaviour

### 5.1 Login
- Fields: email, password.
- Errors: invalid credentials, empty fields, server unreachable.
- On success, redirect to Leagues Page. Route guard blocks all other pages when logged out.
- The session carries the role (`super_admin` or `admin`); the UI and API both enforce it.

### 5.2 Leagues Page
- Header with the admin name, a **Create League** button, Logout, and (Super Admin only) an **Admin Management** link.
- Grid of **League Cards**: name, location, start date, end date, "Weekly" badge, scoring chips (Goals / Assists / Clean Sheets), player count.
- Empty state: "No leagues yet. Create your first league."
- Clicking a card opens League Details.

### 5.3 Create League Form (modal)

**League details**

| Field | Type | Rules |
|---|---|---|
| League Name | text | required, 3–60 chars, unique per admin |
| Start Date | date | required |
| Recurring | toggle / select: `Weekly` | optional; when on, matches repeat every 7 days from start date |
| End Date | date | required if recurring; must be after start date |
| Location | text | required, max 100 chars |

**Matchday and Transfers** (new)

| Field | Type | Rules |
|---|---|---|
| Matchday | select: Mon–Sun | required. The weekday the game is played (one per week) |
| Kickoff Time | time | required. **Proposed addition**: needed to compute the deadline and tracker |
| Matchday End Time | time | required. **Proposed addition**: needed so the tracker knows when a matchday ends and transfers reopen. Must be after kickoff |
| Max Transfers per Matchweek | number input | integer, **min 0, max 7**, required (0 = transfers disabled) |
| Transfer Deadline | select: **6 hrs / 8 hrs / 24 hrs** before matchday | required. After the deadline, transfers are inactive until the matchday ends |

Form behaviour for these fields:
- A helper line under the fields previews the result, e.g. *"First matchday: Sat 10 Oct, 15:00. Transfers close Fri 9 Oct, 15:00 (24 hrs before)."*
- Start/End Date must contain at least one occurrence of the chosen Matchday, otherwise the form shows an error.
- If Recurring (weekly) is off, the league has a single matchday: the first selected weekday on or after the Start Date.

**Points and Scores**
- Multiselect bubbles: **GOALS**, **ASSISTS**, **CLEANSHEETS**. At least one must be selected.
- Selecting a bubble shows a small read-only summary of its point values (see section 7).
- **Create League** button saves it and adds a new League Card without a page reload.

### 5.4 League Details
- Full league info: name, location, dates, recurrence, matchday, kickoff/end time, max transfers per matchweek, transfer deadline, enabled scoring options, and the points table for those options.
- **Automated Matchday Tracker** (see 5.4a) shown prominently at the top.
- **Players List** with photo, name, position badge, OVR. Sort by OVR or position; filter by position.
- **Add Player** button opens the mini registration form.

### 5.4a Automated Matchday Tracker

A status banner that updates itself, with no admin input. It is driven by the generated matchday schedule (section 6) and the league's timezone.

| State | Condition | Banner text (example) |
|---|---|---|
| **Upcoming, transfers open** | Now is before the transfer deadline | `Matchday 1 starts in 3d 4h` · Transfers open, closes in 2d 4h · 3 transfers max |
| **Transfers locked** | Deadline passed, kickoff not yet reached | `Matchday 1 starts in 4hrs` · Transfers closed |
| **Active** | Between kickoff and matchday end | `Matchday 1 Active` · Ends in 1h 30m · Transfers closed |
| **Ended, next scheduled** | Matchday over, another exists | `Matchday 1 ended` · Transfers reopened · `Matchday 2 starts in 6d 20h` |
| **League finished** | Last matchday ended | `League complete` |
| **Not started** | Before the league start date | `League starts on 3 Oct` |

Implementation notes:
- The server returns the schedule and its own current time; the client computes the offset and ticks the countdown every second, so a wrong device clock does not break it.
- Countdown format switches by size: days + hours, then hours + minutes, then minutes + seconds in the final hour.
- The client re-fetches the tracker when a state boundary is crossed (deadline, kickoff, end), so the state always matches the server.
- One shared function, `getMatchdayState(schedule, now)`, is used by the client display and by the server-side transfer check.
- Also shown as a small status chip on each League Card.

### 5.6 Admin Management (Super Admin only)
- Table of admin accounts: name, email, role, created date.
- **Add Admin** button opens a form: name, email, temporary password (or auto-generated), role fixed to `admin`.
- Errors: duplicate email (`409`), weak password, non-super-admin access (`403`; the link is also hidden in the UI).
- Phase 1 scope: create and list. Deactivating admins and password reset are later.
- A regular admin only sees and manages their own leagues. The Super Admin can see all leagues.

### 5.5 Add Player Form (modal)

| Field | Type | Rules |
|---|---|---|
| Player Name | text | required, 2–50 chars |
| Photo | file upload with preview | optional; jpg/png/webp; max 2 MB |
| Position | select: GK / DEF / MID / ST | required |
| OVR | number | required, integer 1–99 |
| **Save** | button | saves to DB; new player appears in the list immediately |

## 6. Data Model

```
admins
  id, email (unique), password_hash, name,
  role ('super_admin' | 'admin'),
  created_by → admins.id (nullable), created_at

leagues
  id, admin_id → admins.id, name, location,
  start_date, end_date, recurrence ('none' | 'weekly'),
  timezone (IANA, e.g. 'Africa/Kampala'),
  matchday_weekday (0–6),
  kickoff_time, matchday_end_time,
  max_transfers (0–7),
  transfer_deadline_hours (6 | 8 | 24),
  created_at

matchdays                          -- generated when the league is created
  id, league_id → leagues.id, number (1, 2, 3 ...),
  matchweek_start_at,              -- start of the 7 days before kickoff
  transfer_deadline_at,            -- kickoff minus deadline hours
  starts_at, ends_at               -- stored in UTC

league_scoring_options            -- which bubbles were selected
  league_id → leagues.id, option ('GOALS' | 'ASSISTS' | 'CLEANSHEETS')
  PRIMARY KEY (league_id, option)

players
  id, league_id → leagues.id, name, photo_url,
  position ('GK' | 'DEF' | 'MID' | 'ST'),
  ovr (1–99), created_at
```

**Schedule generation**: on league creation, the server creates one `matchdays` row per week from the first selected weekday on or after the Start Date, up to the End Date (a single row if not recurring). Times are converted from the league timezone to UTC, so daylight-saving changes stay correct.

**Transfer rule (enforced server-side later, when transfers exist)**: a transfer is allowed only if the current time is inside a matchweek, before that matchday's `transfer_deadline_at`, and the manager has used fewer than `max_transfers` in that matchweek. Transfers reopen after `ends_at`, for the next matchweek.

Player photos are stored as files, with only the URL/path in the DB.
Position-based point values live in code (`points.js`) as one config object, not in the DB, so the rules stay in one place.

## 7. Points Logic

### Base values by position

| Event | GK | DEF | MID | ST |
|---|---|---|---|---|
| **Goal** | 7 | 6 | 5 | 4 |
| **Assist** | 3 | 3 | 3 | 3 |
| **Clean Sheet** | 4 | 4 | 2 | 1 |

### Goal bonus
- Player scores **2 or more goals** in a match: **+3** bonus.
- Player scores **fewer than 2 goals** (i.e. 1 goal): **+1** bonus.
- 0 goals: no bonus.

### Rules
- Only events the league has enabled (Goals / Assists / Clean Sheets) award points.
- If Goals is disabled, the goal bonus is disabled too.
- The engine is a pure function: `calculatePoints(position, {goals, assists, cleanSheet}, enabledOptions) → number`, with unit tests for every position and edge case.

Worked example (ST, 2 goals, 1 assist, in a league with all options on):
`2 × 4 + 1 × 3 + 3 (bonus) = 14`.

## 8. API

Base path: `/api`. All routes except login require an admin session.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/login` | Log in, set cookie |
| POST | `/auth/logout` | Clear cookie |
| GET | `/auth/me` | Current admin, including role |
| GET | `/admins` | **Super Admin only**: list admin accounts |
| POST | `/admins` | **Super Admin only**: create an admin account |
| GET | `/leagues` | List leagues (own; Super Admin sees all) |
| POST | `/leagues` | Create league, including matchday settings; generates the schedule |
| GET | `/leagues/:id` | League details with scoring options and transfer settings |
| GET | `/leagues/:id/tracker` | Matchday schedule, current state, and server time for the tracker |
| GET | `/leagues/:id/players` | Players in a league |
| POST | `/leagues/:id/players` | Register player (`multipart/form-data`) |

## 9. Forms and Error Handling

**Client**
- Inline field errors on blur and on submit; submit disabled while the request is in flight.
- Photo: instant type/size check and preview before upload.
- Global toast for network or server failures; a `FormError` component maps server field errors onto inputs.

**Server**
- Every request validated with Zod. One error format everywhere:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "endDate": "Must be after start date" } } }
  ```
- New validation: `maxTransfers` integer 0–7; `transferDeadlineHours` one of 6, 8, 24; `matchday` one of Mon–Sun; kickoff before end time; date range must contain at least one matchday.
- Status codes: `400` validation, `401` not logged in, `403` not your league or not a Super Admin, `404` not found, `409` duplicate league name or admin email, `413` file too large, `415` bad file type, `500` unexpected (logged, generic message to client).
- Central `errorHandler` middleware; no stack traces leaked.

## 10. Security
- Passwords hashed with bcrypt; JWT in httpOnly, SameSite cookie; CORS locked to the front-end origin.
- Rate limit on `/auth/login`; Helmet for headers.
- Upload filenames regenerated (UUID), MIME type and size checked, never executed.
- Role checks in middleware: `requireAdmin` and `requireSuperAdmin`. Admin can only read and write their own leagues.
- The Super Admin is seeded by a script from environment variables; the role can never be set through the API (new accounts are always `admin`).
- Secrets in environment variables, never committed (`.env.example` provided).

## 11. GitHub and Deployment

1. Create the repo, add `.gitignore` (`node_modules`, `.env`, `uploads/`, `*.db`).
2. **CI** (`ci.yml`): install, lint, test client and server on every PR.
3. **Front end**: build with Vite and deploy to **GitHub Pages** via `deploy.yml` (Vue Router in hash mode, or a 404 redirect fallback).
4. **Back end**: GitHub Pages cannot run Node, so the API deploys to a host such as **Render, Railway or Fly.io**, auto-deploying from `main`. Use Postgres and cloud storage there, because free-tier disks are often ephemeral (SQLite file and uploads would be lost).
5. Client reads the API URL from `VITE_API_URL` (set as a GitHub Actions variable).

## 12. Milestones

| # | Milestone | Deliverable |
|---|---|---|
| 1 | Scaffold | Repo, Vue + Express skeleton, lint, CI |
| 2 | Auth and roles | Super Admin seed, login API with roles, Login screen, route guard, Admin Management screen and `/admins` API |
| 3 | Leagues | DB schema, Create League API (with matchday and transfer settings), schedule generator, Leagues Page, Create League form, League Cards |
| 4 | League Details and Tracker | Details view, scoring summary, `getMatchdayState` with tests, tracker API and live countdown banner |
| 5 | Players | Upload, Add Player API + form, Players List |
| 6 | Points engine | `points.js` with unit tests |
| 7 | Polish and deploy | Error states, responsive layout, README, GitHub Pages + API host |

## 13. Assumptions (please confirm or correct)

1. **Bonus rule**: "3 for 2 goals or more, 1 for less than 2 goals" is read as a **per-match** bonus, and 0 goals earns no bonus.
2. **Weekly recurrence** means one matchday per week between start and end date. The matchday schedule is generated when the league is created and drives the tracker.
3. **Players belong to one league** (not shared across leagues).
4. **Admin accounts** are created only by the Super Admin (who is seeded by a script). No public sign-up.
5. OVR is an integer from 1 to 99.
6. Extra Vue libraries: Pinia and Vue Router only, with hand-built UI styling (no component library).
7. **Matchweek** = the 7 days before a matchday's kickoff. Transfer counts reset each matchweek.
8. **Kickoff Time and Matchday End Time** are added to the form because the tracker and deadline cannot be calculated from the weekday alone.
9. **Timezone**: each league stores a timezone, defaulted from the browser and editable. All tracker times are shown in it.
10. The Transfer Deadline applies to every matchday of the league.

## 14. Open Questions
- Should one player be reusable across several leagues?
- Should the End Date be required when the league is not recurring?
- Which back-end host do you prefer (Render, Railway, Fly.io)?
- Are the Kickoff Time and Matchday End Time fields OK, or do you want fixed defaults (e.g. 15:00 to 17:00)?
- Should the Super Admin see all leagues, or only the ones they created?
- Should the tracker be visible to non-admin users later (yes is the current design)?
