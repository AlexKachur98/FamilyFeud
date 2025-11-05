# Family Feud

### Project Overview

Family Feud is a web-based implementation of the classic survey-style game show. Two teams compete to guess the most popular survey answers, earn points, and advance through rounds until a winning team is declared. This project focuses on real-time interaction, simple game state management, and an approachable UI for players and a host.

### Key Features

- Two-team match play with alternating turns
- Survey-based questions with revealed answers and point values
- Buzzer and turn control for host and players
- Round progression and score tracking
- Responsive UI for desktop and mobile
- Local multiplayer with optional network play

### Tech Stack

- Frontend: React (or your preferred framework) for interactive UI
- Backend: Node.js + Express (optional WebSocket layer for real-time sync)
- Data: JSON or lightweight DB for question sets and scores
- Build tools: npm / yarn, webpack or Vite

### Running Locally

1. Clone the repository.
2. Install dependencies: `npm install`
3. Configure environment (if needed): copy `.env.example` to `.env` and adjust values.
4. Start the app: `npm start`
5. Open the app in a browser at `http://localhost:3000` (or the port shown).

### Contributing

- Open issues for bugs or feature requests.
- Create feature branches and submit pull requests with clear descriptions.
- Keep changes focused and include tests or a short demo when applicable.

### Notes

- Question sets are customizable — add or edit JSON data files to change surveys.
- Consider adding authentication and persistent storage for extended multiplayer sessions.

### Current Sprint Snapshot (2025-11-04)
- Front-end skeleton established with a basic Home landing (logo + Sign In/Play), dashboard, question management, session control, player join, and auth stubs.
- Placeholder data lives in `client/src/utils/questionSets.js` and `client/src/utils/gameSessions.js` until APIs land.
- Documentation added under `docs/` covering gameplay research, backend handoff expectations, and build log.
- Authentication forms now hit live endpoints; placeholder sanitisation in place until backend trims response fields.
- Styling remains basic; design system pass deferred to next milestone.

### Dev Proxy
- Vite development server proxies `/api/*` and `/auth/*` to the Express backend on `http://localhost:3000` so sign‑in/sign‑up work locally with cookies.

### Placeholder Routes
- `/under-construction` indicates incomplete flows/actions.
- `/signed-out` confirms sign‑out.
- Unknown routes render a friendly 404 page.
