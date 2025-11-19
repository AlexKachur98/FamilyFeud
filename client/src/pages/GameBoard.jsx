/**
 * @file GameBoard.jsx
 * @author Alex Kachur
 * @since 2025-11-11
 * @purpose Interactive Family Feud board prototype that now delegates game logic to the gameplay engine.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { io } from 'socket.io-client';

import { useAuth } from '../components/auth/AuthContext.js';
import useGameBoardEngine from '../gameplay/useGameBoardEngine.js';

import { PRIMARY_NAV_LINKS } from '../utils/navigation.js';
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

const SERVER_URL = import.meta.env.PROD ? (import.meta.env.VITE_SERVER_URL || '') : (import.meta.env.VITE_LOCAL_URL || '');


export default function GameBoard() {

  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

  // WebSocket instance
  // TODO: 
  const roomId = "demo-room-id"; // Replace with actual room ID

  const [connectedUsers, setConnectedUsers] = useState({});

  let websocket;

  useEffect(() => {
    websocket = io(SERVER_URL);

    websocket.on('connect', () => {
      console.log('Connected to WebSocket server with ID:', websocket.id);
    });

    if (user) websocket.emit('joinRoom', roomId, user, (res, resUser) => {
      console.log(res);
      setConnectedUsers((prevUsers) => ({ ...prevUsers, [resUser._id]: resUser }));
    });
  }, []);

  // Above is for Websocket testing purposes only.

  const players = useMemo(() => {
    if (!user) return PLAYER_PLACEHOLDERS;
    // TODO: Replace default avatar with user-provided image when backend exposes it.
    return [
      {
        ...PLAYER_PLACEHOLDERS[0],
        playerName: user.username || PLAYER_PLACEHOLDERS[0].playerName,
        avatar: PLAYER_PLACEHOLDERS[0].avatar,
      },
      ...PLAYER_PLACEHOLDERS.slice(1),
    ];
  }, [user]);

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
  } = useGameBoardEngine(players);
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
          aria-label="Open navigation"
          aria-controls="gameboard-drawer"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <main className="landing-basic__body game-board__body">

        {/* This is for websocket testing purposes only. */}
        <div style={{ backgroundColor: 'black', padding: '15px', color: 'white', position: 'absolute', top: '10px', right: '10px', zIndex: 1000, fontSize: '12px' }}>
          <h2>Connected Users</h2>
          <ul>
            {Object.values(connectedUsers).map((connUser) => (
              <li key={connUser._id}>{connUser.username} (ID: {connUser._id})</li>
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

          {roundStatus.state === 'idle' && (phase === 'questionZoom' || phase === 'faceoffBuzz') ? (
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
                  const isActive = index === activePlayerIndex;
                  const hasControl = controlPlayer === index;
                  const showPlayControlsForPlayer = showPlayOrPassActions && hasControl;
                  const winnerIndex = roundResult?.winnerIndex;
                  const showAdvanceForPlayer =
                    showRoundAdvanceAction &&
                    (winnerIndex === index || (winnerIndex === null || winnerIndex === undefined ? hasControl : false));

                  let playerMessage = '\u00A0';
                  if (isActive && feedback) {
                    playerMessage = feedback;
                  } else if (!isActive && (phase === 'faceoffBuzz' || phase === 'questionZoom')) {
                    playerMessage = 'Buzz with spacebar';
                  } else if (showPlayControlsForPlayer) {
                    playerMessage = 'Choose play or pass';
                  } else if (showAdvanceForPlayer) {
                    playerMessage = phase === 'gameComplete' ? 'Restart the game' : 'Advance to next round';
                  } else if (isActive) {
                    playerMessage = activeInstruction;
                  }

                  return (
                    <div
                      className={`game-board-player${isActive ? ' game-board-player--active' : ''}`}
                      key={player.label}
                    >
                      <p className="game-board-player__team">{player.label}</p>
                      <p className="game-board-player__name">{player.playerName}</p>
                      <p className="game-board-player__status" aria-live={isActive ? 'polite' : undefined}>
                        {playerMessage}
                      </p>
                      <div className="game-board-player__avatar" style={{ backgroundImage: `url(${player.avatar})` }} />
                      <div className="game-board-player__score" style={{ backgroundImage: `url(${player.scoreCard})` }}>
                        <span>{String(scores[index]).padStart(3, '0')}</span>
                      </div>
                      {showPlayControlsForPlayer ? (
                        <div className="game-board-player__actions">
                          <button type="button" onClick={() => handleControlChoice('play')}>
                            Play it
                          </button>
                          <button type="button" onClick={() => handleControlChoice('pass')}>
                            Pass it
                          </button>
                        </div>
                      ) : null}
                      {showAdvanceForPlayer ? (
                        <div className="game-board-player__actions">
                          <button type="button" onClick={advanceRound}>
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
                <form className="game-board-answer-form" onSubmit={handleGuessSubmit}>
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
                    disabled={
                      !ANSWERING_PHASES.has(phase) || roundStatus.state !== 'idle' || isCheckingAnswer
                    }
                  />
                  <button
                    type="submit"
                    disabled={
                      !ANSWERING_PHASES.has(phase) || roundStatus.state !== 'idle' || isCheckingAnswer
                    }
                  >
                    Lock In
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {menuOpen ? (
        <button type="button" className="landing-basic__backdrop" aria-label="Close menu" onClick={closeMenu} />
      ) : null}
      <nav
        id="gameboard-drawer"
        className={`landing-basic__drawer${menuOpen ? ' landing-basic__drawer--open' : ''}`}
        inert={!menuOpen}
      >
        <button type="button" className="landing-basic__drawer-close" onClick={closeMenu} aria-label="Close menu">
          ×
        </button>
        <ul className="landing-basic__drawer-list">
          {PRIMARY_NAV_LINKS.map((link) => (
            <li key={link.path}>
              <Link to={link.path} onClick={closeMenu}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
