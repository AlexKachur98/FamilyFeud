import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../api/api.js';
import { useQuestions } from '../context/questions.context.jsx';

import PageSection from '../components/PageSection.jsx';
import logo from '/Family_Feud_Logo.png';

export default function Dashboard() {
  const navigate = useNavigate();

  const { totalQuestionCount } = useQuestions();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [stats, setStats] = useState({
    totalSets: 0,
    doubleTriple: 0,
    holiday: 0,
    totalQuestions: totalQuestionCount
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
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
  
  return (
    <div className="game_theme">
      
      <div className="page page--wide">
        <header className="page__header">
          <p className="eyebrow">Control Center</p>
          <h2>Welcome back, Host</h2>
          <p>Review high-level activity before launching your next Family Feud session.</p>
          <img src={logo} alt="Family Feud Logo" className='page__logo' />
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
          title="Active Sessions"
          description="Monitor lobbies and live games."
          actions={sessions.length === 0 ? null : <button type="button" className='primary-button' onClick={() => navigate('/sessions')}>Create Session</button>}
        >
          {
            sessions.length === 0 ? (
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
                {
                  loading ? <div className="loading-message">Loading sessions...</div>
                  : sessions.map((session) => (
                    <div key={session.id} className="table-placeholder__row">
                      <span>{session.id}</span>
                      <span>{session.status}</span>
                      <span>{session.questionSetId || 'None'}</span>
                      <span>{session.teams?.map((team) => team.name).join(' vs ') || 'None'}</span>
                      <span>{session.updatedAt ? new Date(session.updatedAt).toLocaleTimeString() : 'Never'}</span>
                      <span>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => navigate(`/join/${session.id}`)}
                        >
                          Open
                        </button>
                      </span>
                    </div>
                  ))
                }
              </div>
            )
          }
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
