import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { apiFetch } from '../api/api.js';

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionSets, setQuestionSets] = useState([]);

  // Fetch sessions and question sets
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch question sets for reference (non-critical)
        try {
          const setsResponse = await apiFetch('/question-sets', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (setsResponse.ok) {
            const setsData = await setsResponse.json();
            setQuestionSets(setsData);
          } else {
            console.warn('Question sets fetch warning:', await setsResponse.text());
          }
        } catch (setsErr) {
          console.error('Question sets fetch error:', setsErr);
          // Continue without question sets
        }

        // Fetch sessions (non-critical)
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
          // Continue with empty sessions
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        // Only log unexpected errors, don't show to user
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAction = async (sessionId, action) => {
    try {
      const response = await apiFetch(`/gamesession/${sessionId}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${action}`);
      }

      const updatedSession = await response.json();
      setSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? updatedSession : session))
      );
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const getQuestionSetTitle = (setId) => {
    if (!setId) return 'None';
    const foundSet = questionSets.find(set => set._id === setId);
    return foundSet ? foundSet.title : 'Unknown Set';
  };

  if (loading) {
    return (
      <div className="game_theme" style={{ minHeight: '100vh' }}>
        <div className="page page--stacked">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="game_theme">
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Live Control</p>
        <h2>Sessions</h2>
        <p>Oversee lobbies, launch rounds, and keep scores synchronized.</p>
      </header>

      <PageSection
        title="Session Lobby"
        description="Use this control panel to advance rounds and manage teams."
        actions={<button type="button" onClick={() => navigate('/sessions/create')}>Create New Session</button>}
      >
        {sessions && Array.isArray(sessions) ? (
          <div className="sessions-grid">
            {sessions.map((session) => {
              const questionSetTitle = getQuestionSetTitle(session.questionSetId);

              return (
                <article key={session.id} className="session-card">
                  <header className="session-card__header">
                    <div>
                      <p className="session-card__code">Code: {session.accessCode}</p>
                      <h3>{questionSetTitle}</h3>
                    </div>
                    <span className={`session-card__status status-${session.status}`}>
                      {session.status}
                    </span>
                  </header>

                  <dl className="session-card__meta">
                    <div>
                      <dt>Round</dt>
                      <dd>{session.currentRound !== undefined ? session.currentRound + 1 : 'Not started'}</dd>
                    </div>
                    <div>
                      <dt>Teams</dt>
                      <dd>
                        {session.teams && session.teams.length > 0
                          ? session.teams.map((team) => `${team.name} (${team.score || 0})`).join(' vs ')
                          : 'No teams'}
                      </dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>
                        {session.updatedAt
                          ? new Date(session.updatedAt).toLocaleString()
                          : 'Never'}
                      </dd>
                    </div>
                  </dl>

                  <div className="session-card__actions">
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => handleAction(session.id, 'reveal-answer')}
                    >
                      Reveal Answer
                    </button>
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => handleAction(session.id, 'add-strike')}
                    >
                      Add Strike
                    </button>
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => handleAction(session.id, 'award-points')}
                    >
                      Award Points
                    </button>
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => handleAction(session.id, 'end-round')}
                    >
                      End Round
                    </button>
                    <button
                      type="button"
                      className="action-button view-button"
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No active sessions found.</p>
            <p>Create a new session to start a game.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/sessions/create')}
            >
              Create New Session
            </button>
          </div>
        )}
      </PageSection>

      <PageSection
        title="Session Utilities"
        description="Tools for moderators and scorekeepers."
      >
        <div className="action-grid">
          <button type="button" onClick={() => navigate('/sessions/create')}>Generate New Access Code</button>
          <button type="button" onClick={() => navigate('/sessions/logs')}>Download Session Log</button>
          <button type="button" onClick={() => navigate('/sessions/archive')}>Archive Session</button>
        </div>
      </PageSection>
    </div>
    </div>
  );
}
