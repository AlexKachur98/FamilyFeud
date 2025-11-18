import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { apiFetch } from '../utils/api.js';
import { useAuth } from '../components/auth/AuthContext.js';
import { useMemo } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [questionSets, setQuestionSets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [stats, setStats] = useState({
    totalSets: 0,
    doubleTriple: 0,
    fastMoneyTagged: 0,
    totalQuestions: 0
  });
  const [setsError, setSetsError] = useState(false);
  const [questionsError, setQuestionsError] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const setsResponse = await apiFetch('/question-sets', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (setsResponse.ok) {
          const setsData = await setsResponse.json();
          setQuestionSets(setsData);
          setSetsError(false);
        } else {
          console.warn('Question sets fetch warning:', await setsResponse.text());
          setSetsError(true);
        }
      } catch (err) {
        console.error('Question sets fetch error:', err);
        setSetsError(true);
      } finally {
        setLoadingSets(false);
      }
    };

    const fetchSessions = async () => {
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
      } catch (err) {
        console.error('Sessions fetch error:', err);
      } finally {
        setLoadingSessions(false);
      }
    };

    const fetchStats = async () => {
      try {
        let setsData = [];
        let questionsData = [];

        try {
          const setsResponse = await apiFetch('/question-sets', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          if (setsResponse.ok) {
            setsData = await setsResponse.json();
          } else {
            setSetsError(true);
          }
        } catch (err) {
          setSetsError(true);
        }

        try {
          const questionsResponse = await apiFetch('/question/all', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          if (questionsResponse.ok) {
            questionsData = await questionsResponse.json();
          } else {
            setQuestionsError(true);
          }
        } catch (err) {
          setQuestionsError(true);
        }

        const setsArr = setsData.length ? setsData : questionSets;
        const questionsArr = questionsData.length ? questionsData : questions;

        setStats({
          totalSets: setsArr.length,
          doubleTriple: questionsArr.filter(q => (q.answers?.length ?? 0) >= 7).length,
          fastMoneyTagged: questionsArr.filter(q => {
            const len = q.answers?.length ?? 0;
            return len > 0 && len <= 4;
          }).length,
          totalQuestions: questionsArr.length
        });
      } catch (err) {
        console.error('Unexpected error calculating stats:', err);
        setFetchError('An unexpected error occurred. Please try again.');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchSets();
    fetchSessions();
    fetchStats();
  }, []);

  const renderStat = (value, isError) => isError ? 'ERROR' : value;

  return (
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Game Overview</p>
        <h2>Family Feud Dashboard</h2>
        <p>View custom survey content and live session activity.</p>
      </header>

      {fetchError && (
        <div className="global-error">
          <p>{fetchError}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <PageSection
        title="Content Overview"
        description="Track custom question sets and round mix."
      >
        {statsLoading ? (
          <div className="loading-message">Loading content overview…</div>
        ) : (
          <div className="grid grid--stats">
            <article>
              <p>Total Custom Sets</p>
              <strong>{renderStat(stats.totalSets, setsError)}</strong>
            </article>
            <article>
              <p>Double/Triple Rounds</p>
              <strong>{renderStat(stats.doubleTriple, questionsError)}</strong>
            </article>
            <article>
              <p>Fast Money Questions</p>
              <strong>{renderStat(stats.fastMoneyTagged, questionsError)}</strong>
            </article>
            <article>
              <p>Total Questions</p>
              <strong>{renderStat(stats.totalQuestions, questionsError)}</strong>
            </article>
          </div>
        )}
      </PageSection>

      <PageSection
        title="Active Sessions"
        description="Monitor lobbies and live games."
        actions={(
          <>
            <button type="button" onClick={() => navigate('/session-create')}>Create Session</button>
            <button type="button" aria-label="Refresh sessions" className="link-button" onClick={() => window.location.reload()}>
              ⟳
            </button>
          </>
        )}
      >
        {loadingSessions ? (
          <div className="loading-message">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <p>No active sessions.</p>
            <p>Create a new session to start a game.</p>
          </div>
        ) : (
          <>
            <div className="table-placeholder">
              <div className="table-placeholder__row table-placeholder__row--head">
                <span>Session</span>
                <span>Status</span>
                <span>Question Set</span>
                <span>Teams</span>
                <span>Updated</span>
                <span>Actions</span>
              </div>
              {sessions.map((session) => (
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
                      onClick={() => {
                        if (!session.accessCode) {
                          setJoinError('');
                          navigate(`/lobby/${session.id}`);
                          return;
                        }
                        const code = window.prompt('Enter access code to join this session:');
                        if (!code) return;
                        if (code.trim() === session.accessCode) {
                          setJoinError('');
                          navigate(`/lobby/${session.id}`);
                        } else {
                          setJoinError('Invalid access code.');
                        }
                      }}
                    >
                      Join
                    </button>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        if (session.status === 'lobby') {
                          navigate(`/lobby/${session.id}`);
                        } else {
                          navigate(`/game-board?sessionId=${session.id}`);
                        }
                      }}
                    >
                      Manage
                    </button>
                  </span>
                </div>
              ))}
            </div>
            {joinError ? <p className="form-status form-status--error">{joinError}</p> : null}
          </>
        )}
      </PageSection>

      <PageSection
        title="Custom Question Sets"
        description="Build and curate your own Feud-style surveys with prompts, answers, and point values."
        actions={<button type="button" onClick={() => navigate('/question-sets')}>Create New Set</button>}
      >
        {loadingSets ? (
          <div className="loading-message">Loading question sets…</div>
        ) : questionSets.length === 0 ? (
          <div className="empty-state">
            <p>No question sets found.</p>
            <p>Create your first question set to organize your game content.</p>
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
  );
}
