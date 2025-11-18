# Family Feud

### Project Overview

Family Feud is a full-stack recreation of the survey-style game show built as a mono-repo: a React SPA hosts the entire producer/host interface while an Express + MongoDB API powers authentication, question storage, AI-based answer validation, and session management. Two teams compete to guess the most popular survey answers, earn points, and advance through rounds until a winning team is declared. The project emphasizes responsive host tooling, low-latency gameplay, and clear integration touchpoints for extending the experience (sessions, lobby management, real-time sockets).

### Key Features

- **Monorepo architecture:** npm workspace linking `client/` (React + Vite) and `server/` (Express 5) for coordinated builds and shared tooling.
- **Question service:** MongoDB Atlas-backed question collection with `GET /api/v1/question` randomizer supporting `minAnswers`, `maxAnswers`, and `round` buckets, plus `GET /:id` + `POST /` for manual curation.
- **Gameplay engine:** React hook (`useGameBoardEngine`) orchestrates round intros, spacebar buzz, timers, strikes, steals, scoring, and scoreboard persistence for eight-card layouts.
- **AI-assisted validation:** `/api/v1/ai/:questionId` proxies to Google Gemini 2.5 Flash Lite with Zod schema enforcement to leniently match misspelled answers while guarding responses.
- **Authentication:** JWT-based sign-up/in/out flows with HttpOnly cookies, bcrypt-hashed passwords, and middleware for route protection.
- **Host tooling:** Dashboard, question set management (owner-scoped), session creation, and leaderboard pages with shared layout + navigation metadata.
- **Security & ops:** Express rate limiting, helmet/cors/compression, `.env` management, and documentation covering secrets hygiene and API expectations.

### Tech Stack

- Frontend: React 19 + Vite 7
- Backend: Node.js 20 + Express 5 + MongoDB (Mongoose ODM)
- Auth: JWT (cookie-based)
- AI: Google Gemini 2.5 Flash Lite for answer normalization
- Tooling: npm workspaces, nodemon, concurrently, Vite dev server

### Running Locally

1. Clone the repository.
2. Install dependencies: `npm install`
3. Create `.env` based on the sample below (never commit secrets; keep them in local `.env` only):
   ```bash
   NODE_ENV=development
   PORT=3000
   MONGODB_URI="mongodb+srv://<user>:<pass>@cluster-host/FamilyFeud"
   JWT_SECRET="replace-with-strong-secret"
   GEMINI_API_KEY="your-google-genai-key"
   GOOGLE_API_KEY="same-as-above-if-needed"
   VITE_CLIENT_URL="http://localhost:5173"
   VITE_LOCAL_URL="http://localhost:3000"
   VITE_SERVER_URL="https://your-production-server"
   ```
4. Start both workspaces: `npm start` (runs Vite + Express together with nodemon)
5. Front-end only: `npm run dev --prefix client`
6. Open the app in a browser at `http://localhost:5173` (Vite) or `http://localhost:3000` (proxy target).

### Backend API Snapshot

| Route | Method | Description |
| --- | --- | --- |
| `/api/v1/auth/signup` | POST | Registers a new host, returns JWT cookie + profile |
| `/api/v1/auth/signin` | POST | Authenticates host credentials |
| `/api/v1/auth/signout` | GET | Clears auth cookie |
| `/api/v1/user/:id` | GET/PUT/DELETE | Protected user profile management |
| `/api/v1/question` | GET | Returns randomized question ID + metadata with optional `minAnswers`, `maxAnswers`, or `round` query params |
| `/api/v1/question/:id` | GET | Fetches a specific question/answers |
| `/api/v1/ai/:questionId` | POST | Sends `{ userAnswer }` for AI validation; response includes `{ index, answer, points }` |
| `/api/v1/question-sets` | GET | Lists all question sets (admin/host use) |
| `/api/v1/question-sets/mine` | GET | Lists question sets owned by the authenticated user |
| `/api/v1/question-sets` | POST | Creates a question set owned by the authenticated user |
| `/api/v1/gamesession` | POST | Creates a session (id/accessCode/questionSetId/teams) |

> **Note:** Additional CRUD endpoints for question sets/sessions remain TODO (see `docs/backend-handoff.md`).

### Game Board Preview

- Route: `/game-board`
- Round intro splash uses asset-specific overlays (`public/Round_One.png`, `Round_Two.png`, etc.).
- Press **Space** to buzz in; the input unlocks only for the active player during their timer window.
- Timers, strikes, and steal flow run client-side so latency is minimal; questions and AI validation are live.

### Contributing

- Open issues for bugs or feature requests.
- Create feature branches and submit pull requests with clear descriptions.
- Keep changes focused and include tests or a short demo when applicable.

### Notes

- Question sets are customizable — add or edit JSON data files to change surveys.
- Consider adding authentication and persistent storage for extended multiplayer sessions.

### Current Sprint Snapshot (2025-11-12)
- Shared hamburger/drawer nav extracted and reused across landing + `/game-board`.
- Host game board now mirrors the TV layout: round intros, question zoom, face-off buzzing, timers, strikes, steals, scoring, and placeholder assets for cards/players.
- Board logic enforces eight-slot symmetry (rows render 1/5, 2/6, 3/7, 4/8) and keeps empty cards in the bottom rows for visual balance.
- Timers use client-side grace windows so spacebar buzzing and answer windows feel snappy offline; backend hooks will subscribe to the same events later.
- README and build log refreshed with the latest front-end expectations; backend integration TODOs remain for real data feeds.

### Security Notes
- `.env` is intentionally ignored—rotate any credentials that were shared previously and avoid committing secrets.
- Cookies are currently marked `Secure`; when testing over HTTP, consider toggling this flag.
- Rate limiting is enabled on general routes (`server/middlewares/rateLimiter.js`); extend it for auth/buzzer endpoints before production launch.

### Dev Proxy
- Vite development server proxies `/api/*` and `/auth/*` to the Express backend on `http://localhost:3000` so sign‑in/sign‑up work locally with cookies.

### Routes of Note
- `/session-create` for creating sessions (CTA on Dashboard)
- `/question-sets` for creating/viewing your sets (Dashboard CTA)
- `/under-construction` indicates incomplete flows/actions.
- Unknown routes render a friendly 404 page.
