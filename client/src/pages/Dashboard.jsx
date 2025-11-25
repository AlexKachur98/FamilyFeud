import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { apiFetch } from '../utils/api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [questionSets, setQuestionSets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [stats, setStats] = useState({
    totalSets: 0,
    doubleTriple: 0,
    holiday: 0,
    totalQuestions: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch question sets (non-critical - can fail gracefully)
        try {
          const setsResponse = await apiFetch('/question-sets', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          let setsData = [];
          if (setsResponse.ok) {
            setsData = await setsResponse.json();
          } else {
            console.warn('Question sets fetch warning:', await setsResponse.text());
          }

          // Calculate stats safely
          const calculatedStats = {
            totalSets: setsData.length,
            doubleTriple: setsData.filter(set => set.roundType !== 'single').length,
            holiday: setsData.filter(set => set.tags?.includes('holiday')).length,
            totalQuestions: setsData.reduce((sum, set) => sum + (set.questions?.length || 0), 0)
          };
          setStats(calculatedStats);
          setQuestionSets(setsData);
        } catch (setsErr) {
          console.error('Question sets fetch error:', setsErr);
          // We'll still show the dashboard, just with empty question sets
        }

        // Fetch sessions (also non-critical)
        try {
          const sessionsResponse = await apiFetch('/gamesession', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            setSessions(sessionsData);
          } else {
            console.warn('Sessions fetch warning:', await sessionsResponse.text());
          }
        } catch (sessionsErr) {
          console.error('Sessions fetch error:', sessionsErr);
          // We'll still show the dashboard, just with empty sessions
        }

      } catch (err) {
        // Only set error for completely unexpected errors
        console.error('Unexpected error:', err);
        setFetchError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="game_theme" style={{ minHeight: '100vh' }}>
        <div className="page page--stacked">Loading dashboard...</div>
      </div>
    );
  }
  
  return (
    <div className="game_theme">
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Control Center</p>
        <h2>Welcome back, Host</h2>
        <p>Review high-level activity before launching your next Family Feud session.</p>
      </header>

      {fetchError && (
        <div className="global-error">
          <p>{fetchError}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <PageSection
        title="Content Overview"
        description="Track the question sets available for upcoming matches."
      >
        <div className="grid grid--stats">
          <article>
            <p>Total Sets</p>
            <strong>{stats.totalSets}</strong>
          </article>
          <article>
            <p>Double/Triple Rounds</p>
            <strong>{stats.doubleTriple}</strong>
          </article>
          <article>
            <p>Tagged for Holiday Shows</p>
            <strong>{stats.holiday}</strong>
          </article>
          <article>
            <p>Total Questions</p>
            <strong>{stats.totalQuestions}</strong>
          </article>
        </div>
      </PageSection>

      <PageSection
        title="Question Sets"
        description="Manage your question sets."
        actions={<button type="button" onClick={() => navigate('/question-sets/create')}>Create New Set</button>}
      >
        {questionSets.length === 0 ? (
          <div className="empty-state">
            <p>No question sets found.</p>
            <p>Create your first question set to organize your game content.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/question-sets/create')}
            >
              Create First Question Set
            </button>
          </div>
        ) : (
          <div className="table-placeholder">
            <div className="table-placeholder__row table-placeholder__row--head">
              <span>Title</span>
              <span>Round Type</span>
              <span>Questions</span>
              <span>Tags</span>
              <span>Actions</span>
            </div>
            {questionSets.map((set) => (
              <div key={set._id} className="table-placeholder__row">
                <span>{set.title}</span>
                <span>{set.roundType}</span>
                <span>{set.questions?.length || 0}</span>
                <span>{set.tags?.join(', ') || 'None'}</span>
                <span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate(`/question-sets/${set._id}`)}
                  >
                    View
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title="Active Sessions"
        description="Monitor lobbies and live games."
        actions={<button type="button" onClick={() => navigate('/sessions/create')}>Create Session</button>}
      >
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>No active sessions.</p>
            <p>Create a new session to start a game.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/sessions/create')}
            >
              Create New Session
            </button>
          </div>
        ) : (
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
                <span>{session.questionSetId || 'None'}</span>
                <span>{session.teams?.map((team) => team.name).join(' vs ') || 'None'}</span>
                <span>{session.updatedAt ? new Date(session.updatedAt).toLocaleTimeString() : 'Never'}</span>
                <span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    Open
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title="Quick Actions"
        description="Launch the most common workflows from one place."
      >
        <div className="action-grid">
          <button type="button" onClick={() => navigate('/questions/import')}>Import Questions</button>
          <button type="button" onClick={() => navigate('/fast-money')}>Start Fast Money</button>
          <button type="button" onClick={() => navigate('/analytics')}>View Analytics</button>
        </div>
      </PageSection>
    </div>
    </div>
  );
}
