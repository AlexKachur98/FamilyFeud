# Family Feud Front-End → Backend Handoff

## Overview
The front-end now exposes dashboards, owner-scoped question set management, session creation, and a fully wired `/game-board`. The board consumes live APIs for random question pulls (`/api/v1/question`), AI-assisted answer validation (`/api/v1/ai/:questionId`), and authentication (`/api/v1/auth/*`). Session creation is available to all signed-in users; question sets are scoped to the authenticated owner via `/api/v1/question-sets/mine`.

## Currently Implemented Endpoints
| Feature | Route | Method | Notes |
| --- | --- | --- | --- |
| Auth signup | `/api/v1/auth/signup` | POST | Returns JWT via cookie `t`; backend must ensure password hashing + duplicate protection. |
| Auth signin | `/api/v1/auth/signin` | POST | Issues JWT cookie; client expects `credentials: 'include'`. |
| Auth validate | `/api/v1/auth/validate` | GET | Used by `AuthProvider` on mount to hydrate session context. |
| Auth signout | `/api/v1/auth/signout` | GET | Clears cookie. |
| User CRUD | `/api/v1/user/:id` | GET/PUT/DELETE | Protected via `requireSignin` + `hasAuthorization`. |
| Questions | `/api/v1/question`, `/api/v1/question/:id` | GET | Random-question endpoint honors `minAnswers`, `maxAnswers`, or `round` query params; `/id` returns full prompt/answers. |
| Question creation | `/api/v1/question` | POST | Basic insertion endpoint (no validation yet). |
| Question sets (all) | `/api/v1/question-sets` | GET | Lists all sets (admin/host use). |
| Question sets (mine) | `/api/v1/question-sets/mine` | GET | Lists sets owned by the authenticated user. |
| Question set creation | `/api/v1/question-sets` | POST | Creates a set owned by the authenticated user. |
| Session creation | `/api/v1/gamesession` | POST | Creates a session (id/accessCode/questionSetId/teams). |
| AI answer check | `/api/v1/ai/:questionId` | POST | Sends `{ userAnswer }` to Gemini; response schema enforced with Zod. |

## Required APIs (Still Outstanding)
| Feature | Route | Method | Notes |
| --- | --- | --- | --- |
| Update question set | `/api/v1/question-sets/:id` | PUT/PATCH | Allow editing metadata and answer ordering. |
| Delete question set | `/api/v1/question-sets/:id` | DELETE | Soft-delete preferred for audit. |
| List sessions | `/api/v1/gamesession` | GET | Should surface associated question set, status, updated timestamp. |
| Session actions | `/api/v1/gamesession/:id/actions` | POST | Body `{"action":"addStrike"|"revealAnswer"|...}` to keep UI buttons thin. |
| Player join | `/api/v1/player-sessions/join` | POST | Accepts access code + display name. Returns player token (JWT) and assigned team. |
| Auth forgot password | `/api/v1/auth/forgot-password` | POST | Initiates password reset email/token. |
| Auth reset password | `/api/v1/auth/reset-password` | POST | Confirms token + sets new password (bcrypt/argon). |

## Dev Integration Notes
- The front-end dev server proxies `/api/v1/*` to the Express backend on `http://localhost:3000`. Keep CORS permissive (`origin` env var) in development.
- Cookies should be `HttpOnly` + `SameSite=Strict` in prod; for local HTTP you may temporarily disable `secure` to allow testing.
- Include lightweight `role` metadata in auth responses so the SPA can route hosts/producers.

## Real-Time Transport
- WebSocket namespace suggestion: `/ws/sessions/:id` broadcasting strikes, revealed answers, points, buzzer lockouts.
- Player buzzer: emit `playerBuzz` events containing session ID, player ID, timestamp; host receives queue for arbitration.

## Response Shapes
- Question set resources should strip internal IDs from answers when possible to keep payload minimal.
- Session responses should include `teams`, `scores`, `strikes`, `currentRound`, and `status` fields aligning with placeholders used in `Sessions.jsx`.
- Auth responses must omit sensitive fields (`hashed_password`, `salt`) and include role metadata so the front-end can route hosts/producers after sign-in.

## Action Items from Latest Audit
- **Secrets hygiene:** `.env` is ignored, but rotate any credentials previously committed or shared. Never bundle production Atlas URIs/API keys into the repo.
- **Auth middleware alignment:** `auth.controller` sets cookie `t`, but `auth.middleware` looks for `req.cookies.token` and stores decoded data on `req.user` while `hasAuthorization` reads `req.auth`. Update middleware to read the correct cookie name and expose the decoded token on both `req.user` and `req.auth`.
- **Password comparison:** `UserSchema.methods.comparePassword` is async; `signin` should `await user.comparePassword(password)` to avoid false positives/negatives.
- **Gemini config:** Instantiate `GoogleGenAI` with `{ apiKey: process.env.GEMINI_API_KEY }` and add logging for AI failures so `/api/v1/ai/:questionId` returns actionable errors.

## Validation Considerations
- Enforce unique prompt/title combos per owner to avoid duplicates.
- Answer totals should reflect actual survey percentages; reject sums over 100.
- Access codes should be random six-digit strings with TTL; include regeneration endpoint.

## Error Handling
- Surfaces should return structured errors `{ error: string, details?: object }` so UI can render inline validation.
- Rate limit player join + buzzer endpoints to avoid spam.

## Next Steps
1. Implement REST controllers matching the routes above (see inline TODOs for file references).
2. Provide API schema / Swagger snippet so the front-end can wire fetch utilities.
3. Deliver socket event contract for buzzer/host actions to keep latency low.
