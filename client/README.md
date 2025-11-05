# Family Feud – Front-End Skeleton

## Overview
React + Vite SPA that powers the host dashboard, question management, session control, and contestant join experiences for the Family Feud project. Styling is intentionally minimal; focus is on layout structure, data requirements, and integration touch points for the upcoming backend release.

## Tech Stack
- React 19 with Vite 7
- React Router 7 for nested routing
- Plain CSS modules (`styles/index.css`) for baseline layout primitives

## Available Scripts
```bash
npm install       # from repository root to install all workspaces
npm run dev       # runs client (Vite) and server (Express) concurrently
npm run dev --prefix client  # front-end only
```

## Project Structure
```
client/
  src/
    components/      # Shared UI primitives (Layout, PageSection)
    pages/           # Route-aligned views (dashboard, sessions, auth, etc.)
    utils/           # Placeholder data scaffolding for question sets & sessions
    styles/          # Baseline, un-themed CSS tokens
```

## Current Status
- Host dashboard surfaces placeholder metrics via `questionSets.js` and `gameSessions.js`.
- Question set CRUD form and list are static shells with inline `TODO (Backend Team)` annotations.
- Sessions view outlines live controls and utility actions awaiting API hooks.
- Player join screen delivers access code form plus buzzer button ready for WebSocket wiring.
- Auth views now call `/api/users/` and `/auth/signin`, sanitising responses until backend removes sensitive fields.
- Basic full-screen Home landing is live on `/` (dark blue stage color, centered logo, Sign In and Play buttons). A simple slide‑out menu (hamburger top‑left) provides quick links while the global header is hidden on the landing screen.

### Dev Proxy
- Vite dev server proxies API calls to the backend:
  - `/api/*` → http://localhost:3000 (development)
  - `/auth/*` → http://localhost:3000 (development)
  - Set `credentials: 'include'` when calling auth routes so the cookie is stored.

## Next Steps
1. Replace placeholder data with fetch hooks once REST endpoints are available.
2. Introduce global state management (React Query or Redux) as soon as live data is consumed.
3. Layer in real-time communication (Socket.IO or native WebSocket) for buzzer + host controls.
4. Apply design system styling and responsive refinements after functionality stabilizes.
5. Replace the temporary landing drawer with a shared, auth‑aware global nav and surface role‑based routes after sign‑in.

## Documentation
- `docs/family-feud-research.md` – gameplay + UX research summary.
- `docs/backend-handoff.md` – endpoint expectations and integration notes for backend teammates.
- `docs/frontend-skeleton-log.md` – build timeline, verification steps, next actions.
