# Family Feud – Front-End Skeleton

## Overview
React + Vite SPA that powers the dashboard, question management, session creation, and full-screen game board experiences for the Family Feud project. The client wires directly to the Express API for authentication, random question pulls, AI-powered answer validation, and owner-scoped question sets.

## Tech Stack
- React 19 with Vite 7
- React Router 7 for nested routing
- Plain CSS modules (`styles/index.css`) for baseline layout primitives

## Available Scripts
```bash
npm install                     # from repo root to install all workspaces
npm start                       # runs client (Vite) + server (Express) concurrently
npm run dev --prefix client     # front-end only (Vite on 5173)
npm run build --prefix client   # production build
```

## Project Structure
```
client/
  src/
    components/      # Shared UI primitives (Layout, PageSection)
    pages/           # Route-aligned views (dashboard, question sets, auth, etc.)
    gameplay/        # Game board engine, constants, and helpers
    utils/           # API client + helpers
    styles/          # Baseline, un-themed CSS tokens
```

## Current Status
- Dashboard shows live stats (question sets, questions) and active sessions; session creation is available to all signed-in users via `/session-create`.
- Question sets are owner-scoped and fetched via `/api/v1/question-sets/mine`.
- Sessions page was removed; session creation and overview live on the dashboard.
- Auth views call `/api/v1/auth/*` endpoints (signin/signup/signout/validate) to manage JWT cookie state via `AuthProvider`.
- Home landing + game board share a slide-out drawer; global header hides on `/` for hero focus.
- `/game-board` is fully data-driven: it fetches random rounds via `/api/v1/question`, submits guesses to `/api/v1/ai/:questionId`, and uses `useGameBoardEngine` for timers/buzz/strike logic.
- Placeholder routes:
  - `/under-construction` for unfinished flows/actions
  - `*` → 404 Not Found page

### Dev Proxy
- Vite dev server proxies API calls to the backend:
  - `/api/*` → http://localhost:3000 (development)
  - `/auth/*` → http://localhost:3000 (development)
  - Set `credentials: 'include'` when calling auth routes so the cookie is stored.

## Next Steps
1. Replace dashboard/session placeholder utilities with live REST endpoints when available.
2. Fix auth edge cases (await password comparison, align cookie names) and add better error messaging in the client once backend patch lands.
3. Layer in real-time communication (Socket.IO or native WebSocket) for buzzer + host controls.
4. Apply design system styling and responsive refinements after functionality stabilizes (PPT assets establish current layout ratios).
5. Replace placeholder routes (UnderConstruction) with final implementations as endpoints and flows land.

## Branch & PR Workflow
- Use feature branches per change (e.g., `feature/front-end-skeleton`).
- Push the branch and open a PR against `main`. Small follow‑up commits auto‑update the PR.

## Documentation
- `docs/family-feud-research.md` – gameplay + UX research summary.
- `docs/backend-handoff.md` – endpoint expectations and integration notes for backend teammates.
- `docs/frontend-log.md` – build timeline, verification steps, next actions.
