# Family Feud – Product & UX Research

## Source Material
- [familyfeudquestions.com](https://www.familyfeudquestions.com/) provides curated survey questions, answer rankings, and point distributions used on the show.
- Official gameplay references (Hasbro rules, syndicated episodes) outline the round formats, strike rules, and fast money mechanics.

## Gameplay Structure
1. **Survey Bank** – Each question lists top answers ranked by popularity with a fixed point value. Most sets present 4–8 answers.
2. **Faceoff Round** – One player from each team buzzes in. Highest ranking answer grants control; opposing team can steal if controller fails to clear board.
3. **Strike System** – Three incorrect guesses (“strikes”) flip control to the opposing team for a single steal attempt.
4. **Scoring** – Points equal the sum of revealed answers per round. Later rounds may double/triple points.
5. **Fast Money** – Final bonus round where two players answer rapid-fire questions; combined score >200 yields bonus payout.

## Data Requirements
- Question object: prompt, list of answers (text, points, rank, revealed flag), category, difficulty, round type multiplier.
- Game session: teams, current round index, strikes, revealed answers, active player, timer state, scoreboard.
- Event log: sequence of guesses, strikes, steals for auditing/replay.

## Front-End Considerations
- Host dashboard controls question reveal, strike tracking, and team management.
- Player view requires buzzer interaction, answer submission, and status updates in real time.
- Need responsive layout optimized for TV/monitor display plus mobile controller.
- Accessibility: large typography, audible feedback cues (to be added later).

## Integration Notes
- Prefer WebSocket channel for buzzer latency; REST endpoints handle CRUD for question sets and sessions.
- Authentication ensures only authorized hosts modify sessions; players join via session PIN.
- Persisting question sets enables reuse and admin curation.

## Deliverables for First Release (Front-End)
- CRUD interface for question sets (list, create, edit, delete) consuming backend APIs.
- Host control panel skeleton with strike tracker, revealed answers grid, and score summary.
- Player lobby with session join form and buzzer placeholder.
- Inline `TODO (Backend Team)` markers where sockets/API hooks will connect.

## Risks & Open Questions
- Do we support Fast Money in release one or defer to later sprint?
- Need confirmation on hosting environment to size bundle and asset strategy.
- Clarify whether authentication uses cookies or bearer tokens for SPA integration.
