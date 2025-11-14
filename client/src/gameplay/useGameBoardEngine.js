/**
 * @file useGameBoardEngine.js
 * @author Alex Kachur
 * @since 2025-11-13
 * @purpose Encapsulates Family Feud board state transitions, timers, backend calls, and handlers for reuse.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { ai, questions } from '../utils/api.js';

const TOTAL_ROUNDS = ROUND_THEMES.length || 1;

// Pre-allocates placeholder slots so the board art can render before answers land.
const buildEmptySlots = (size) => {
  const clampedSize = Math.max(0, Math.min(size ?? SLOT_COUNT, SLOT_COUNT));
  return Array.from({ length: SLOT_COUNT }, (_, index) =>
    index < clampedSize
      ? { rank: index + 1, answer: null, points: null }
      : null,
  );
};

// Re-arm timer if a request fails so the host flow keeps moving.
const restartTimerForPhase = (phase, startTimer, handleMissRef, finalizeRound, controlPlayer) => {
  if (phase === 'playing') {
    startTimer('playGuess', TIMER_CONFIG.playGuess, () => handleMissRef.current?.('timeout'));
  } else if (phase === 'steal') {
    startTimer('steal', TIMER_CONFIG.steal, () => finalizeRound(controlPlayer ?? 0, 'Steal attempt expired.'));
  } else if (phase === 'faceoffAnswer' || phase === 'faceoffChallenger') {
    startTimer('faceoffAnswer', TIMER_CONFIG.faceoffAnswer, () => handleMissRef.current?.('timeout'));
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

export default function useGameBoardEngine(players = PLAYER_PLACEHOLDERS) {
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
  useEffect(() => {
    setScores((prev) => {
      if (prev.length === playerCount) return prev;
      return Array(playerCount).fill(0);
    });
  }, [playerCount]);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const inputRef = useRef(null);
  const faceoffCycleRef = useRef(0);
  const handleMissRef = useRef(() => {});
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
    const durationMs = seconds * 1000;
    const graceMs = TIMER_CONFIG.countdownGrace * 1000;
    timerDeadlineRef.current = performance.now() + durationMs + graceMs;
    timerCallbackRef.current = onExpire;
    setTimerState({ mode, remainingMs: durationMs + graceMs });
  }, []);

  // Interval loop updates the timer HUD without piling on re-renders.
  useEffect(() => {
    if (!timerState.mode || !timerDeadlineRef.current) return undefined;

    const tick = () => {
      if (!timerDeadlineRef.current) return;
      const remainingMs = timerDeadlineRef.current - performance.now();
      setTimerState((prev) => (prev.mode ? { ...prev, remainingMs } : prev));
      if (remainingMs <= 0) {
        const callback = timerCallbackRef.current;
        stopTimer();
        callback?.();
      }
    };

    tick();
    const id = setInterval(tick, 150);
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
    [players, stopTimer],
  );

  // Pulls a random question from the backend and seeds the board placeholders.
const loadRound = useCallback(async () => {
    setRoundStatus({ state: 'loading', message: 'Loading question…' });
    setPhase('loading');
    try {
      const bucket = getRoundBucket(roundIndex);
      const requestOptions = bucket
        ? {
            ...(bucket.minAnswers ? { minAnswers: bucket.minAnswers } : {}),
            ...(bucket.maxAnswers ? { maxAnswers: bucket.maxAnswers } : {}),
          }
        : {};

      const response = await questions.getRandom(requestOptions);
      const payload = await parseResponse(response);
      const size = Math.max(0, Math.min(payload?.size ?? payload?.answers?.length ?? SLOT_COUNT, SLOT_COUNT));
      const slots = buildEmptySlots(size);
      const theme = ROUND_THEMES[roundIndex % TOTAL_ROUNDS] ?? ROUND_THEMES[0] ?? {};
      setCurrentRound({
        questionId: payload?._id,
        question: payload?.question ?? 'Question unavailable',
        size,
        overlayAsset: theme.overlayAsset ?? '/Round_One.png',
        label: theme.label ?? `Round ${roundIndex + 1}`,
        multiplier: theme.multiplier ?? 1,
      });
      resetRoundState(slots);
      setRoundStatus({ state: 'idle', message: '' });
    } catch (error) {
      setRoundStatus({ state: 'error', message: error.message || 'Unable to load question' });
      setFeedback(error.message || 'Unable to load question.');
      setPhase('error');
    }
  }, [resetRoundState, roundIndex]);

  // Initial mount + round changes should hydrate a fresh question immediately.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isMounted) return;
      await loadRound();
    })();
    return () => {
      isMounted = false;
    };
  }, [loadRound]);

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
    startTimer('faceoffBuzz', TIMER_CONFIG.faceoffBuzz, () => {
      setFeedback('No buzz detected. Host repeats the question.');
      enterFaceoffBuzz();
    });
  }, [roundStatus.state, startTimer, stopTimer]);

  useEffect(() => {
    if (phase !== 'intro') return undefined;
    const introTimer = setTimeout(() => setPhase('questionZoom'), 2000);
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
      }
      setRoundResult({ winnerIndex, points: roundPot, note });
      setPhase(roundIndex < TOTAL_ROUNDS - 1 ? 'roundSummary' : 'gameComplete');
      setFeedback(note ?? '');
    },
    [roundIndex, roundPot, stopTimer],
  );

  // Central strike/timeout handler so every phase reacts consistently to misses.
  const handleMiss = useCallback(
    (reason) => {
      stopTimer();
      if (phase === 'faceoffAnswer') {
        const challenger = getOpponentIndex(buzzWinner ?? 0, playerCount);
        setFeedback(
          reason === 'timeout'
            ? 'Time expired! Opponent gets a shot.'
            : 'Not on the board. Opponent gets a shot.',
        );
        setPhase('faceoffChallenger');
        setActivePlayerIndex(challenger);
        startTimer('faceoffAnswer', TIMER_CONFIG.faceoffAnswer, () => handleMissRef.current?.('timeout'));
        return;
      }
      if (phase === 'faceoffChallenger') {
        setFeedback(
          reason === 'timeout'
            ? 'Challenger ran out of time. Restarting the face-off.'
            : 'Still nothing. Resetting the face-off.',
        );
        enterFaceoffBuzz();
        return;
      }
      if (phase === 'playing') {
        setStrikes((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            const stealPlayer = getOpponentIndex(controlPlayer ?? 0, playerCount);
            setFeedback(
              reason === 'timeout'
                ? 'Too slow—three strikes! Opponent can steal.'
                : 'Three strikes! Opponent can steal.',
            );
            setPhase('steal');
            setActivePlayerIndex(stealPlayer);
            startTimer('steal', TIMER_CONFIG.steal, () =>
              finalizeRound(controlPlayer ?? 0, 'Steal attempt expired.'),
            );
          } else {
            setFeedback(
              reason === 'timeout'
                ? `Strike ${next}! Timer ran out—still your board.`
                : `Strike ${next}! Still your board.`,
            );
            startTimer('playGuess', TIMER_CONFIG.playGuess, () => handleMissRef.current?.('timeout'));
          }
          return next;
        });
        return;
      }
      if (phase === 'steal') {
        setFeedback(
          reason === 'timeout'
            ? 'Steal timer expired. Control keeps the pot.'
            : 'Steal missed. Control keeps the pot.',
        );
        finalizeRound(controlPlayer ?? 0, 'Defended the board.');
      }
    },
    [buzzWinner, controlPlayer, enterFaceoffBuzz, finalizeRound, phase, playerCount, startTimer, stopTimer],
  );

  handleMissRef.current = handleMiss;

  const finalizeFaceoffControl = useCallback(
    (playerIndex, note) => {
      stopTimer();
      setControlPlayer(playerIndex);
      setActivePlayerIndex(playerIndex);
      setPhase('playOrPass');
      const label = players[playerIndex]?.label ?? PLAYER_PLACEHOLDERS[playerIndex]?.label ?? 'Team';
      setFeedback(
        `${label} controls the board${note ? ` – ${note}` : ''}. Choose play or pass.`,
      );
      setFaceoffLeader(null);
    },
    [stopTimer],
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

      setRevealedAnswers((prev) => {
        const updated = [...prev];
        updated[matchIndex] = true;
        return updated;
      });
      const slotPoints = (slot.points ?? 0) * (currentRound?.multiplier ?? 1);
      setRoundPot((value) => value + slotPoints);

      if (phase === 'faceoffAnswer') {
        if (slot.rank === 1) {
          finalizeFaceoffControl(activePlayerIndex ?? 0, 'Hit the #1 answer');
        } else {
          setFaceoffLeader({ playerIndex: activePlayerIndex ?? 0, rank: slot.rank });
          const challenger = getOpponentIndex(activePlayerIndex ?? 0, playerCount);
          setActivePlayerIndex(challenger);
          setPhase('faceoffChallenger');
          const challengerLabel =
            players[challenger]?.label ?? PLAYER_PLACEHOLDERS[challenger]?.label ?? 'Opponent';
          setFeedback(
            `${challengerLabel} must beat rank #${slot.rank} to take control.`,
          );
          startTimer('faceoffAnswer', TIMER_CONFIG.faceoffAnswer, () => handleMissRef.current?.('timeout'));
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
          startTimer('playGuess', TIMER_CONFIG.playGuess, () => handleMissRef.current?.('timeout'));
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
      startTimer,
    ],
  );

  const beginPlaying = useCallback(
    (playerIndex) => {
      stopTimer();
      setPhase('playing');
      setActivePlayerIndex(playerIndex);
      const label = players[playerIndex]?.label ?? PLAYER_PLACEHOLDERS[playerIndex]?.label ?? 'Team';
      setFeedback(`${label} is playing the board.`);
      startTimer('playGuess', TIMER_CONFIG.playGuess, () => handleMissRef.current?.('timeout'));
    },
    [players, startTimer, stopTimer],
  );

  const handleControlChoice = useCallback(
    (choice) => {
      const owner = controlPlayer ?? 0;
      const target = choice === 'play' ? owner : getOpponentIndex(owner, playerCount);
      setControlPlayer(target);
      beginPlaying(target);
    },
    [beginPlaying, controlPlayer, playerCount],
  );

  // Sends the contestant guess to the AI endpoint, then hydrates the returned slot.
  const handleGuessSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!ANSWERING_PHASES.has(phase)) return;
      if (roundStatus.state !== 'idle' || isCheckingAnswer) return;
      const cleaned = normalize(guess);
      if (!cleaned || !currentRound?.questionId) return;
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
          points: Number(payload?.points) || 0,
        };
        setGridAnswers((prev) => {
          const updated = [...prev];
          updated[slotIndex] = { ...(updated[slotIndex] ?? { rank: slotIndex + 1 }), ...slotData };
          return updated;
        });
        handleCorrectAnswer(slotIndex, slotData);
      } catch (error) {
        setFeedback(error.message || 'Unable to verify the answer. Try again.');
        restartTimerForPhase(phase, startTimer, handleMissRef, finalizeRound, controlPlayer);
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
      startTimer,
      stopTimer,
    ],
  );

  // Simulates a buzz-in event; the alternating index keeps the prototype fair without sockets.
  const handleBuzz = useCallback(
    (force = false) => {
      if (roundStatus.state !== 'idle') return;
      if (!force && phase !== 'faceoffBuzz') return;
      const playerIndex = playerCount ? faceoffCycleRef.current % playerCount : 0;
      faceoffCycleRef.current += 1;
      stopTimer();
      setBuzzWinner(playerIndex);
      setActivePlayerIndex(playerIndex);
      setPhase('faceoffAnswer');
      const label = players[playerIndex]?.label ?? PLAYER_PLACEHOLDERS[playerIndex]?.label ?? 'Team';
      setFeedback(`${label} buzzed first—answer now!`);
      setGuess('');
      startTimer('faceoffAnswer', TIMER_CONFIG.faceoffAnswer, () => handleMissRef.current?.('timeout'));
    },
    [phase, playerCount, players, roundStatus.state, startTimer, stopTimer],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isSpaceKey(event)) return;
      if (phase === 'questionZoom') {
        event.preventDefault();
        enterFaceoffBuzz();
        setTimeout(() => handleBuzz(true), 0);
      } else if (phase === 'faceoffBuzz') {
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

  const graceMs = TIMER_CONFIG.countdownGrace * 1000;
  const timerSecondsRemaining = timerState.mode
    ? Math.max(0, Math.ceil(Math.max(0, timerState.remainingMs - graceMs) / 1000))
    : null;
  const timerDisplay = timerSecondsRemaining ?? '–';
  const timerIsCritical = timerState.mode && (timerSecondsRemaining ?? 0) <= 3;
  const timerLabel = timerState.mode ? TIMER_LABELS[timerState.mode] : 'Timer';
  const instructionFallback =
    {
      faceoffBuzz: 'Buzz in with the spacebar.',
      playOrPass: 'Choose to play the board or pass control.',
      steal: 'One guess to steal the board.',
      playing: 'Guess one answer at a time. Three strikes ends the turn.',
      loading: roundStatus.message || 'Loading question…',
      error: roundStatus.message || 'Unable to load question.',
    }[phase] ?? '';
  const activeInstruction =
    (activePlayerIndex === null && feedback) || instructionFallback || 'Ready for the next cue.';
  const formPlaceholder =
    {
      faceoffAnswer: 'Face-off guess',
      faceoffChallenger: 'Challenge guess',
      playing: 'Enter board answer',
      steal: 'Steal guess',
    }[phase] ?? 'Input disabled';
  const roundComplete = phase === 'roundSummary' || phase === 'gameComplete';
  const showPlayOrPassActions = phase === 'playOrPass';
  const showRoundAdvanceAction = roundComplete;
  const roundTheme = ROUND_THEMES[roundIndex % TOTAL_ROUNDS] ?? ROUND_THEMES[0];
  const roundOverlayAsset = currentRound?.overlayAsset ?? roundTheme?.overlayAsset ?? '/Round_One.png';

  return {
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
    reloadRound: loadRound,
  };
}
