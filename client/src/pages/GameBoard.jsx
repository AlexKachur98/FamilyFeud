/**
 * @file GameBoard.jsx
 * @author Alex Kachur
 * @since 2025-11-11
 * @purpose Interactive Family Feud board prototype that now delegates game logic to the gameplay engine.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { io } from 'socket.io-client';

import { useAuth } from '../components/auth/AuthContext.js';
import useGameBoardEngine from '../gameplay/useGameBoardEngine.js';

import { PRIMARY_NAV_LINKS } from '../utils/navigation.js';
import { sessions } from '../utils/api.js';
import {
  ANSWER_CARD_ASSET,
  ANSWERING_PHASES,
  DISPLAY_ORDER,
  EMPTY_CARD_ASSET,
  HIDDEN_CARD_ASSETS,
  PLAYER_PLACEHOLDERS,
  QUESTION_CARD_ASSET,
  TIMER_CARD_ASSET,
} from '../gameplay/gameBoardConstants.js';
import AdminDrawer from '../components/AdminDrawer.jsx';
import { apiFetch } from '../utils/api.js';

const SERVER_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_SERVER_URL || '')
  : (import.meta.env.VITE_LOCAL_URL || 'http://localhost:3000');

const flattenPlayers = (session) => {
  if (session?.teams?.length) {
    return session.teams.flatMap((team, idx) =>
      (team.players || []).map((p, i) => ({
        label: team.name || `Team ${idx + 1}`,
        playerName: p.name || `Player ${i + 1}`,
        avatar: PLAYER_PLACEHOLDERS[0].avatar,
        scoreCard: PLAYER_PLACEHOLDERS[0].scoreCard,
        teamId: team.id,
        playerId: p.id
      }))
    );
  }
  return [];
};

const buildSessionState = (session, players) => {
  if (!session) return null;
    // Map team scores to player slots; fallback to zeroes.
    const scores = players.map((p, idx) => {
      const teamId = p.teamId;
    const team = (session.teams || []).find((t) => t.id === teamId) || session.teams?.[idx];
    return team?.score ?? 0;
  });
  // Choose strikes for active control team if present; fallback to max strikes.
  const controlTeam = session.controlTeamId
    ? (session.teams || []).find((t) => t.id === session.controlTeamId)
    : null;
  const strikes = controlTeam?.strikes ?? Math.max(0, ...(session.teams || []).map((t) => t.strikes || 0));
    const controlIndex = session.controlTeamId
      ? players.findIndex((p) => p.teamId === session.controlTeamId)
      : null;
    const activePlayerIndex = session.activePlayerId
      ? players.findIndex((p) => p.playerId === session.activePlayerId)
      : null;
    return { scores, strikes, controlIndex, activePlayerIndex, revealedAnswers: session.revealedAnswers || [] };
  };

const deriveAnnouncement = (session) => {
  if (!session) return '';
  const findTeamName = (teamId) =>
    (session.teams || []).find((t) => t.id === teamId)?.name || 'Team';
  const findPlayerTeam = (playerId) =>
    (session.teams || []).find((t) => (t.players || []).some((p) => p.id === playerId));
  if (session.activePlayerId && !session.controlTeamId) {
    const team = findPlayerTeam(session.activePlayerId);
    return `${team?.name || 'Team'} buzzed first—answer now!`;
  }
  if (session.controlTeamId) {
    return `${findTeamName(session.controlTeamId)} controls the board.`;
  }
  return '';
};


export default function GameBoard() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || 'demo-room-id';
  const { user } = useAuth();
  const isActualAdmin = Boolean(user?.admin);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

  const [session, setSession] = useState(null);
  const [initialRound, setInitialRound] = useState(null);
  const [lastQuestionId, setLastQuestionId] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loadStatus, setLoadStatus] = useState({ state: 'loading', message: '' });
  const [socketStatus, setSocketStatus] = useState('connected');
  const [actionStatus, setActionStatus] = useState({ state: 'idle', message: '' });
  const [announcement, setAnnouncement] = useState('');

  const websocketRef = useRef(null);
  const [endStatus, setEndStatus] = useState({ state: 'idle', message: '' });

  const players = useMemo(() => {
    if (session?.teams?.length) {
      const flattened = session.teams.flatMap((team, idx) =>
        (team.players || []).map((p, i) => ({
          label: team.name || `Team ${idx + 1}`,
          playerName: p.name || `Player ${i + 1}`,
          avatar: PLAYER_PLACEHOLDERS[0].avatar,
          scoreCard: PLAYER_PLACEHOLDERS[0].scoreCard,
          teamId: team.id,
          playerId: p.id
        }))
      );
      if (flattened.length) return flattened;
    }
    if (!user) return PLAYER_PLACEHOLDERS;
    return [
      {
        ...PLAYER_PLACEHOLDERS[0],
        playerName: user.username || PLAYER_PLACEHOLDERS[0].playerName,
        avatar: PLAYER_PLACEHOLDERS[0].avatar,
        playerId: user._id,
        teamId: 'host-team'
      },
      ...PLAYER_PLACEHOLDERS.slice(1),
    ];
  }, [session, user]);

  const timerOverrides = useMemo(() => {
    const s = session?.settings || {};
    const map = {};
    if (s.timerFaceoffBuzz) map.faceoffBuzz = Number(s.timerFaceoffBuzz);
    if (s.timerFaceoffAnswer) map.faceoffAnswer = Number(s.timerFaceoffAnswer);
    if (s.timerPlayGuess) map.playGuess = Number(s.timerPlayGuess);
    if (s.timerSteal) map.steal = Number(s.timerSteal);
    return Object.values(map).length ? map : null;
  }, [session?.settings]);
  const timersEnabled = session?.settings?.useTimers !== false;

  const playersWithIds = players;

  useEffect(() => {
    const loadSession = async () => {
      setLoadStatus({ state: 'loading', message: 'Loading session…' });
      try {
        const res = await sessions.get(sessionId);
        if (res.status === 401 || res.status === 403) {
          navigate('/signin');
          return;
        }
        if (!res.ok) throw new Error('Failed to load session');
        const data = await res.json();
        setSession(data);
        const derivedState = buildSessionState(data, flattenPlayers(data));
        setSessionState(derivedState);
        setAnnouncement(deriveAnnouncement(data));
        if (data.currentQuestionId && data.currentQuestionText) {
          setInitialRound({
            _id: data.currentQuestionId,
            question: data.currentQuestionText,
            size: data.currentQuestionSize
          });
          setLastQuestionId(data.currentQuestionId);
        }
        setLoadStatus({ state: 'idle', message: '' });
      } catch (err) {
        console.error('Failed to load session', err);
        setSession(null);
        setLoadStatus({ state: 'error', message: err.message });
      }
    };
    if (sessionId) loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, players.length]);

  useEffect(() => {
    const socket = io(SERVER_URL);
    websocketRef.current = socket;
    setConnectedUsers([]);

    socket.on('connect_error', () => setSocketStatus('disconnected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on('connect', () => setSocketStatus('connected'));

    socket.on('connect', () => {
      console.log('Connected to WebSocket server with ID:', socket.id);
    });

    socket.on('session:state', async (payload) => {
      if (payload?.deleted) {
        navigate('/dashboard');
        return;
      }
      setSession(payload);
      const derivedState = buildSessionState(payload, flattenPlayers(payload));
      setSessionState(derivedState);
      setAnnouncement(deriveAnnouncement(payload));
      if (
        payload?.currentQuestionId &&
        payload.currentQuestionText &&
        payload.currentQuestionId !== lastQuestionId
      ) {
        setInitialRound({
          _id: payload.currentQuestionId,
          question: payload.currentQuestionText,
          size: payload.currentQuestionSize
        });
        setLastQuestionId(payload.currentQuestionId);
      }
    });

    if (user) {
      socket.emit('joinRoom', sessionId, user, (res, resUser) => {
        console.log(res);
        setConnectedUsers((prevUsers) => ([...prevUsers, resUser]));
      });
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      websocketRef.current = null;
    };
  }, [user?._id, sessionId]);

  // Above is for Websocket testing purposes only.

  const {
    currentRound,
    roundStatus,
    gridAnswers,
    revealedAnswers,
    phase,
    activePlayerIndex,
    controlPlayer,
    roundPot,
    strikes,
    scores,
    guess,
    feedback,
    roundResult,
    timerLabel,
    timerDisplay,
    timerIsCritical,
    activeInstruction,
    formPlaceholder,
    showPlayOrPassActions,
    showRoundAdvanceAction,
    roundOverlayAsset,
    isCheckingAnswer,
    inputRef,
    setGuess,
    handleGuessSubmit,
    handleControlChoice,
    advanceRound,
    reloadRound,
  } = useGameBoardEngine(playersWithIds, initialRound, sessionState, {
    getTeamIdForPlayer: (idx) => playersWithIds[idx]?.teamId,
    getPlayerIdForIndex: (idx) => playersWithIds[idx]?.playerId,
    disableAutoLoad: Boolean(sessionId),
    timerOverrides,
    timersEnabled,
    onAction: (payload) => {
      if (!websocketRef.current) return;
      const { type, action, ...rest } = payload || {};
      const actionName = action || type;
      if (!actionName) return;
      const actionBody = {
        sessionId,
        actorId: user?._id,
        action: actionName,
        ...rest
      };
      websocketRef.current.emit('session:action', actionBody, (response) => {
        if (!response?.ok) {
          setActionStatus({ state: 'error', message: response?.error || 'Action failed' });
        }
      });
    }
  });

  const myPlayerIndex = useMemo(
    () => playersWithIds.findIndex((p) => p.playerId === user?._id),
    [playersWithIds, user?._id]
  );
  const isMyActiveId = session?.activePlayerId && user?._id
    ? session.activePlayerId === user._id
    : false;
  const sessionActiveIndex = session?.activePlayerId
    ? playersWithIds.findIndex((p) => p.playerId === session.activePlayerId)
    : null;
  const sessionControlIndex = session?.controlTeamId
    ? playersWithIds.findIndex((p) => p.teamId === session.controlTeamId)
    : null;
  const displayActiveIndex =
    typeof sessionActiveIndex === 'number' && sessionActiveIndex >= 0
      ? sessionActiveIndex
      : (typeof sessionState?.activePlayerIndex === 'number' ? sessionState.activePlayerIndex : activePlayerIndex);
  const displayControlIndex =
    typeof sessionControlIndex === 'number' && sessionControlIndex >= 0
      ? sessionControlIndex
      : (typeof sessionState?.controlIndex === 'number' ? sessionState.controlIndex : controlPlayer);
  const isMyControl =
    typeof displayControlIndex === 'number' && displayControlIndex === myPlayerIndex;
  const normalizedActiveIndex =
    typeof displayActiveIndex === 'number' && displayActiveIndex >= 0 ? displayActiveIndex : null;
  const isMyTurn =
    normalizedActiveIndex !== null
      ? normalizedActiveIndex === myPlayerIndex || isMyActiveId
      : activePlayerIndex === myPlayerIndex || isMyActiveId;
  const canSubmit =
    ANSWERING_PHASES.has(phase) &&
    roundStatus.state === 'idle' &&
    !isCheckingAnswer &&
    socketStatus === 'connected' &&
    (myPlayerIndex === -1 || isMyTurn);

  const emitAction = (payload) => {
    if (!websocketRef.current) return;
    const { type, action, ...rest } = payload || {};
    const actionName = action || type;
    if (!actionName) return;
    websocketRef.current.emit('session:action', {
      sessionId,
      actorId: user?._id,
      action: actionName,
      ...rest
    }, (response) => {
      if (!response?.ok) {
        setActionStatus({ state: 'error', message: response?.error || 'Action failed' });
      }
    });
  };

  const handleAdvanceRound = () => {
    if (session) {
      const nextRoundType = String((session?.currentRound || 0) + 1);
      emitAction({ type: 'startRound', roundType: nextRoundType });
    } else {
      advanceRound();
    }
  };

  const handleRestartSession = () => {
    if (!sessionId || !websocketRef.current) return;
    if (!window.confirm('Restart the game? This will reset scores/strikes and reload Round 1 for everyone.')) return;
    emitAction({ type: 'startRound', roundType: '1' });
  };

  const handleSubmitGuess = (event) => {
    if (!canSubmit) {
      event.preventDefault();
      return;
    }
    handleGuessSubmit(event);
  };
  const [statusDismissed, setStatusDismissed] = useState(false);
  const strikesDisplay = useMemo(
    () => Array.from({ length: 3 }, (_, index) => <span key={index} className={index < strikes ? 'is-hit' : ''}>X</span>),
    [strikes]
  );
  // Prefer backend prompt text, but fall back to status to keep the UI informative.
  const questionText = useMemo(
    () => currentRound?.question ?? (roundStatus.state === 'loading'
      ? roundStatus.message || 'Loading question…'
      : roundStatus.message || 'Question unavailable'
    ),
    [currentRound, roundStatus]
  );
  const roundLabel = currentRound?.label ?? 'Round';
  const roundMultiplier = currentRound?.multiplier ?? 1;


  useEffect(() => {
    if (roundStatus.state !== 'error') setStatusDismissed(false);
  }, [roundStatus.state]);

  return (
    <div className="landing-basic game-board">
      <header className="landing-basic__chrome">
        <button
          type="button"
          className="landing-basic__menu"
          aria-label="End session"
          onClick={async () => {
            if (!sessionId || endStatus.state === 'loading') return;
            if (!window.confirm('End and delete this session?')) return;
            setEndStatus({ state: 'loading', message: 'Ending session…' });
            try {
              const res = await apiFetch(`/gamesession/${sessionId}`, { method: 'DELETE' });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to end session');
              }
              navigate('/dashboard');
            } catch (err) {
              setEndStatus({ state: 'error', message: err.message });
            } finally {
              setEndStatus({ state: 'idle', message: '' });
            }
          }}
          style={{ background: 'rgba(255,0,0,0.15)', borderColor: 'rgba(255,0,0,0.5)' }}
        >
          ⏻
        </button>
        <button
          type="button"
          className="landing-basic__menu"
          aria-label="Restart session"
          onClick={handleRestartSession}
          style={{ background: 'rgba(255,255,0,0.15)', borderColor: 'rgba(200,200,0,0.5)' }}
        >
          ⟳
        </button>
        <span className={`socket-status socket-status--${socketStatus}`}>
          {socketStatus === 'connected' ? 'Socket OK' : 'Socket Disconnected'}
        </span>
        {announcement ? (
          <span className="socket-status socket-status--info" style={{ marginLeft: '8px' }}>
            {announcement}
          </span>
        ) : null}
      </header>
      {loadStatus.state === 'error' ? (
        <div className="game-board-round-error" aria-live="assertive">
          <p>{loadStatus.message || 'Unable to load session.'}</p>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : null}
      {actionStatus.state === 'error' ? (
        <div className="game-board-action-error" aria-live="assertive">
          <p>{actionStatus.message}</p>
          <button type="button" onClick={() => setActionStatus({ state: 'idle', message: '' })}>Dismiss</button>
        </div>
      ) : null}
      {isActualAdmin ? (
        <AdminDrawer
          open={menuOpen}
          onToggle={toggleMenu}
          links={[
            ...PRIMARY_NAV_LINKS,
            { path: '/question-sets', label: 'Question Sets' },
            { path: '/session-create', label: 'Create Session' }
          ]}
        />
      ) : null}

      <main className="landing-basic__body game-board__body">

        <div className="game-board-roster" aria-label="Players">
          <h2>Players</h2>
          <ul>
            {(session?.teams || []).flatMap((team) => team.players || []).map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>

        <div className="game-board__stage">
          <img
            src="/Gameboard_Backround.jpg"
            alt="Family Feud stage backdrop"
            className="game-board__bg"
            // loading="lazy"
          />

          {phase === 'intro' && roundStatus.state === 'idle' ? (
            <div className="game-board-round-intro" aria-label="Round intro">
              <div className="game-board-round-intro__logo">
                <img src={roundOverlayAsset} alt="Round splash" />
                <span>{roundLabel}</span>
              </div>
            </div>
          ) : null}

          {roundStatus.state === 'loading' ? (
            <div className="game-board-round-status" aria-live="polite">
              <p>{roundStatus.message || 'Loading question…'}</p>
            </div>
          ) : null}

          {roundStatus.state === 'error' && !statusDismissed ? (
            <div className="game-board-round-error" aria-live="assertive">
              <p>{roundStatus.message || 'Unable to load question.'}</p>
              <button type="button" onClick={reloadRound}>
                Retry Question
              </button>
              <button type="button" onClick={() => setStatusDismissed(true)}>
                Dismiss
              </button>
            </div>
          ) : null}

          {roundStatus.state === 'idle' && phase === 'faceoffBuzz' ? (
            <div className="game-board-question-overlay" aria-live="polite">
              <div
                className="game-board-question-overlay__card"
                style={{ backgroundImage: `url(${QUESTION_CARD_ASSET})` }}
              >
                <p>{questionText}</p>
              </div>
              <span>Buzz with spacebar</span>
            </div>
          ) : null}

          <div className="game-board__content">
            <div
              className="game-board-question"
              aria-label="Question plaque"
              style={{ backgroundImage: `url(${QUESTION_CARD_ASSET})` }}
            >
              <p className="game-board-question__text">{questionText}</p>
            </div>

            <div className="game-board-info-row">
              <div className="game-board-round-meta">
                <div className="game-board-round-meta__item">{roundLabel}</div>
                <div className="game-board-round-meta__item">
                  Pot: {roundPot} pts · x{roundMultiplier}
                </div>
              </div>

              <div
                className={`game-board-timer${timerIsCritical ? ' game-board-timer--critical' : ''}`}
                aria-label="Timer plaque"
                style={{ backgroundImage: `url(${TIMER_CARD_ASSET})` }}
              >
                <span className="game-board-timer__label">{timerLabel}</span>
                <span className="game-board-timer__value">{timerDisplay}</span>
              </div>

              <div className="game-board-round-meta game-board-round-meta--right">
                <div className="game-board-round-meta__item game-board-strikes">
                  Strikes: {strikesDisplay}
                </div>
                {controlPlayer !== null ? (
                  <div className="game-board-round-meta__item game-board-control-tag">
                    Control:{' '}
                    {players[controlPlayer]?.label ?? PLAYER_PLACEHOLDERS[controlPlayer]?.label ?? 'Team'}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="game-board-board">
              {/* Grid renders in broadcast order so assets line up with the TV layout. */}
              <section className="game-board-grid" aria-label="Answer card placeholders">
                {DISPLAY_ORDER.map((slotIndex) => {
                  const slot = gridAnswers[slotIndex];
                  const slotState = revealedAnswers[slotIndex];
                  let cardAsset = EMPTY_CARD_ASSET;
                  if (slot) {
                    cardAsset =
                      slotState === true
                        ? ANSWER_CARD_ASSET
                        : HIDDEN_CARD_ASSETS[slotIndex] ?? EMPTY_CARD_ASSET;
                  }
                  const revealed = slot && slotState === true;
                  return (
                    <div
                      key={slotIndex}
                      className={`game-board-grid__slot${revealed ? ' game-board-grid__slot--revealed' : ''}${slotState === 'empty' ? ' game-board-grid__slot--empty' : ''
                        }`}
                      style={{ backgroundImage: `url(${cardAsset})` }}
                    >
                      {revealed ? (
                        <div className="game-board-grid__slot-text">
                          <span className="game-board-grid__slot-rank">{slot.rank}</span>
                          <span className="game-board-grid__slot-answer">{slot.answer}</span>
                          <span className="game-board-grid__slot-points">{slot.points ?? 0}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </section>

              <div className="game-board-sides" aria-label="Player placeholders">
                {players.map((player, index) => {
                  const isActive = index === displayActiveIndex;
                  const hasControl = displayControlIndex === index;
                  const showPlayControlsForPlayer = showPlayOrPassActions && hasControl;
                  const winnerIndex = roundResult?.winnerIndex;
                  const showAdvanceForPlayer =
                    showRoundAdvanceAction &&
                    (winnerIndex === index || (winnerIndex === null || winnerIndex === undefined ? hasControl : false));

                  return (
                    <div
                      className={`game-board-player${isActive ? ' game-board-player--active' : ''}`}
                      key={player.label}
                    >
                      <p className="game-board-player__team">{player.label}</p>
                      <p className="game-board-player__name">{player.playerName}</p>
                      <div className="game-board-player__avatar" style={{ backgroundImage: `url(${player.avatar})` }} />
                      <div className="game-board-player__score" style={{ backgroundImage: `url(${player.scoreCard})` }}>
                        <span>{String(scores[index]).padStart(3, '0')}</span>
                      </div>
                      {showPlayControlsForPlayer ? (
                        <div className="game-board-player__actions">
                          <button type="button" onClick={() => handleControlChoice('play')} disabled={!isMyControl}>
                            Play it
                          </button>
                          <button type="button" onClick={() => handleControlChoice('pass')} disabled={!isMyControl}>
                            Pass it
                          </button>
                        </div>
                      ) : null}
                      {showAdvanceForPlayer ? (
                        <div className="game-board-player__actions">
                          <button type="button" onClick={handleAdvanceRound}>
                            {phase === 'gameComplete' ? 'Restart game' : 'Next round'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

              <div className="game-board-console" aria-live="polite">
                <div className="game-board-input" aria-label="Answer input placeholder">
                <form className="game-board-answer-form" onSubmit={handleSubmitGuess}>
                  <label className="sr-only" htmlFor="gameboard-guess">
                    Enter guess
                  </label>
                  <input
                    id="gameboard-guess"
                    ref={inputRef}
                    type="text"
                    value={guess}
                    onChange={(event) => setGuess(event.target.value)}
                    placeholder={formPlaceholder}
                    disabled={!canSubmit}
                  />
                  <button
                    type="submit"
                    disabled={!canSubmit}
                  >
                    Lock In
                  </button>
                  {!isMyTurn && myPlayerIndex !== -1 ? (
                    <p className="form-status">Waiting for your turn…</p>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};
