/**
 * @file Sessions.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Monitor and manage active Family Feud sessions.
 */
import PageSection from '../components/PageSection.jsx';
import { getActiveSessions } from '../utils/gameSessions.js';
import { getQuestionSetById } from '../utils/questionSets.js';

export default function Sessions() {
  const sessions = getActiveSessions();

  return (
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Live Control</p>
        <h2>Sessions</h2>
        <p>Oversee lobbies, launch rounds, and keep scores synchronized.</p>
      </header>

      <PageSection
        title="Session Lobby"
        description="Use this control panel to advance rounds and manage teams."
      >
        {sessions.map((session) => {
          const questionSet = getQuestionSetById(session.questionSetId);

          return (
            <article key={session.id} className="session-card">
              <header className="session-card__header">
                <div>
                  <p className="session-card__code">Code: {session.accessCode}</p>
                  <h3>{questionSet?.title ?? 'Unknown Set'}</h3>
                </div>
                <span className="session-card__status">{session.status}</span>
              </header>
              <dl className="session-card__meta">
                <div>
                  <dt>Round</dt>
                  <dd>{session.currentRound + 1}</dd>
                </div>
                <div>
                  <dt>Teams</dt>
                  <dd>{session.teams.map((team) => `${team.name} (${team.score})`).join(' vs ')}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(session.updatedAt).toLocaleTimeString()}</dd>
                </div>
              </dl>
              <div className="session-card__actions">
                <button type="button">Reveal Next Answer</button>
                <button type="button">Add Strike</button>
                <button type="button">Award Points</button>
                <button type="button">End Round</button>
              </div>
              {/* TODO (Backend Team): subscribe to WebSocket session channel for live updates. */}
            </article>
          );
        })}
      </PageSection>

      <PageSection
        title="Session Utilities"
        description="Tools for moderators and scorekeepers."
      >
        <div className="action-grid">
          <button type="button">Generate New Access Code</button>
          <button type="button">Download Session Log</button>
          <button type="button">Archive Session</button>
        </div>
        {/* TODO (Backend Team): map utilities to POST /api/sessions/:id/actions endpoints. */}
      </PageSection>
    </div>
  );
}
