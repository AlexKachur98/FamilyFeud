/**
 * @file Dashboard.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Host landing screen summarizing Family Feud content and live sessions.
 */
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { getQuestionSets } from '../utils/questionSets.js';
import { getActiveSessions } from '../utils/gameSessions.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const questionSets = getQuestionSets();
  const sessions = getActiveSessions();

  return (
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Control Center</p>
        <h2>Welcome back, Host</h2>
        <p>Review high-level activity before launching your next Family Feud session.</p>
      </header>

      <PageSection
        title="Content Overview"
        description="Track the question sets available for upcoming matches."
      >
        <div className="grid grid--stats">
          <article>
            <p>Total Sets</p>
            <strong>{questionSets.length}</strong>
          </article>
          <article>
            <p>Double/Triple Rounds</p>
            <strong>{questionSets.filter((set) => set.roundType !== 'single').length}</strong>
          </article>
          <article>
            <p>Tagged for Holiday Shows</p>
            <strong>{questionSets.filter((set) => set.tags.includes('holiday')).length}</strong>
          </article>
        </div>
      </PageSection>

      <PageSection
        title="Active Sessions"
        description="Monitor lobbies and live games."
        actions={<button type="button" onClick={() => navigate('/under-construction')}>Create Session</button>}
      >
        <div className="table-placeholder">
          <div className="table-placeholder__row table-placeholder__row--head">
            <span>Code</span>
            <span>Status</span>
            <span>Question Set</span>
            <span>Teams</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>
          {sessions.map((session) => (
            <div key={session.id} className="table-placeholder__row">
              <span>{session.accessCode}</span>
              <span>{session.status}</span>
              <span>{session.questionSetId}</span>
              <span>{session.teams.map((team) => team.name).join(' vs ')}</span>
              <span>{new Date(session.updatedAt).toLocaleTimeString()}</span>
              <span>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate('/under-construction')}
                >
                  Open
                </button>
              </span>
            </div>
          ))}
        </div>
        {/* TODO (Backend Team): replace placeholder data with GET /api/sessions response. */}
      </PageSection>

      <PageSection
        title="Quick Actions"
        description="Launch the most common workflows from one place."
      >
        <div className="action-grid">
          <button type="button" onClick={() => navigate('/under-construction')}>Import Survey CSV</button>
          <button type="button" onClick={() => navigate('/under-construction')}>Start Fast Money</button>
          <button type="button" onClick={() => navigate('/under-construction')}>View Analytics</button>
        </div>
        {/* TODO (Backend Team): wire quick actions to respective endpoints/workflows. */}
      </PageSection>
    </div>
  );
}
