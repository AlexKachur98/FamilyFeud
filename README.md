# Family Feud

### Project Overview

Family Feud is a full-stack recreation of the survey-style game show built as a mono-repo. A React SPA provides the player/host interface while an Express + MongoDB API powers authentication, question storage, AI-based answer validation, and leaderboard tracking. **Real-time multiplayer is powered by Colyseus.io** for WebSocket-based game state synchronization. Two teams compete to guess the most popular survey answers, earn points, and advance through rounds until a winning team is declared.

### Key Features

- **Real-time multiplayer:** Colyseus.io WebSocket framework for instant game state sync across all players
- **Official Family Feud rules:** Face-off buzzer system, play/pass decisions, automatic strikes, steal attempts, point multipliers (1x/2x/3x)
- **Monorepo architecture:** npm workspace linking `client/` (React + Vite) and `server/` (Express 5 + Colyseus) for coordinated builds
- **AI-assisted validation:** Google Gemini 2.5 Flash Lite with Zod schema enforcement for lenient answer matching (handles misspellings, synonyms)
- **Question service:** MongoDB Atlas-backed question collection with randomizer supporting answer count filters
- **Authentication:** JWT-based sign-up/in/out flows with HttpOnly cookies, bcrypt-hashed passwords
- **Leaderboard:** Persistent score tracking across games
- **Security & ops:** Rate limiting, helmet/cors/compression, environment variable management

### Tech Stack

- **Frontend:** React 19 + Vite 7
- **Backend:** Node.js 20 + Express 5 + MongoDB (Mongoose ODM)
- **Real-time:** Colyseus.io 0.16 (WebSocket game server)
- **Auth:** JWT (HttpOnly cookie-based)
- **AI:** Google Gemini 2.5 Flash Lite for fuzzy answer matching
- **Tooling:** npm workspaces, nodemon, Vite dev server

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

### Game Flow

1. **Lobby:** Host creates a game room (6-digit code), players join via code
2. **Face-off:** Two players buzz in, higher-ranked answer wins control
3. **Play/Pass:** Winning team chooses to play or pass to opponents
4. **Play Phase:** Team answers until 3 strikes or all answers revealed
5. **Steal:** Opposing team gets ONE chance to steal points
6. **Round End:** Points awarded, auto-advances to next round (5 second delay)
7. **Game Over:** After 4 rounds, winner declared

Point multipliers: Rounds 1-2 = 1x, Round 3 = 2x, Round 4 = 3x

### Backend API Snapshot

| Route | Method | Description |
| --- | --- | --- |
| `/api/v1/auth/signup` | POST | Registers a new user, returns JWT cookie + profile |
| `/api/v1/auth/signin` | POST | Authenticates user credentials |
| `/api/v1/auth/signout` | GET | Clears auth cookie |
| `/api/v1/user/:id` | GET/PUT/DELETE | Protected user profile management |
| `/api/v1/question` | GET | Returns randomized question with optional `minAnswers`, `maxAnswers` filters |
| `/api/v1/question/:id` | GET | Fetches a specific question/answers |
| `/api/v1/rooms/find/:code` | GET | Finds Colyseus room by 6-digit code |
| `/api/v1/leaderboard` | GET/POST | Leaderboard management |

### Colyseus Game Server

The game uses Colyseus.io for real-time multiplayer:

- **WebSocket endpoint:** `ws://localhost:3000` (dev) / `wss://your-server.com` (prod)
- **Room type:** `family_feud`
- **State sync:** Automatic synchronization of game phase, teams, answers, scores
- **Reconnection:** Supports player reconnection within 2 minutes of disconnect

### Contributing

- Open issues for bugs or feature requests.
- Create feature branches and submit pull requests with clear descriptions.
- Keep changes focused and include tests or a short demo when applicable.

### Notes

- Question sets are customizable via the admin interface or direct database edits.
- AI validation has a 5-second timeout with fallback to simple string matching.

### Security Notes
- `.env` is intentionally ignored—rotate any credentials that were shared previously and avoid committing secrets.
- Cookies are currently marked `Secure`; when testing over HTTP, consider toggling this flag.
- Rate limiting is enabled on general routes (`server/middlewares/rateLimiter.js`); extend it for auth endpoints before production launch.

### Dev Proxy
- Vite development server proxies `/api/*` to the Express backend on `http://localhost:3000` so sign‑in/sign‑up work locally with cookies.

### Placeholder Routes
- `/under-construction` indicates incomplete flows/actions.
- `/signed-out` confirms sign‑out.
- Unknown routes render a friendly 404 page.
