/**
 * @file useGameBoardEngine.js
 * @author Alex Kachur
 * @since 2025-11-13
 * @purpose Encapsulates Family Feud board state transitions, timers, backend calls, and handlers for reuse.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ai, questions } from '../utils/api.js';

import {
  ANSWERING_PHASES,
  PLAYER_PLACEHOLDERS,
  ROUND_THEMES,
  SLOT_COUNT,
  TIMER_CONFIG,
  TIMER_LABELS,
  getRoundBucket,
} from './gameBoardConstants.js';
import { getOpponentIndex, isSpaceKey, normalize } from './gameBoardUtils.js';


const TOTAL_ROUNDS = ROUND_THEMES.length || 1;

// Pre-allocates placeholder slots so the board art can render before answers land.
const buildEmptySlots = (size) => {
  const clampedSize = Math.max(0, Math.min(size ?? SLOT_COUNT, SLOT_COUNT));
  return Array.from({ length: SLOT_COUNT }, (_, index) =>
    index < clampedSize
      ? { rank: index + 1, answer: null, points: null }
      : null
  );
};

// Re-arm timer if a request fails so the host flow keeps moving.
const restartTimerForPhase = (phase, startTimer, handleMissRef, finalizeRound, controlPlayer, timerConfig) => {
  if (phase === 'playing') {
    startTimer('playGuess', timerConfig.playGuess, () => handleMissRef.current?.('timeout'));
  } else if (phase === 'steal') {
    startTimer('steal', timerConfig.steal, () => finalizeRound(controlPlayer ?? 0, 'Steal attempt expired.'));
  } else if (phase === 'faceoffAnswer' || phase === 'faceoffChallenger') {
    startTimer('faceoffAnswer', timerConfig.faceoffAnswer, () => handleMissRef.current?.('timeout'));
  }
};

// Normalizes API responses and surfaces backend error messages.
const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data;
};

export default function useGameBoardEngine(players = PLAYER_PLACEHOLDERS, initialRoundData = null, sessionState = null, options = {}) {
  const {
    onAction,
    getTeamIdForPlayer,
    disableAutoLoad = false,
    timerOverrides = null,
    getPlayerIdForIndex,
    timersEnabled = true
  } = options;
  const timerConfig = useMemo(
    () => ({ ...TIMER_CONFIG, ...(timerOverrides || {}) }),
    [timerOverrides]
  );
  const playerCount = players.length || PLAYER_PLACEHOLDERS.length;
  // Round scaffolding & revealed answers are hydrated as soon as the backend responds.
  const [roundIndex, setRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(null);
  const [gridAnswers, setGridAnswers] = useState(() => buildEmptySlots(SLOT_COUNT));
  const [revealedAnswers, setRevealedAnswers] = useState(() =>
    Array(SLOT_COUNT).fill('empty'),
  );
  const [phase, setPhase] = useState('loading');
  const [roundStatus, setRoundStatus] = useState({ state: 'loading', message: 'Loading question…' });
  const [activePlayerIndex, setActivePlayerIndex] = useState(null);
  const [controlPlayer, setControlPlayer] = useState(null);
  const [buzzWinner, setBuzzWinner] = useState(null);
  const [faceoffLeader, setFaceoffLeader] = useState(null);
  const [roundPot, setRoundPot] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [scores, setScores] = useState(() => Array(playerCount).fill(0));
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [roundResult, setRoundResult] = useState(null);

  const getPlayerLabel = useCallback((playerIndex) => {
    return players[playerIndex]?.label ?? PLAYER_PLACEHOLDERS[playerIndex]?.label ?? 'Player';
  }, [players]);

  // Returns the next player index within the same team, cycling to the first teammate.
  const getNextPlayerIndexWithinTeam = useCallback((playerIndex) => {
    if (playerIndex === null || playerIndex === undefined) return playerIndex ?? 0;
    const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(playerIndex) : players[playerIndex]?.teamId;
    if (!teamId) return playerIndex;
    const teammates = players
      .map((p, idx) => ({ idx, teamId: getTeamIdForPlayer ? getTeamIdForPlayer(idx) : p?.teamId }))
      .filter((entry) => entry.teamId === teamId)
      .map((entry) => entry.idx);
    if (!teammates.length) return playerIndex;
    const pos = teammates.indexOf(playerIndex);
    const nextPos = pos === -1 ? 0 : (pos + 1) % teammates.length;
    return teammates[nextPos];
  }, [getTeamIdForPlayer, players]);

  const rotateActivePlayer = useCallback((currentIndex) => {
    const nextIndex = getNextPlayerIndexWithinTeam(currentIndex);
    setActivePlayerIndex(nextIndex);
    const nextPlayerId = getPlayerIdForIndex ? getPlayerIdForIndex(nextIndex) : null;
    if (nextPlayerId) onAction?.({ action: 'setActivePlayer', playerId: nextPlayerId });
  }, [getNextPlayerIndexWithinTeam, getPlayerIdForIndex, onAction]);


  useEffect(() => {
    setScores((prev) => {
      if (prev.length === playerCount) return prev;
      return Array(playerCount).fill(0);
    });
  }, [playerCount]);


  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const inputRef = useRef(null);
  const faceoffCycleRef = useRef(0);
  const handleMissRef = useRef(() => { });
  const [timerState, setTimerState] = useState({ mode: null, remainingMs: 0 });
  const timerDeadlineRef = useRef(null);
  const timerCallbackRef = useRef(null);

  // Shared countdown runner keeps the classic Family Feud pacing.
  const stopTimer = useCallback(() => {
    timerDeadlineRef.current = null;
    timerCallbackRef.current = null;
    setTimerState({ mode: null, remainingMs: 0 });
  }, []);

  const startTimer = useCallback((mode, seconds, onExpire) => {
    if (!timersEnabled) {
      // Timers disabled via settings; do not start countdowns.
      setTimerState({ mode: null, remainingMs: 0 });
      return;
    }
    const durationMs = seconds * 1000;
    const graceMs = timerConfig.countdownGrace * 1000;
    timerDeadlineRef.current = performance.now() + durationMs + graceMs;
    timerCallbackRef.current = onExpire;
    setTimerState({ mode, remainingMs: durationMs + graceMs });
  }, [timerConfig.countdownGrace, timersEnabled]);

  // Interval loop updates the timer HUD without piling on re-renders.
  useEffect(() => {
    if (!timerState.mode || !timerDeadlineRef.current) return;
    const tick = () => {
      const remainingMs = timerDeadlineRef.current - performance.now();
      // Only update if the display value changes
      const secondsRemaining = Math.max(0, Math.ceil(Math.max(0, remainingMs - graceMs) / 1000));
      if (secondsRemaining !== timerSecondsRemaining) {
        setTimerState((prev) => (prev.mode ? { ...prev, remainingMs } : prev));
      }
      if (remainingMs <= 0) {
        const callback = timerCallbackRef.current;
        stopTimer();
        callback?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000); // Update every second, not every 150ms
    return () => clearInterval(id);
  }, [timerState.mode, stopTimer]);

  // Resets all per-round state while keeping the cumulative scoreboard intact.
  const resetRoundState = useCallback(
    (slots) => {
      setGridAnswers(slots);
      setRevealedAnswers(slots.map((slot) => (slot ? false : 'empty')));
      setRoundPot(0);
      setStrikes(0);
      setControlPlayer(null);
      setBuzzWinner(null);
      setFaceoffLeader(null);
      setRoundResult(null);
      setFeedback('');
      setGuess('');
      setPhase('intro');
      stopTimer();
    },
    [players, stopTimer]
  );

  const hydrateRound = useCallback((payload) => {
    if (!payload) return;
    const size = Math.max(0, Math.min(payload?.size ?? payload?.answers?.length ?? SLOT_COUNT, SLOT_COUNT));
    const slots = buildEmptySlots(size);
    const theme = ROUND_THEMES[roundIndex % TOTAL_ROUNDS] ?? ROUND_THEMES[0] ?? {};
    setCurrentRound({
      questionId: payload?._id,
      question: payload?.question ?? 'Question unavailable',
      size,
      overlayAsset: theme.overlayAsset ?? '/Round_One.png',
      label: theme.label ?? `Round ${roundIndex + 1}`,
      multiplier: theme.multiplier ?? 1
    });
    resetRoundState(slots);
    setRoundStatus({ state: 'idle', message: '' });
  }, [resetRoundState, roundIndex]);

  // Pulls a random question from the backend and seeds the board placeholders.
  const loadRound = useCallback(async () => {
    setRoundStatus({ state: 'loading', message: 'Loading question…' });
    setPhase('loading');
    try {
      const bucket = getRoundBucket(roundIndex);
      const requestOptions = bucket
        ? {
          ...(bucket.minAnswers ? { minAnswers: bucket.minAnswers } : {}),
          ...(bucket.maxAnswers ? { maxAnswers: bucket.maxAnswers } : {})
        }
        : {};

      const response = await questions.getRandom(requestOptions);
      const payload = await parseResponse(response);
      hydrateRound(payload);
    } catch (error) {
      setRoundStatus({ state: 'error', message: error.message || 'Unable to load question' });
      setFeedback(error.message || 'Unable to load question.');
      setPhase('error');
    }
  }, [hydrateRound, roundIndex]);

  // Initial mount + round changes should hydrate a fresh question immediately.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isMounted) return;
      if (initialRoundData) {
        hydrateRound(initialRoundData);
        return;
      }
      if (disableAutoLoad) return;
      await loadRound();
    })();
    return () => {
      isMounted = false;
    };
  }, [disableAutoLoad, hydrateRound, initialRoundData, loadRound]);

  // Sync external session scores/strikes/reveals if provided
  useEffect(() => {
    if (!sessionState) return;
    if (Array.isArray(sessionState.scores)) {
      setScores(sessionState.scores);
    }
    if (typeof sessionState.strikes === 'number') {
      setStrikes(sessionState.strikes);
    }
    if (typeof sessionState.controlIndex === 'number') {
      setControlPlayer(sessionState.controlIndex);
    }
    if (typeof sessionState.activePlayerIndex === 'number') {
      setActivePlayerIndex(sessionState.activePlayerIndex);
    }
    if (Array.isArray(sessionState.revealedAnswers)) {
      const revealedFlags = sessionState.revealedAnswers.map((entry) => !!entry?.revealed);
      setRevealedAnswers(revealedFlags);
      setGridAnswers((prev) => {
        const updated = [...prev];
        sessionState.revealedAnswers.forEach((entry) => {
          if (entry && entry.revealed) {
            updated[entry.index] = {
              rank: (entry.index ?? 0) + 1,
              answer: entry.answer,
              points: entry.points
            };
          }
        });
        return updated;
      });
    }
  }, [sessionState]);

  // Faceoff entry point: clears voices, spins up the buzzer timer, and alternates teams.
  const enterFaceoffBuzz = useCallback(() => {
    if (roundStatus.state !== 'idle') return;
    stopTimer();
    setPhase('faceoffBuzz');
    setGuess('');
    setFeedback('');
    setActivePlayerIndex(null);
    setBuzzWinner(null);
    setFaceoffLeader(null);
    faceoffCycleRef.current = 0;
    startTimer('faceoffBuzz', timerConfig.faceoffBuzz, () => {
      setFeedback('No buzz detected. Host repeats the question.');
      enterFaceoffBuzz();
    });
  }, [roundStatus.state, startTimer, stopTimer]);

  useEffect(() => {
    if (phase !== 'intro') return undefined;
    const introTimer = setTimeout(() => setPhase('faceoffBuzz'), 2000);
    return () => clearTimeout(introTimer);
  }, [phase]);

  // Awards the accumulated pot and advances to summary/game complete states.
  const finalizeRound = useCallback(
    (winnerIndex, note) => {
      stopTimer();

      if (winnerIndex !== null && winnerIndex !== undefined) {
        setScores((prev) => {
          const updated = [...prev];
          updated[winnerIndex] += roundPot;
          return updated;
        });
        const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(winnerIndex) : null;
        onAction?.({ action: 'awardPoints', teamId, points: roundPot });
      }

      setRoundResult({ winnerIndex, points: roundPot, note });
      setPhase(roundIndex < TOTAL_ROUNDS - 1 ? 'roundSummary' : 'gameComplete');
      setFeedback(note ?? '');
    },
    [getTeamIdForPlayer, onAction, roundIndex, roundPot, stopTimer]
  );

  // Central strike/timeout handler so every phase reacts consistently to misses.
  const handleMiss = useCallback((reason) => {
    stopTimer();
    if (phase === 'faceoffAnswer') {
      const challenger = getOpponentIndex(buzzWinner ?? 0, playerCount);
      setFeedback(
        reason === 'timeout'
          ? 'Time expired! Opponent gets a shot.'
          : 'Not on the board. Opponent gets a shot.'
      );
      setPhase('faceoffChallenger');
      setActivePlayerIndex(challenger);
      startTimer('faceoffAnswer', timerConfig.faceoffAnswer, () => handleMissRef.current?.('timeout'));
      return;
    }
    if (phase === 'faceoffChallenger') {
      setFeedback(
        reason === 'timeout'
          ? 'Challenger ran out of time. Restarting the face-off.'
          : 'Still nothing. Resetting the face-off.'
      );
      enterFaceoffBuzz();
      return;
    }
    if (phase === 'playing') {
      const currentPlayer = activePlayerIndex ?? controlPlayer ?? 0;
      let nextStrikes = 0;
      setStrikes((prev) => {
        nextStrikes = prev + 1;
        const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(controlPlayer ?? activePlayerIndex ?? 0) : null;
        onAction?.({ action: 'strike', teamId });
        return nextStrikes;
      });
      if (nextStrikes >= 3) {
        const stealPlayer = getOpponentIndex(controlPlayer ?? 0, playerCount);
        setFeedback(
          reason === 'timeout'
            ? 'Too slow—three strikes! Opponent can steal.'
            : 'Three strikes! Opponent can steal.'
        );
        setPhase('steal');
        setActivePlayerIndex(stealPlayer);
        startTimer('steal', timerConfig.steal, () =>
          finalizeRound(controlPlayer ?? 0, 'Steal attempt expired.')
        );
      } else {
        setFeedback(
          reason === 'timeout'
            ? `Strike ${nextStrikes}! Timer ran out—still your board.`
            : `Strike ${nextStrikes}! Still your board.`
        );
        rotateActivePlayer(currentPlayer);
        startTimer('playGuess', timerConfig.playGuess, () => handleMissRef.current?.('timeout'));
      }
      return;
    }
    if (phase === 'steal') {
      setFeedback(
        reason === 'timeout'
          ? 'Steal timer expired. Control keeps the pot.'
          : 'Steal missed. Control keeps the pot.'
      );
      const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(controlPlayer ?? activePlayerIndex ?? 0) : null;
      onAction?.({ action: 'strike', teamId });
      finalizeRound(controlPlayer ?? 0, 'Defended the board.');
    }
  },
    [buzzWinner, controlPlayer, enterFaceoffBuzz, finalizeRound, getTeamIdForPlayer, onAction, phase, playerCount, startTimer, stopTimer]
  );

  handleMissRef.current = handleMiss;

  const finalizeFaceoffControl = useCallback(
    (playerIndex, note) => {
      stopTimer();
      setControlPlayer(playerIndex);
      setActivePlayerIndex(playerIndex);
      const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(playerIndex) : null;
      const playerId = getPlayerIdForIndex ? getPlayerIdForIndex(playerIndex) : null;
      if (teamId) onAction?.({ action: 'setControl', teamId });
      if (playerId) onAction?.({ action: 'setActivePlayer', playerId });
      setPhase('playOrPass');
      const label = players[playerIndex]?.label ?? PLAYER_PLACEHOLDERS[playerIndex]?.label ?? 'Team';
      setFeedback(
        `${label} controls the board${note ? ` – ${note}` : ''}. Choose play or pass.`,
      );
      setFaceoffLeader(null);
    },
    [getPlayerIdForIndex, getTeamIdForPlayer, onAction, players, stopTimer],
  );

  // Applies a successful reveal to the grid and routes faceoff/steal logic.
  const handleCorrectAnswer = useCallback(
    (matchIndex, slotOverride) => {
      const slot = slotOverride ?? gridAnswers[matchIndex];
      if (!slot) {
        handleMiss('invalid');
        return;
      }
      if (revealedAnswers[matchIndex] !== false) {
        handleMiss('duplicate');
        return;
      }

      const slotPoints = (slot.points ?? 0) * (currentRound?.multiplier ?? 1);
      const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(controlPlayer ?? activePlayerIndex ?? 0) : null;
      setRevealedAnswers((prev) => {
        const updated = [...prev];
        updated[matchIndex] = true;
        return updated;
      });
      onAction?.({
        action: 'revealAnswer',
        index: matchIndex,
        teamId,
        points: slotPoints,
        answer: slot.answer
      });
      setRoundPot((value) => value + slotPoints);

      if (phase === 'faceoffAnswer') {
        if (slot.rank === 1) {
          finalizeFaceoffControl(activePlayerIndex ?? 0, 'Hit the #1 answer');
        } else {
          setFaceoffLeader({ playerIndex: activePlayerIndex ?? 0, rank: slot.rank });
          const challenger = getOpponentIndex(activePlayerIndex ?? 0, playerCount);
          setActivePlayerIndex(challenger);
          const challengerId = getPlayerIdForIndex ? getPlayerIdForIndex(challenger) : null;
          if (challengerId) onAction?.({ action: 'setActivePlayer', playerId: challengerId });
          setPhase('faceoffChallenger');
          const challengerLabel =
            players[challenger]?.label ?? PLAYER_PLACEHOLDERS[challenger]?.label ?? 'Opponent';
          setFeedback(`${challengerLabel} must beat rank #${slot.rank} to take control.`);
          startTimer('faceoffAnswer', timerConfig.faceoffAnswer, () => handleMissRef.current?.('timeout'));
        }
        return;
      }

      if (phase === 'faceoffChallenger') {
        if (!faceoffLeader) {
          finalizeFaceoffControl(activePlayerIndex ?? 0, 'Opponent missed the board.');
          return;
        }
        const challengerRank = slot.rank;
        const winner =
          challengerRank < faceoffLeader.rank ? activePlayerIndex ?? 0 : faceoffLeader.playerIndex;
        const reason =
          challengerRank < faceoffLeader.rank ? 'Higher-ranked face-off answer.' : 'Face-off leader held control.';
        finalizeFaceoffControl(winner, reason);
        return;
      }

      if (phase === 'playing') {
        const hasHiddenCards = revealedAnswers.some((value, index) => index !== matchIndex && value === false);
        if (!hasHiddenCards) {
          finalizeRound(controlPlayer ?? activePlayerIndex ?? 0, 'Cleared the board!');
        } else {
          setFeedback('Correct! Keep going.');
          const currentPlayer = activePlayerIndex ?? controlPlayer ?? 0;
          rotateActivePlayer(currentPlayer);
          startTimer('playGuess', timerConfig.playGuess, () => handleMissRef.current?.('timeout'));
        }
        return;
      }

      if (phase === 'steal') {
        const stealer = activePlayerIndex ?? 0;
        const stealerLabel =
          players[stealer]?.label ?? PLAYER_PLACEHOLDERS[stealer]?.label ?? 'Challenger';
        finalizeRound(stealer, `${stealerLabel} stole the round!`);
      }
    },
    [
      activePlayerIndex,
      controlPlayer,
      currentRound?.multiplier,
      faceoffLeader,
      finalizeFaceoffControl,
      finalizeRound,
      gridAnswers,
      handleMiss,
      phase,
      playerCount,
      players,
      revealedAnswers,
      startTimer
    ]
  );

  const beginPlaying = useCallback((playerIndex) => {
    stopTimer();
    setPhase('playing');
    setActivePlayerIndex(playerIndex);
    const playerId = getPlayerIdForIndex ? getPlayerIdForIndex(playerIndex) : null;
    if (playerId) onAction?.({ action: 'setActivePlayer', playerId });
    const label = players[playerIndex]?.label ?? PLAYER_PLACEHOLDERS[playerIndex]?.label ?? 'Team';
    setFeedback(`${label} is playing the board.`);
    startTimer('playGuess', timerConfig.playGuess, () => handleMissRef.current?.('timeout'));
  },
    [getPlayerIdForIndex, onAction, players, startTimer, stopTimer]
  );

  const handleControlChoice = useCallback((choice) => {
    const owner = controlPlayer ?? 0;
    const target = choice === 'play' ? owner : getOpponentIndex(owner, playerCount);
    setControlPlayer(target);
    const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(target) : null;
    if (teamId) onAction?.({ action: 'setControl', teamId });
    beginPlaying(target);
  },
    [beginPlaying, controlPlayer, getTeamIdForPlayer, onAction, playerCount]
  );

  // Sends the contestant guess to the AI endpoint, then hydrates the returned slot.
  const handleGuessSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!ANSWERING_PHASES.has(phase)) return;
    if (roundStatus.state !== 'idle' || isCheckingAnswer) return;
    const cleaned = normalize(guess);
    if (!cleaned || !currentRound?.questionId) return;
    const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(controlPlayer ?? activePlayerIndex ?? 0) : null;
    onAction?.({ action: 'submitGuess', guess: cleaned, teamId });
    stopTimer();
    setIsCheckingAnswer(true);
    try {
      const response = await ai.submitAnswer(currentRound.questionId, cleaned);
      const payload = await parseResponse(response);
      const slotIndex = typeof payload?.index === 'number' ? payload.index : -1;
      if (slotIndex < 0 || slotIndex >= (currentRound?.size ?? SLOT_COUNT)) {
        setFeedback('No match. That counts as a strike.');
        handleMiss('no-match');
        setGuess('');
        return;
      }
      if (revealedAnswers[slotIndex] === true) {
        setFeedback('That answer is already revealed.');
        handleMiss('duplicate');
        setGuess('');
        return;
      }
      const slotData = {
        rank: slotIndex + 1,
        answer: payload?.answer ?? 'Revealed answer',
        points: Number(payload?.points) || 0
      };
      setGridAnswers((prev) => {
        const updated = [...prev];
        updated[slotIndex] = { ...(updated[slotIndex] ?? { rank: slotIndex + 1 }), ...slotData };
        return updated;
      });
      handleCorrectAnswer(slotIndex, slotData);
    } catch (error) {
      setFeedback(error.message || 'Unable to verify the answer. Try again.');
      restartTimerForPhase(phase, startTimer, handleMissRef, finalizeRound, controlPlayer, timerConfig);
    } finally {
      setIsCheckingAnswer(false);
      setGuess('');
    }
  },
    [
      controlPlayer,
      currentRound,
      finalizeRound,
      guess,
      handleCorrectAnswer,
      handleMiss,
      isCheckingAnswer,
      phase,
      revealedAnswers,
      roundStatus.state,
      getTeamIdForPlayer,
      startTimer,
      stopTimer
    ]
  );

  // Simulates a buzz-in event; the alternating index keeps the prototype fair without sockets.
  const handleBuzz = useCallback((force = false) => {
    if (roundStatus.state !== 'idle') return;
    if (!force && phase !== 'faceoffBuzz') return;
    const playerIndex = playerCount ? faceoffCycleRef.current % playerCount : 0;
    faceoffCycleRef.current += 1;
    const teamId = getTeamIdForPlayer ? getTeamIdForPlayer(playerIndex) : null;
    onAction?.({ action: 'buzz', teamId });
    stopTimer();
    setBuzzWinner(playerIndex);
    setActivePlayerIndex(playerIndex);
    setPhase('faceoffAnswer');
    const label = players[playerIndex]?.label ?? PLAYER_PLACEHOLDERS[playerIndex]?.label ?? 'Team';
    setFeedback(`${label} buzzed first—answer now!`);
    setGuess('');
    startTimer('faceoffAnswer', timerConfig.faceoffAnswer, () => handleMissRef.current?.('timeout'));
  },
    [getTeamIdForPlayer, onAction, phase, playerCount, players, roundStatus.state, startTimer, stopTimer]
  );

  // If a remote buzz/control update comes in, make sure all clients advance to faceoff answer state.
  useEffect(() => {
    const activeFromSession = sessionState?.activePlayerIndex;
    if (activeFromSession === null || activeFromSession === undefined) return;
    const hasControl = typeof sessionState?.controlIndex === 'number';

    // No control decided yet: we are in the faceoff flow.
    if (!hasControl) {
      if (phase !== 'faceoffAnswer' && phase !== 'faceoffChallenger') {
        setActivePlayerIndex(activeFromSession);
        setPhase('faceoffAnswer');
        setFeedback(`${getPlayerLabel(activeFromSession)} buzzed first—answer now!`);
        startTimer('faceoffAnswer', timerConfig.faceoffAnswer, () => handleMissRef.current?.('timeout'));
      } else if (phase === 'faceoffAnswer' && activePlayerIndex !== activeFromSession) {
        setActivePlayerIndex(activeFromSession);
        setPhase('faceoffChallenger');
        setFeedback(`${getPlayerLabel(activeFromSession)} can beat the last answer to take control.`);
        startTimer('faceoffAnswer', timerConfig.faceoffAnswer, () => handleMissRef.current?.('timeout'));
      }
      return;
    }

    // Control determined remotely: align to play/pass state.
    if (hasControl && (phase === 'faceoffAnswer' || phase === 'faceoffChallenger')) {
      setActivePlayerIndex(sessionState.controlIndex);
      setPhase('playOrPass');
      stopTimer();
      setFeedback(`${getPlayerLabel(sessionState.controlIndex ?? 0)} controls the board. Choose play or pass.`);
    }
  }, [activePlayerIndex, getPlayerLabel, phase, sessionState?.activePlayerIndex, sessionState?.controlIndex, startTimer, stopTimer, timerConfig.faceoffAnswer]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isSpaceKey(event)) return;
      if (phase === 'faceoffBuzz') {
        event.preventDefault();
        handleBuzz();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enterFaceoffBuzz, handleBuzz, phase]);

  useEffect(() => {
    if (ANSWERING_PHASES.has(phase)) {
      inputRef.current?.focus();
    }
  }, [phase]);

  // Moves to the next question (or resets to round one) and triggers another fetch.
  const advanceRound = useCallback(() => {
    setRoundStatus({ state: 'loading', message: 'Loading question…' });
    setPhase('loading');
    setRoundIndex((value) => {
      if (value < TOTAL_ROUNDS - 1) {
        return value + 1;
      }
      setScores(Array(playerCount).fill(0));
      return 0;
    });
  }, [playerCount]);

  const graceMs = timerConfig.countdownGrace * 1000;
  const timerSecondsRemaining = timerState.mode
    ? Math.max(0, Math.ceil(Math.max(0, timerState.remainingMs - graceMs) / 1000))
    : null;
  const timerDisplay = timerSecondsRemaining ?? '–';
  const timerIsCritical = timerState.mode && (timerSecondsRemaining ?? 0) <= 3;
  const timerLabel = timersEnabled
    ? (timerState.mode ? TIMER_LABELS[timerState.mode] : 'Timer')
    : 'Timer off';
  const instructionFallback =
    {
      faceoffBuzz: 'Buzz in with the spacebar.',
      playOrPass: 'Choose to play the board or pass control.',
      steal: 'One guess to steal the board.',
      playing: 'Guess one answer at a time. Three strikes ends the turn.',
      loading: roundStatus.message || 'Loading question…',
      error: roundStatus.message || 'Unable to load question.'
    }[phase] ?? '';
  const activeInstruction =
    (activePlayerIndex === null && feedback) || instructionFallback || 'Ready for the next cue.';
  const formPlaceholder =
    {
      faceoffAnswer: 'Face-off guess',
      faceoffChallenger: 'Challenge guess',
      playing: 'Enter board answer',
      steal: 'Steal guess'
    }[phase] ?? 'Input disabled';
  const roundComplete = phase === 'roundSummary' || phase === 'gameComplete';
  const showPlayOrPassActions = phase === 'playOrPass';
  const showRoundAdvanceAction = roundComplete;
  const roundTheme = ROUND_THEMES[roundIndex % TOTAL_ROUNDS] ?? ROUND_THEMES[0];
  const roundOverlayAsset = currentRound?.overlayAsset ?? roundTheme?.overlayAsset ?? '/Round_One.png';

  return useMemo(() => ({
    // data
    currentRound,
    roundIndex,
    gridAnswers,
    revealedAnswers,
    phase,
    roundStatus,
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
    // refs
    inputRef,
    // handlers
    setGuess,
    handleGuessSubmit,
    handleControlChoice,
    advanceRound,
    reloadRound: loadRound
  }), [
    currentRound,
    roundIndex,
    gridAnswers,
    revealedAnswers,
    phase,
    roundStatus,
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
    // refs
    inputRef,
    // handlers
    setGuess,
    handleGuessSubmit,
    handleControlChoice,
    advanceRound,
    loadRound
  ]);
};
