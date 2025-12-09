# Family Feud – Front-End

## Overview
React + Vite SPA that powers the entire Family Feud game experience including the game lobby, player view, and admin controls. The client connects to the Express API for authentication and to **Colyseus.io for real-time multiplayer game state**.

## Tech Stack
- **React 19** with Vite 7
- **React Router 7** for nested routing
- **Colyseus.js** client for WebSocket game state sync
- **CSS** - Custom styles with game-specific themes (`game-board.css`, `game-lobby.css`)

## Available Scripts
```bash
npm install                     # from repo root to install all workspaces
npm start                       # runs client (Vite) + server (Express) concurrently
npm run dev --prefix client     # front-end only (Vite on 5173)
npm run build --prefix client   # production build
npm run lint --prefix client    # lint client code
npm test --prefix client        # run Jest tests
```

## Project Structure
```
client/
  src/
    api/           # API client wrappers (auth, questions, leaderboard)
    colyseus/      # Colyseus client, hooks, and game state management
      client.js      # Colyseus client singleton
      useColyseus.js # Room connection hook with reconnection support
      useGameState.js # Parses Colyseus state for React components
    components/    # Shared UI (Layout, Sidebar, auth providers)
    context/       # React context providers
      game.context.jsx # GameProvider - exposes game state & actions
    pages/         # Route-aligned views
      GameLobby.jsx  # Join/create room, team selection
      PlayerView.jsx # Main game interface with buzzer & answers
      GameBoard.jsx  # Host display view
    routes/        # Protected route wrappers
    styles/        # CSS including game-board.css, game-lobby.css
    tests/         # Jest tests
    utils/         # Navigation metadata and helpers
```

## Current Status
- **Game Engine Complete:** Real-time multiplayer via Colyseus with official Family Feud rules
- **Game Lobby:** Create/join rooms with 6-digit codes, team selection, player ready states
- **Player View:** Buzzer system, answer input, play/pass decisions, steal attempts
- **Auto-Advance:** Rounds progress automatically after 5 seconds (no manual host control needed)
- **Auth:** JWT cookie-based authentication via `AuthProvider`
- **Admin:** Question management and game controls in sidebar

### Routes
| Path | Description |
|------|-------------|
| `/lobby` | Game lobby - create or join a room |
| `/player-view` | Main game interface for players |
| `/game-board` | Host display view (optional) |
| `/signin`, `/signup` | Authentication |
| `/questions` | Admin question management |
| `/leaderboard` | Score rankings |

### Dev Proxy
- Vite dev server proxies API calls to the backend:
  - `/api/*` → http://localhost:3000 (development)
  - WebSocket connects directly to `ws://localhost:3000`
  - Set `credentials: 'include'` for auth routes

## Game Features
- **Face-off:** Buzzer system with server-side timestamp for fairness
- **Play/Pass:** Winning team decides after face-off
- **Strikes:** Automatic on wrong answers (3 strikes = steal opportunity)
- **Steal:** One attempt for opposing team
- **Point Multipliers:** 1x (rounds 1-2), 2x (round 3), 3x (round 4)
- **Reconnection:** Players can reconnect within 2 minutes of disconnect

## Branch & PR Workflow
- Use feature branches per change (e.g., `feature/game-engine`).
- Push the branch and open a PR against `main`. Small follow‑up commits auto‑update the PR.

## Documentation
- `CLAUDE.md` – Development guide for the codebase
- `docs/family-feud-research.md` – Gameplay + UX research summary
- `docs/backend-handoff.md` – API expectations and integration notes
