# Front-End Build Log

_Formerly “Front-End Skeleton Build Log” — now tracks ongoing client-side work beyond the initial scaffolding._

## Timeline – November 4, 2025
1. **16:28** — Captured gameplay + UX research summary (`docs/family-feud-research.md`).
2. **16:57** — Added placeholder data utilities for question sets and sessions.
3. **17:21** — Implemented routing shell with shared layout and navigation metadata.
4. **17:49** — Scaffolded dashboard, question management, session controls, player join, and auth pages with base CSS.
5. **18:14** — Documented backend integration expectations and refreshed project README files.
6. **18:32** — Wired sign-in/sign-up forms to live APIs with response sanitisation and status messaging.
7. **24:15** — Added a basic Home landing (logo, Sign In, Play) with slide‑out menu and hid the global header on `/`.
8. **24:35** — Introduced NotFound, UnderConstruction, and SignedOut pages; routed unfinished actions consistently.
9. **24:45** — Final cleanup: aligned nav button styling, linked logo/home, updated READMEs and handoff notes.

## Timeline – November 12, 2025
2. **22:05** — Built `/game-board` scaffolding with PPT assets (background, question plaque, answer/hidden cards, timer, avatars, empty placeholders).
3. **23:10** — Implemented full host flow: round intro splash per round asset, question zoom overlay, spacebar face-off, answer timers, strikes, steals, scoreboard, and score multipliers.
4. **24:20** — Balanced the eight-slot grid (1/5, 2/6, 3/7, 4/8) and repositioned player panels + controls to mirror the real TV layout.
5. **24:45** — Tuned timers to show only playable seconds, added inline docs/TODOs for backend data hydration, and refreshed README guidance.

## Timeline – November 14, 2025
1. **09:05** — Wired question fetching to `/api/v1/question` and hydrated the gameplay engine with real Mongo data; removed inline placeholder rounds.
2. **10:10** — Connected answer submissions to `/api/v1/ai/:questionId`, added response parsing + Zod validation, and hardened timer restart logic for API failures.
3. **12:00** — Audited secrets/auth handling: verified `.env` ignore rules, documented credential rotation, and filed fixes for cookie naming + async password checks.
4. **13:15** — Updated README/documentation to reflect live backend integration, Atlas query instructions, and outstanding API work.

## Timeline – November 17, 2025
1. **13:07** — Added profile fields (display name, avatar, country/bio) and avatar upload endpoint; wired client to show defaults and sign-up redirect to profile.
2. **13:31** — Simplified auth/nav: protected routes, hidden nav for signed-out users, “Play” goes to Dashboard, removed SignedOut page.
3. **13:52** — Extracted reusable hamburger/drawer component and floated admin drawer; added view-as-user toggle for admins.
4. **14:11** — Dashboard now pulls live question stats, separates Content Overview loading, and shows ERROR on fetch failures; Active Sessions placed above Question Sets.
5. **14:25** — Added session creation flow with default timers/settings, owner-scoped question sets (`/question-sets/mine`), removed Sessions page, unified button styling.


## Verification Steps
- Run `npm install` at repo root to ensure workspace deps restore for both workspaces.
- Provide a populated `.env` (see README sample) with MongoDB + Gemini keys before booting.
- Launch `npm start` to run Vite + Express together; confirm `/game-board` loads a random question and AI endpoint responds.
- Validate linting with `npm run lint --prefix client` (optional; no new lint errors expected).
- Run `npm run build --prefix client` to ensure the Vite production bundle succeeds with asset-heavy Game Board UI.

## Next Actions
- Replace placeholder datasets with API clients once endpoints stabilize.
- Wire form submissions and session actions to live controllers.
- Expand CSS tokens into full design system after functionality sign-off.
- Hydrate `/game-board` with actual round/question JSON, team assignments, and live sockets; remove inline placeholder arrays once backend feed lands.
