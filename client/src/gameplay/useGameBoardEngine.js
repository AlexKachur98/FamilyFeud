/**
 * @file useGameBoardEngine.js
 * @author Alex Kachur
 * @since 2025-11-12
 * @purpose Encapsulates Family Feud board state transitions, timers, and handlers for reuse.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ANSWERING_PHASES,
  PLAYER_PLACEHOLDERS,
  ROUND_DATA,
  TIMER_CONFIG,
  TIMER_LABELS,
} from './gameBoardConstants.js';
import { buildAnswerSlots, getOpponentIndex, isSpaceKey, normalize } from './gameBoardUtils.js';

export default function useGameBoardEngine() {
  const [roundIndex, setRoundIndex] = useState(0);
  const currentRound = ROUND_DATA[roundIndex] ?? ROUND_DATA[0];
  const gridAnswers = useMemo(() => buildAnswerSlots(currentRound), [currentRound]);
  const [revealedAnswers, setRevealedAnswers] = useState(() =>
    gridAnswers.map((answer) => (answer ? false : 'empty')),
  );
  const [phase, setPhase] = useState('intro');
  const [activePlayerIndex, setActivePlayerIndex] = useState(null);
  const [controlPlayer, setControlPlayer] = useState(null);
  const [buzzWinner, setBuzzWinner] = useState(null);
  const [faceoffLeader, setFaceoffLeader] = useState(null);
  const [roundPot, setRoundPot] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [scores, setScores] = useState(Array(PLAYER_PLACEHOLDERS.length).fill(0));
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [roundResult, setRoundResult] = useState(null);
  const inputRef = useRef(null);
  const faceoffCycleRef = useRef(0);
  const handleMissRef = useRef(() => {});
  const [timerState, setTimerState] = useState({ mode: null, remainingMs: 0 });
  const timerDeadlineRef = useRef(null);
  const timerCallbackRef = useRef(null);

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

  const enterFaceoffBuzz = useCallback(() => {
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
  }, [startTimer, stopTimer]);

  useEffect(() => {
    setRevealedAnswers(gridAnswers.map((answer) => (answer ? false : 'empty')));
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
  }, [gridAnswers, stopTimer]);

  useEffect(() => {
    if (phase !== 'intro') return undefined;
    const introTimer = setTimeout(() => setPhase('questionZoom'), 2000);
    return () => clearTimeout(introTimer);
  }, [phase]);

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
      setPhase(roundIndex < ROUND_DATA.length - 1 ? 'roundSummary' : 'gameComplete');
      setFeedback(note ?? '');
    },
    [roundIndex, roundPot, stopTimer],
  );

  const handleMiss = useCallback(
    (reason) => {
      stopTimer();
      if (phase === 'faceoffAnswer') {
        const challenger = getOpponentIndex(buzzWinner ?? 0);
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
            const stealPlayer = getOpponentIndex(controlPlayer ?? 0);
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
    [buzzWinner, controlPlayer, enterFaceoffBuzz, finalizeRound, phase, startTimer, stopTimer],
  );

  handleMissRef.current = handleMiss;

  const finalizeFaceoffControl = useCallback(
    (playerIndex, note) => {
      stopTimer();
      setControlPlayer(playerIndex);
      setActivePlayerIndex(playerIndex);
      setPhase('playOrPass');
      setFeedback(
        `${PLAYER_PLACEHOLDERS[playerIndex].label} controls the board${note ? ` – ${note}` : ''}. Choose play or pass.`,
      );
      setFaceoffLeader(null);
    },
    [stopTimer],
  );

  const handleCorrectAnswer = useCallback(
    (matchIndex) => {
      const slot = gridAnswers[matchIndex];
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
      setRoundPot((value) => value + slot.points * currentRound.multiplier);

      if (phase === 'faceoffAnswer') {
        if (slot.rank === 1) {
          finalizeFaceoffControl(activePlayerIndex ?? 0, 'Hit the #1 answer');
        } else {
          setFaceoffLeader({ playerIndex: activePlayerIndex ?? 0, rank: slot.rank });
          const challenger = getOpponentIndex(activePlayerIndex ?? 0);
          setActivePlayerIndex(challenger);
          setPhase('faceoffChallenger');
          setFeedback(
            `${PLAYER_PLACEHOLDERS[challenger].label} must beat rank #${slot.rank} to take control.`,
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
        finalizeRound(stealer, `${PLAYER_PLACEHOLDERS[stealer].label} stole the round!`);
      }
    },
    [
      activePlayerIndex,
      controlPlayer,
      currentRound.multiplier,
      faceoffLeader,
      finalizeFaceoffControl,
      finalizeRound,
      gridAnswers,
      handleMiss,
      phase,
      revealedAnswers,
      startTimer,
    ],
  );

  const beginPlaying = useCallback(
    (playerIndex) => {
      stopTimer();
      setPhase('playing');
      setActivePlayerIndex(playerIndex);
      setFeedback(`${PLAYER_PLACEHOLDERS[playerIndex].label} is playing the board.`);
      startTimer('playGuess', TIMER_CONFIG.playGuess, () => handleMissRef.current?.('timeout'));
    },
    [startTimer, stopTimer],
  );

  const handleControlChoice = useCallback(
    (choice) => {
      const owner = controlPlayer ?? 0;
      const target = choice === 'play' ? owner : getOpponentIndex(owner);
      setControlPlayer(target);
      beginPlaying(target);
    },
    [beginPlaying, controlPlayer],
  );

  const handleGuessSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!ANSWERING_PHASES.has(phase)) return;
      const cleaned = normalize(guess);
      if (!cleaned) return;
      stopTimer();
      const matchIndex = gridAnswers.findIndex(
        (slot, index) => slot && revealedAnswers[index] === false && slot.matchers.includes(cleaned),
      );
      if (matchIndex === -1) {
        setFeedback('No match. That counts as a strike.');
        handleMiss('no-match');
      } else {
        handleCorrectAnswer(matchIndex);
      }
      setGuess('');
    },
    [gridAnswers, guess, handleCorrectAnswer, handleMiss, phase, revealedAnswers, stopTimer],
  );

  const handleBuzz = useCallback(
    (force = false) => {
      if (!force && phase !== 'faceoffBuzz') return;
      const playerIndex = faceoffCycleRef.current % PLAYER_PLACEHOLDERS.length;
      faceoffCycleRef.current += 1;
      stopTimer();
      setBuzzWinner(playerIndex);
      setActivePlayerIndex(playerIndex);
      setPhase('faceoffAnswer');
      setFeedback(`${PLAYER_PLACEHOLDERS[playerIndex].label} buzzed first—answer now!`);
      setGuess('');
      startTimer('faceoffAnswer', TIMER_CONFIG.faceoffAnswer, () => handleMissRef.current?.('timeout'));
    },
    [phase, startTimer, stopTimer],
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

  const advanceRound = useCallback(() => {
    // TODO (Gameplay): Swap placeholder round cycling for API-driven question rotation when backend is ready.
    setRoundIndex((value) => {
      if (value < ROUND_DATA.length - 1) {
        return value + 1;
      }
      setScores(Array(PLAYER_PLACEHOLDERS.length).fill(0));
      return 0;
    });
  }, []);

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
  const roundOverlayAsset = currentRound.overlayAsset ?? '/Round_One.png';

  return {
    // data
    currentRound,
    roundIndex,
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
    // refs
    inputRef,
    // handlers
    setGuess,
    handleGuessSubmit,
    handleControlChoice,
    advanceRound,
  };
}
