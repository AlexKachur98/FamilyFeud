# Family Feud Front-End → Backend Handoff

## Overview
The front-end skeleton now exposes host dashboards, question set management, session controls, and a contestant join flow. All data is placeholder-only; every interactive element is annotated with `TODO (Backend Team)` markers that map to expected API routes.

## Required APIs
| Feature | Route | Method | Notes |
| --- | --- | --- | --- |
| List question sets | `/api/v1/question-sets` | GET | Support pagination & optional filters (`category`, `roundType`, `tag`). |
| Create question set | `/api/v1/question-sets` | POST | Payload includes prompt, answers array, tags, round type. Return created entity. |
| Update question set | `/api/v1/question-sets/:id` | PUT/PATCH | Allow editing metadata and answer ordering. |
| Delete question set | `/api/v1/question-sets/:id` | DELETE | Soft-delete preferred for audit. |
| List sessions | `/api/v1/sessions` | GET | Should surface associated question set title, status, updated timestamp. |
| Create session | `/api/v1/sessions` | POST | Returns access code + initial team shells. |
| Session actions | `/api/v1/sessions/:id/actions` | POST | Body `{"action":"addStrike"|"revealAnswer"|...}` to keep UI buttons thin. |
| Player join | `/api/v1/player-sessions/join` | POST | Accepts access code + display name. Returns player token (JWT) and assigned team. |
| Auth sign-in | `v1//auth/signin` | POST | Current middleware expects JWT cookie `t`. Consider setting HttpOnly + SameSite. |
| Auth sign-out | `v1//auth/signout` | GET | Clears cookie. |
| Auth sign-up | `v1//auth/signup` | POST | Optionally queue approvals; respond with pending status. |
| Forgot password | `v1//auth/forgot-password` | POST | Initiates password reset email/token. |
| Reset password | `v1//auth/reset-password` | POST | Confirms token + sets new password (bcrypt/argon). |

## Dev Integration Notes
- The front-end dev server proxies both `/api/v1/*` and `/api/v1/auth/*` to the Express backend on `http://localhost:3000`. Keep CORS permissive in development.
- Please set cookies with `HttpOnly`, `SameSite=Lax` (or `Strict` where possible), and `Secure` in production (HTTPS). The client already sends `credentials: 'include'`.
- Consider including lightweight `role` metadata in auth responses so the SPA can route hosts/producers.

## Real-Time Transport
- WebSocket namespace suggestion: `/ws/sessions/:id` broadcasting strikes, revealed answers, points, buzzer lockouts.
- Player buzzer: emit `playerBuzz` events containing session ID, player ID, timestamp; host receives queue for arbitration.

## Response Shapes
- Question set resources should strip internal IDs from answers when possible to keep payload minimal.
- Session responses should include `teams`, `scores`, `strikes`, `currentRound`, and `status` fields aligning with placeholders used in `Sessions.jsx`.
- Auth responses must omit sensitive fields (`hashed_password`, `salt`) and include role metadata so the front-end can route hosts/producers after sign-in.

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
