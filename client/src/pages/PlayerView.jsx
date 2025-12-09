/**
 * @file PlayerView.jsx
 * @author Alex Kachur
 * @since 2025-12-09
 * @description Main contestant interface for Family Feud gameplay.
 *
 * Features:
 * - Buzzer system for face-off rounds with real-time lock
 * - Answer input forms for play, steal, and face-off phases
 * - Team benches as fixed sidebars showing all players
 * - Fast Money round support with timer display
 * - Play/Pass decision UI after winning face-off
 * - Alternating face-off mode when both players miss
 *
 * Game Flow:
 * 1. Face-off: Players buzz in, winner's team chooses play/pass
 * 2. Play: Controlling team answers until 3 strikes or all revealed
 * 3. Steal: One chance for opposing team to steal points
 * 4. Round End: Points awarded, auto-advance to next round
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/game.context';
import '../styles/game-board.css';

export default function PlayerView() {
    const navigate = useNavigate();
    const {
        isConnected,
        phase,
        questionText,
        message,
        teams,
        players,
        answers,
        myPlayer,
        myTeam,
        controllingTeam,
        strikes,
        pointsOnBoard,
        buzzer,
        winningTeam,
        fastMoney,
        isFastMoneyPlayer,
        // Face-off state
        faceoffWaitingForSecond,
        awaitingPlayOrPass,
        faceoffWinner,
        faceoffCurrentAnswerer,
        // Steal tracking
        stealAttempted,
        // Player actions
        buzz,
        submitAnswer,
        submitFastMoneyAnswer,
        leaveGame,
        playOrPass
    } = useGame();

    const [answer, setAnswer] = useState('');
    const [fmAnswer, setFmAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef(null);
    const fmInputRef = useRef(null);

    // Determine if player can answer (computed early for use in effects)
    const isMyTurn = myPlayer?.teamId === controllingTeam;
    const canSteal = phase === 'steal' && myPlayer?.teamId !== controllingTeam && !stealAttempted;
    const isBuzzerWinner = buzzer?.winnerId === myPlayer?.sessionId;

    // Check if I'm on the opposing team of the buzzer winner (for faceoff second chance)
    const buzzerWinnerPlayer = players.find(p => p.sessionId === buzzer?.winnerId);
    const isOpponentOfBuzzerWinner = buzzerWinnerPlayer && myPlayer?.teamId !== buzzerWinnerPlayer.teamId;

    // Check if I'm the current answerer in alternating mode
    const isAlternatingMode = faceoffCurrentAnswerer && faceoffCurrentAnswerer !== '';
    const isMyTurnToAnswer = faceoffCurrentAnswerer === myPlayer?.sessionId;

    // Can answer: buzzer winner first, OR opponent during second chance, OR alternating mode turn, OR during play/steal
    const canAnswer = (phase === 'faceoff' && !isAlternatingMode && isBuzzerWinner && !faceoffWaitingForSecond) ||
                      (phase === 'faceoff' && !isAlternatingMode && faceoffWaitingForSecond && isOpponentOfBuzzerWinner) ||
                      (phase === 'faceoff' && isAlternatingMode && isMyTurnToAnswer) ||
                      (phase === 'play' && isMyTurn) ||
                      canSteal;

    const fmTimerSeconds = fastMoney?.timerSeconds || 0;
    const fmQuestionIndex = fastMoney?.currentQuestionIndex || 0;

    // Get players by team
    const team1Players = players.filter(p => p.teamId === 'team1');
    const team2Players = players.filter(p => p.teamId === 'team2');

    // Redirect if not connected
    useEffect(() => {
        if (!isConnected) {
            navigate('/lobby');
        }
    }, [isConnected, navigate]);

    // Redirect to lobby if game returns to lobby phase
    useEffect(() => {
        if (phase === 'lobby') {
            navigate('/lobby');
        }
    }, [phase, navigate]);

    // Auto-focus input when it's player's turn
    useEffect(() => {
        if (canAnswer && inputRef.current) {
            inputRef.current.focus();
        }
    }, [canAnswer]);

    // Auto-focus FM input when timer active
    useEffect(() => {
        if (isFastMoneyPlayer && fastMoney?.timerSeconds > 0 && fmInputRef.current) {
            fmInputRef.current.focus();
        }
    }, [isFastMoneyPlayer, fastMoney?.timerSeconds]);

    // Clear FM answer on question change
    useEffect(() => {
        setFmAnswer('');
    }, [fastMoney?.currentQuestionIndex]);

    const handleLeave = () => {
        leaveGame();
        navigate('/');
    };

    const handleBuzz = () => {
        if (phase === 'faceoff' && buzzer?.active && !buzzer?.locked) {
            buzz();
        }
    };

    const handleSubmitAnswer = (e) => {
        e.preventDefault();
        if (answer.trim() && canAnswer && !isSubmitting) {
            setIsSubmitting(true);
            submitAnswer(answer.trim());
            setAnswer('');
            setTimeout(() => setIsSubmitting(false), 500);
        }
    };

    const handleSubmitFMAnswer = (e) => {
        e.preventDefault();
        if (fmAnswer.trim() && isFastMoneyPlayer && fastMoney?.timerSeconds > 0) {
            submitFastMoneyAnswer(fmAnswer.trim());
            setFmAnswer('');
        }
    };

    if (!isConnected) {
        return (
            <div className="game-board game-board--player">
                <div className="game-board__loading">
                    <div className="game-board__loading-spinner"></div>
                    <p>Connecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="game-board game-board--player game-board--with-benches">
            {/* Background Effects */}
            <div className="game-board__bg">
                <div className="game-board__bg-gradient"></div>
                <div className="game-board__bg-pattern"></div>
            </div>

            {/* Team 1 Bench - Fixed Left Sidebar */}
            <aside className={`team-bench team-bench--left ${controllingTeam === 'team1' ? 'has-control' : ''}`}>
                <div className="team-bench__header">
                    <span className="team-bench__name">{teams.team1?.name || 'Team 1'}</span>
                    <span className="team-bench__score">{teams.team1?.totalScore || 0}</span>
                </div>
                <div className="team-bench__players">
                    {team1Players.map((player) => (
                        <div
                            key={player.sessionId}
                            className={`team-bench__player ${player.sessionId === myPlayer?.sessionId ? 'is-me' : ''}`}
                        >
                            <span className="team-bench__player-name">{player.name}</span>
                            {player.isHost && <span className="team-bench__badge team-bench__badge--host">H</span>}
                        </div>
                    ))}
                </div>
                {controllingTeam === 'team1' && (
                    <div className="team-bench__turn-indicator">
                        <span className="team-bench__turn-arrow">▶</span>
                        PLAYING
                    </div>
                )}
            </aside>

            {/* Team 2 Bench - Fixed Right Sidebar */}
            <aside className={`team-bench team-bench--right ${controllingTeam === 'team2' ? 'has-control' : ''}`}>
                <div className="team-bench__header">
                    <span className="team-bench__name">{teams.team2?.name || 'Team 2'}</span>
                    <span className="team-bench__score">{teams.team2?.totalScore || 0}</span>
                </div>
                <div className="team-bench__players">
                    {team2Players.map((player) => (
                        <div
                            key={player.sessionId}
                            className={`team-bench__player ${player.sessionId === myPlayer?.sessionId ? 'is-me' : ''}`}
                        >
                            <span className="team-bench__player-name">{player.name}</span>
                            {player.isHost && <span className="team-bench__badge team-bench__badge--host">H</span>}
                        </div>
                    ))}
                </div>
                {controllingTeam === 'team2' && (
                    <div className="team-bench__turn-indicator">
                        <span className="team-bench__turn-arrow">◀</span>
                        PLAYING
                    </div>
                )}
            </aside>

            {/* Compact Scoreboard */}
            <div className="game-board__scoreboard game-board__scoreboard--compact">
                <div className={`game-board__team-score game-board__team-score--1 ${controllingTeam === 'team1' ? 'has-control' : ''} ${myPlayer?.teamId === 'team1' ? 'my-team' : ''}`}>
                    <div className="game-board__team-name">{teams.team1?.name || 'Team 1'}</div>
                    <div className="game-board__score">{teams.team1?.totalScore || 0}</div>
                </div>
                <div className="game-board__points-center game-board__points-center--compact">
                    <div className="game-board__points-value">{pointsOnBoard || 0}</div>
                </div>
                <div className={`game-board__team-score game-board__team-score--2 ${controllingTeam === 'team2' ? 'has-control' : ''} ${myPlayer?.teamId === 'team2' ? 'my-team' : ''}`}>
                    <div className="game-board__team-name">{teams.team2?.name || 'Team 2'}</div>
                    <div className="game-board__score">{teams.team2?.totalScore || 0}</div>
                </div>
            </div>

            {/* Question Display */}
            {questionText && phase !== 'gameOver' && phase !== 'fastMoney' && (
                <div className="game-board__question game-board__question--compact">
                    <div className="game-board__question-text">{questionText}</div>
                </div>
            )}

            {/* Message Display */}
            {message && (
                <div className="game-board__message">
                    {message}
                </div>
            )}

            {/* Main Content */}
            <main className="game-board__main game-board__main--player">
                {/* Game Over */}
                {phase === 'gameOver' && (
                    <div className="game-board__game-over game-board__game-over--player">
                        {winningTeam ? (
                            <div className={`game-board__result-banner ${myTeam?.id === winningTeam ? 'won' : 'lost'}`}>
                                {myTeam?.id === winningTeam ? (
                                    <>
                                        <div className="game-board__result-icon">🎉</div>
                                        <h2>YOU WON!</h2>
                                        <p>Congratulations!</p>
                                    </>
                                ) : (
                                    <>
                                        <h2>Game Over</h2>
                                        <p>{teams[winningTeam]?.name} wins!</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="game-board__result-banner tie">
                                <h2>IT'S A TIE!</h2>
                            </div>
                        )}
                        <div className="game-board__final-scores game-board__final-scores--compact">
                            <div className={`game-board__final-team ${winningTeam === 'team1' ? 'winner' : ''}`}>
                                <span className="name">{teams.team1?.name}</span>
                                <span className="score">{teams.team1?.totalScore}</span>
                            </div>
                            <div className={`game-board__final-team ${winningTeam === 'team2' ? 'winner' : ''}`}>
                                <span className="name">{teams.team2?.name}</span>
                                <span className="score">{teams.team2?.totalScore}</span>
                            </div>
                        </div>
                        <p className="game-board__waiting-text">Waiting for host...</p>
                    </div>
                )}

                {/* Fast Money */}
                {phase === 'fastMoney' && (
                    <div className="game-board__fm-player">
                        {isFastMoneyPlayer ? (
                            fmTimerSeconds > 0 ? (
                                <div className="game-board__fm-active">
                                    <div className={`game-board__fm-timer-display ${fmTimerSeconds <= 5 ? 'critical' : ''}`}>
                                        {fmTimerSeconds}
                                    </div>
                                    <div className="game-board__fm-question-number">
                                        Question {fmQuestionIndex + 1} of 5
                                    </div>
                                    <div className="game-board__fm-current-question">
                                        {questionText}
                                    </div>
                                    <form className="game-board__fm-form" onSubmit={handleSubmitFMAnswer}>
                                        <input
                                            ref={fmInputRef}
                                            type="text"
                                            value={fmAnswer}
                                            onChange={(e) => setFmAnswer(e.target.value)}
                                            placeholder="Type your answer..."
                                            autoComplete="off"
                                            autoFocus
                                        />
                                        <button type="submit" disabled={!fmAnswer.trim()}>
                                            SUBMIT
                                        </button>
                                    </form>
                                    <p className="game-board__fm-hint">Press Enter to submit quickly!</p>
                                </div>
                            ) : (
                                <div className="game-board__fm-ready">
                                    <div className="game-board__fm-ready-icon">⏱️</div>
                                    <h3>Get Ready!</h3>
                                    <p>The host will start your timer.<br/>Answer 5 questions as fast as you can!</p>
                                </div>
                            )
                        ) : (
                            <div className="game-board__fm-waiting">
                                <div className="game-board__fm-waiting-icon">👀</div>
                                <h3>Fast Money Round</h3>
                                <p>Watching the action...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Regular Play */}
                {phase !== 'gameOver' && phase !== 'fastMoney' && (
                    <div className="game-board__player-area">
                        {/* Answer Board (Read-only) */}
                        <div className="game-board__answer-board game-board__answer-board--compact">
                            {answers && answers.length > 0 ? (
                                <div className="game-board__answers game-board__answers--compact">
                                    {answers.map((answer, index) => (
                                        <div
                                            key={index}
                                            className={`game-board__answer-slot game-board__answer-slot--small ${answer.revealed ? 'revealed' : ''}`}
                                        >
                                            <div className="game-board__answer-inner">
                                                <div className="game-board__answer-front">
                                                    <span className="game-board__answer-number">{index + 1}</span>
                                                </div>
                                                <div className="game-board__answer-back">
                                                    <span className="game-board__answer-text">{answer.text}</span>
                                                    <span className="game-board__answer-points">{answer.points}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="game-board__answers-loading">
                                    Waiting for question...
                                </div>
                            )}
                        </div>

                        {/* Strikes Display */}
                        <div className="game-board__strikes game-board__strikes--compact">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className={`game-board__strike ${i < strikes ? 'active' : ''}`}>
                                    ✕
                                </div>
                            ))}
                        </div>

                        {/* Player Action Area */}
                        <div className="game-board__action-area">
                            {/* Faceoff - Buzzer and Answer Input */}
                            {phase === 'faceoff' && (
                                <div className="game-board__buzzer-area">
                                    {awaitingPlayOrPass ? (
                                        /* Play/Pass decision - winning team decides */
                                        (() => {
                                            const winnerPlayer = players.find(p => p.sessionId === faceoffWinner);
                                            const winnerTeamId = winnerPlayer?.teamId;
                                            const isOnWinningTeam = myPlayer?.teamId === winnerTeamId;

                                            return (
                                                <div className="game-board__play-pass-waiting">
                                                    <div className="game-board__play-pass-banner">
                                                        <div className="game-board__play-pass-winner">
                                                            {winnerPlayer?.name} wins the face-off!
                                                        </div>
                                                        <div className="game-board__play-pass-team">
                                                            {teams[winnerTeamId]?.name || 'Winning team'}
                                                        </div>
                                                        <div className="game-board__play-pass-prompt">
                                                            PLAY or PASS?
                                                        </div>
                                                        {isOnWinningTeam ? (
                                                            /* Winning team members can choose */
                                                            <div className="game-board__play-pass-buttons">
                                                                <button
                                                                    type="button"
                                                                    className="game-board__play-pass-btn game-board__play-pass-btn--play"
                                                                    onClick={() => playOrPass('play')}
                                                                >
                                                                    PLAY
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="game-board__play-pass-btn game-board__play-pass-btn--pass"
                                                                    onClick={() => playOrPass('pass')}
                                                                >
                                                                    PASS
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            /* Other team waits */
                                                            <p className="game-board__play-pass-status">
                                                                Waiting for {teams[winnerTeamId]?.name} to decide...
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : isAlternatingMode && isMyTurnToAnswer ? (
                                        /* ALTERNATING MODE - It's my turn to answer */
                                        <div className="game-board__buzzer-won">
                                            <div className="game-board__buzzer-won-text">YOUR TURN!</div>
                                            <form className="game-board__answer-form" onSubmit={handleSubmitAnswer}>
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={answer}
                                                    onChange={(e) => setAnswer(e.target.value)}
                                                    placeholder="Give your answer..."
                                                    autoComplete="off"
                                                    autoFocus
                                                />
                                                <button type="submit" disabled={!answer.trim() || isSubmitting}>
                                                    SUBMIT
                                                </button>
                                            </form>
                                        </div>
                                    ) : isAlternatingMode && !isMyTurnToAnswer ? (
                                        /* ALTERNATING MODE - Waiting for another player */
                                        <div className="game-board__buzzer-locked">
                                            <div className="game-board__faceoff-result">
                                                <p>Waiting for {players.find(p => p.sessionId === faceoffCurrentAnswerer)?.name} to answer...</p>
                                            </div>
                                        </div>
                                    ) : isBuzzerWinner && !faceoffWaitingForSecond ? (
                                        /* I buzzed in first - my turn to answer */
                                        <div className="game-board__buzzer-won">
                                            <div className="game-board__buzzer-won-text">YOU BUZZED IN!</div>
                                            <form className="game-board__answer-form" onSubmit={handleSubmitAnswer}>
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={answer}
                                                    onChange={(e) => setAnswer(e.target.value)}
                                                    placeholder="Enter your answer..."
                                                    autoComplete="off"
                                                    autoFocus
                                                />
                                                <button type="submit" disabled={!answer.trim() || isSubmitting}>
                                                    SUBMIT
                                                </button>
                                            </form>
                                        </div>
                                    ) : faceoffWaitingForSecond && !isOpponentOfBuzzerWinner ? (
                                        /* I buzzed first but didn't get #1 - waiting for other team */
                                        <div className="game-board__buzzer-locked">
                                            <div className="game-board__faceoff-result">
                                                <p>Waiting for other team to answer...</p>
                                            </div>
                                        </div>
                                    ) : faceoffWaitingForSecond && isOpponentOfBuzzerWinner ? (
                                        /* Other team gets a chance to beat my answer */
                                        <div className="game-board__buzzer-won">
                                            <div className="game-board__buzzer-won-text">YOUR TURN! Try to beat their answer!</div>
                                            <form className="game-board__answer-form" onSubmit={handleSubmitAnswer}>
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={answer}
                                                    onChange={(e) => setAnswer(e.target.value)}
                                                    placeholder="Give a better answer..."
                                                    autoComplete="off"
                                                    autoFocus
                                                />
                                                <button type="submit" disabled={!answer.trim() || isSubmitting}>
                                                    SUBMIT
                                                </button>
                                            </form>
                                        </div>
                                    ) : buzzer?.locked ? (
                                        /* Buzzer is locked - someone else buzzed */
                                        <div className="game-board__buzzer-locked">
                                            <button className="game-board__buzzer game-board__buzzer--locked" disabled>
                                                LOCKED
                                            </button>
                                            <p>{players.find(p => p.sessionId === buzzer.winnerId)?.name} buzzed first!</p>
                                        </div>
                                    ) : (
                                        /* Buzzer available */
                                        <button
                                            className={`game-board__buzzer ${buzzer?.active ? 'game-board__buzzer--active' : ''}`}
                                            onClick={handleBuzz}
                                            disabled={!buzzer?.active}
                                        >
                                            <span className="game-board__buzzer-text">BUZZ</span>
                                            {buzzer?.active && <span className="game-board__buzzer-pulse"></span>}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Play Phase - Answer Input */}
                            {phase === 'play' && (
                                <div className="game-board__play-area-input">
                                    {isMyTurn ? (
                                        <>
                                            <div className="game-board__turn-indicator">YOUR TEAM'S TURN!</div>
                                            <form className="game-board__answer-form" onSubmit={handleSubmitAnswer}>
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={answer}
                                                    onChange={(e) => setAnswer(e.target.value)}
                                                    placeholder="Type your answer..."
                                                    autoComplete="off"
                                                />
                                                <button type="submit" disabled={!answer.trim() || isSubmitting}>
                                                    SUBMIT
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <div className="game-board__waiting">
                                            <p>Waiting for {teams[controllingTeam]?.name}...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Steal Phase */}
                            {phase === 'steal' && (
                                <div className="game-board__steal-area">
                                    {stealAttempted ? (
                                        /* Steal attempt in progress - waiting for result */
                                        <div className="game-board__waiting">
                                            <p>Steal attempt submitted! Waiting for result...</p>
                                        </div>
                                    ) : canSteal ? (
                                        <>
                                            <div className="game-board__steal-prompt">STEAL OPPORTUNITY!</div>
                                            <p className="game-board__steal-warning">ONE guess only!</p>
                                            <form className="game-board__answer-form" onSubmit={handleSubmitAnswer}>
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={answer}
                                                    onChange={(e) => setAnswer(e.target.value)}
                                                    placeholder="Guess an answer to steal..."
                                                    autoComplete="off"
                                                    autoFocus
                                                />
                                                <button type="submit" disabled={!answer.trim() || isSubmitting}>
                                                    STEAL!
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <div className="game-board__waiting">
                                            <p>{teams[controllingTeam === 'team1' ? 'team2' : 'team1']?.name} is trying to steal...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Round End */}
                            {phase === 'roundEnd' && (
                                <div className="game-board__round-end">
                                    <h3>Round Complete!</h3>
                                    <p>Next round starting soon...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="game-board__footer">
                <button
                    className="game-board__btn game-board__btn--ghost game-board__btn--small"
                    onClick={handleLeave}
                >
                    Leave Game
                </button>
            </footer>
        </div>
    );
}
