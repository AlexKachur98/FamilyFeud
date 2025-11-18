/**
 * @file Lobby.jsx
 * @purpose Host-ready lobby so teams can name themselves, ready up, and launch the game.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { apiFetch, sessions } from '../utils/api.js';
import { useAuth } from '../components/auth/AuthContext.js';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_SERVER_URL || '')
  : (import.meta.env.VITE_LOCAL_URL || 'http://localhost:3000');

export default function Lobby() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [loading, setLoading] = useState(true);
  const [teamEdits, setTeamEdits] = useState({});
  const [joinMessage, setJoinMessage] = useState('');
  const socketRef = useRef(null);

  const loadSession = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/gamesession/${sessionId}`, { method: 'GET' });
      if (res.status === 401 || res.status === 403) {
        navigate('/signin');
        return;
      }
      if (!res.ok) throw new Error('Failed to load session');
      const data = await res.json();
      setSession(data);
      // auto-join first team if not present
      if (user?._id && !(data.teams || []).some((t) => (t.players || []).some((p) => p.id === user._id))) {
        const joinRes = await sessions.join(sessionId, { name: user.username });
        if (joinRes.ok) {
          const joined = await joinRes.json();
          setSession(joined);
        }
      }
      setTeamEdits(
        (data.teams || []).reduce((acc, team) => {
          acc[team.id] = team.name || '';
          return acc;
        }, {})
      );
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Subscribe to session updates via socket to auto-navigate when game starts
  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    const performJoin = () => {
      if (user) {
        socket.emit('joinRoom', sessionId, user, (msg) => {
          if (msg && typeof msg === 'string' && msg.toLowerCase().includes('unauthorized')) {
            setStatus({ state: 'error', message: msg });
          }
        });
      }
    };
    performJoin();

    socket.on('connect', performJoin);

    const handleSessionUpdate = async (payload) => {
      setSession(payload);
      setTeamEdits(
        (payload?.teams || []).reduce((acc, team) => {
          acc[team.id] = team.name || '';
          return acc;
        }, {})
      );
      if (payload?.status === 'in_progress') {
        navigate(`/game-board?sessionId=${sessionId}`);
      }
    };

    const fetchAndSet = async () => {
      try {
        const res = await apiFetch(`/gamesession/${sessionId}`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          await handleSessionUpdate(data);
        }
      } catch (err) {
        // ignore
      }
    };

    socket.on('session:state', handleSessionUpdate);
    socket.on('userJoined', fetchAndSet);
    socket.on('userLeft', fetchAndSet);
    socket.on('connect_error', () => {
      setStatus({ state: 'error', message: 'Socket connection failed. Retrying…' });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [navigate, sessionId, user?._id]);

  const updateTeam = async (teamId, payload) => {
    try {
      const res = await apiFetch(`/gamesession/${sessionId}/team/${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update team');
      const data = await res.json();
      setSession(data);
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  const toggleReady = (teamId, ready) => updateTeam(teamId, { ready });

  const renameTeam = async (teamId) => {
    const name = teamEdits[teamId] ?? '';
    await updateTeam(teamId, { name });
  };

  const togglePlayerReady = async (playerId, ready) => {
    try {
      const res = await apiFetch(`/gamesession/${sessionId}/player/${playerId}/ready`, {
        method: 'PUT',
        body: JSON.stringify({ ready })
      });
      if (!res.ok) throw new Error('Failed to update ready state');
      const data = await res.json();
      setSession(data);
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  const startGame = async () => {
    if (!session) return;
    setStatus({ state: 'loading', message: 'Starting game…' });
    try {
      const res = await sessions.start(sessionId, '1');
      if (!res.ok) throw new Error('Failed to start game');
      navigate(`/game-board?sessionId=${sessionId}`);
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    } finally {
      setStatus({ state: 'idle', message: '' });
    }
  };

  const cancelSession = async () => {
    if (!window.confirm('Cancel and delete this session?')) return;
    setStatus({ state: 'loading', message: 'Canceling…' });
    try {
      const res = await apiFetch(`/gamesession/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel session');
      navigate('/dashboard');
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    } finally {
      setStatus({ state: 'idle', message: '' });
    }
  };

  const allPlayersReady = session?.teams?.flatMap((t) => t.players || []).length > 0
    && session.teams.flatMap((t) => t.players || []).every((p) => p.ready);
  const allReady = allPlayersReady;

  const currentTeamId = useMemo(() => {
    if (!user?._id || !session?.teams) return null;
    const team = session.teams.find((t) => (t.players || []).some((p) => p.id === user._id));
    return team?.id ?? null;
  }, [session, user]);

  const joinTeam = async (teamId) => {
    try {
      const res = await sessions.join(sessionId, { name: user?.username, teamId });
      if (!res.ok) throw new Error('Failed to join team');
      const data = await res.json();
      setSession(data);
      setJoinMessage(`Joined ${teamId}`);
      socketRef.current?.emit('joinRoom', sessionId, user, () => {});
    } catch (err) {
      setJoinMessage(err.message);
    }
  };

  const leaveParty = async () => {
    try {
      const res = await apiFetch(`/gamesession/${sessionId}/player-leave`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to leave session');
      const data = await res.json();
      setSession(data);
      setJoinMessage('You left the session.');
      navigate('/dashboard');
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  useEffect(() => {
    if (allReady && status.state === 'idle' && session?.hostUserId === user?._id) {
      startGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReady, session?.hostUserId, user?._id]);

  if (loading) {
    return <div className="page page--stacked"><div className="loading-message">Loading lobby…</div></div>;
  }

  if (!session) {
    return <div className="page page--stacked"><div className="error-message">Session not found.</div></div>;
  }

  return (
    <div className="page page--stacked lobby">
      <header className="page__header lobby__hero">
        <div>
          <p className="eyebrow">Session Lobby</p>
          <h2>Ready up teams</h2>
          <p>Session ID: {session.id}</p>
        </div>
        <div className="lobby__pill">
          Access Code <strong>{session.accessCode}</strong>
        </div>
      </header>

      {status.state === 'error' ? (
        <div className="error-message">{status.message}</div>
      ) : null}

      <div className="lobby-grid">
        <PageSection title="Teams" description="Name teams and ready up.">
        <div className="table-placeholder">
            <div className="lobby-teams__head">
              <span>Team</span>
              <span>Players</span>
              <span>Ready</span>
            </div>
            {(session.teams || []).map((team) => (
              <div key={team.id} className="lobby-teams__row">
                <div className="lobby-teams__team">
                  <input
                    type="text"
                    value={teamEdits[team.id] ?? team.name}
                    onChange={(e) => setTeamEdits((prev) => ({ ...prev, [team.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        renameTeam(team.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="lobby__save-btn"
                    onClick={() => renameTeam(team.id)}
                    aria-label="Save team name"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="link-button"
                    disabled={currentTeamId === team.id}
                    onClick={() => joinTeam(team.id)}
                  >
                    {currentTeamId === team.id ? 'You are here' : 'Join team'}
                  </button>
                </div>
                <div className="lobby-teams__players">
                  {(team.players || []).map((p) => (
                    <span key={p.id} className="lobby__player-name">
                      {p.name}
                  </span>
                ))}
              </div>
              <div className="lobby-teams__ready">
                {(team.players || []).map((p) => {
                  const canToggle = user?._id && (user._id === p.id);
                  return (
                    <label key={p.id} className="lobby__ready-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(p.ready)}
                        disabled={!canToggle}
                        onChange={(e) => togglePlayerReady(p.id, e.target.checked)}
                      />
                      <span className={p.ready ? 'ready' : 'not-ready'}>
                        {p.ready ? 'Ready' : 'Waiting'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PageSection>

        <div className="lobby__sidebar">
          <PageSection title="Game Settings" description="Snapshot of session settings.">
            <pre className="lobby__settings">
              {JSON.stringify(session.settings || {}, null, 2)}
            </pre>
          </PageSection>

          <PageSection title="Start" description="Launch when everyone is ready.">
            <button type="button" onClick={startGame} disabled={!allReady || status.state === 'loading'}>
              {status.state === 'loading' ? 'Starting…' : allReady ? 'Start Game' : 'Waiting for ready'}
            </button>
            <button type="button" className="link-button link-button--destructive" onClick={cancelSession} disabled={status.state === 'loading'}>
              Cancel Session
            </button>
            <button type="button" className="link-button" onClick={leaveParty} disabled={status.state === 'loading'}>
              Leave Session
            </button>
            {joinMessage ? (
              <p className="form-status" role="status">{joinMessage}</p>
            ) : null}
          </PageSection>
        </div>
      </div>
    </div>
  );
}
