/**
 * @file GameBoard.jsx
 * @description Professional Family Feud game board - Big Screen / Spectator view
 * Display-only view optimized for presentation on a TV or projector
 * Game controls are in the admin hamburger menu
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/game.context';
import '../styles/game-board.css';

export default function GameBoard() {
    const navigate = useNavigate();
    const {
        isConnected,
        phase,
        questionText,
        message,
        teams,
        players,
        answers,
        controllingTeam,
        currentRound,
        pointMultiplier,
        strikes,
        pointsOnBoard,
        buzzer,
        winningTeam,
        fastMoney,
        fastMoneyQuestions,
        fastMoneyAnswers,
        leaveGame,
        // Face-off state
        awaitingPlayOrPass,
        faceoffWinner
    } = useGame();

    const [showStrike, setShowStrike] = useState(false);
    const [lastStrikeCount, setLastStrikeCount] = useState(0);

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

    // Strike animation effect
    useEffect(() => {
        if (strikes > lastStrikeCount) {
            setShowStrike(true);
            setTimeout(() => setShowStrike(false), 800);
        }
        setLastStrikeCount(strikes);
    }, [strikes, lastStrikeCount]);

    const handleLeave = () => {
        leaveGame();
        navigate('/');
    };

    const getPhaseTitle = () => {
        switch (phase) {
            case 'faceoff': return 'FACE OFF';
            case 'play': return 'SURVEY SAYS...';
            case 'steal': return 'STEAL!';
            case 'roundEnd': return 'ROUND COMPLETE';
            case 'fastMoney': return 'FAST MONEY';
            case 'gameOver': return 'GAME OVER';
            default: return 'FAMILY FEUD';
        }
    };

    const getRoundLabel = () => {
        if (phase === 'fastMoney') return 'BONUS ROUND';
        if (!currentRound) return '';
        const labels = ['', 'ROUND ONE', 'ROUND TWO', 'DOUBLE POINTS', 'TRIPLE POINTS'];
        return labels[currentRound] || `ROUND ${currentRound}`;
    };

    // Fast Money state
    const playersSelected = fastMoney?.player1Id && fastMoney?.player2Id;
    const fmPlayer1 = players.find(p => p.sessionId === fastMoney?.player1Id);
    const fmPlayer2 = players.find(p => p.sessionId === fastMoney?.player2Id);
    const fmCurrentPlayer = fastMoney?.currentPlayer || 1;
    const fmTimerSeconds = fastMoney?.timerSeconds || 0;
    const fmP1Total = fastMoney?.player1Total || 0;
    const fmP2Total = fastMoney?.player2Total || 0;
    const fmTotal = fmP1Total + fmP2Total;

    if (!isConnected) {
        return (
            <div className="game-board">
                <div className="game-board__loading">
                    <div className="game-board__loading-spinner"></div>
                    <p>Connecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="game-board game-board--display">
            {/* Strike Overlay Animation */}
            {showStrike && (
                <div className="game-board__strike-overlay">
                    <span className="game-board__strike-x">✕</span>
                </div>
            )}

            {/* Background Effects */}
            <div className="game-board__bg">
                <div className="game-board__bg-gradient"></div>
                <div className="game-board__bg-pattern"></div>
                <div className="game-board__spotlight game-board__spotlight--1"></div>
                <div className="game-board__spotlight game-board__spotlight--2"></div>
            </div>

            {/* Header */}
            <header className="game-board__header">
                <div className="game-board__round-badge">
                    {getRoundLabel()}
                    {pointMultiplier > 1 && <span className="game-board__multiplier">{pointMultiplier}×</span>}
                </div>
                <h1 className="game-board__title">{getPhaseTitle()}</h1>
                <div className="game-board__host-badge">
                    BIG SCREEN
                </div>
            </header>

            {/* Scoreboard */}
            <div className="game-board__scoreboard">
                <div className={`game-board__team-score game-board__team-score--1 ${controllingTeam === 'team1' ? 'has-control' : ''}`}>
                    <div className="game-board__team-name">{teams.team1?.name || 'Team 1'}</div>
                    <div className="game-board__score">{teams.team1?.totalScore || 0}</div>
                    {controllingTeam === 'team1' && <div className="game-board__control-indicator">IN CONTROL</div>}
                </div>

                <div className="game-board__points-center">
                    <div className="game-board__points-label">POINTS</div>
                    <div className="game-board__points-value">{pointsOnBoard || 0}</div>
                </div>

                <div className={`game-board__team-score game-board__team-score--2 ${controllingTeam === 'team2' ? 'has-control' : ''}`}>
                    <div className="game-board__team-name">{teams.team2?.name || 'Team 2'}</div>
                    <div className="game-board__score">{teams.team2?.totalScore || 0}</div>
                    {controllingTeam === 'team2' && <div className="game-board__control-indicator">IN CONTROL</div>}
                </div>
            </div>

            {/* Question Display */}
            {questionText && phase !== 'gameOver' && phase !== 'fastMoney' && (
                <div className="game-board__question">
                    <div className="game-board__question-text">{questionText}</div>
                </div>
            )}

            {/* Message Display */}
            {message && (
                <div className="game-board__message">
                    {message}
                </div>
            )}

            {/* Main Content Area */}
            <main className="game-board__main">
                {/* Game Over Display */}
                {phase === 'gameOver' && (
                    <div className="game-board__game-over">
                        <div className="game-board__winner-announcement">
                            {winningTeam ? (
                                <>
                                    <div className="game-board__confetti"></div>
                                    <h2 className="game-board__winner-title">
                                        {teams[winningTeam]?.name}
                                    </h2>
                                    <div className="game-board__winner-subtitle">WINS!</div>
                                    <div className="game-board__winner-score">
                                        {teams[winningTeam]?.totalScore} POINTS
                                    </div>
                                </>
                            ) : (
                                <h2 className="game-board__winner-title">IT'S A TIE!</h2>
                            )}
                        </div>
                        <div className="game-board__final-scores">
                            <div className={`game-board__final-team ${winningTeam === 'team1' ? 'winner' : ''}`}>
                                <span className="name">{teams.team1?.name}</span>
                                <span className="score">{teams.team1?.totalScore}</span>
                            </div>
                            <div className="game-board__final-vs">VS</div>
                            <div className={`game-board__final-team ${winningTeam === 'team2' ? 'winner' : ''}`}>
                                <span className="name">{teams.team2?.name}</span>
                                <span className="score">{teams.team2?.totalScore}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fast Money Display */}
                {phase === 'fastMoney' && (
                    <div className="game-board__fast-money">
                        {!playersSelected ? (
                            <div className="game-board__fm-waiting">
                                <h3>Fast Money</h3>
                                <p>Waiting for admin to select players...</p>
                            </div>
                        ) : (
                            <div className="game-board__fm-board">
                                <div className="game-board__fm-header">
                                    <div className={`game-board__fm-player ${fmCurrentPlayer === 1 ? 'active' : ''}`}>
                                        <span className="name">{fmPlayer1?.name || 'Player 1'}</span>
                                        <span className="score">{fmP1Total}</span>
                                    </div>
                                    <div className="game-board__fm-total">
                                        <span className="label">TOTAL</span>
                                        <span className={`value ${fmTotal >= 200 ? 'winner' : ''}`}>{fmTotal}</span>
                                        <span className="goal">Goal: 200</span>
                                    </div>
                                    <div className={`game-board__fm-player ${fmCurrentPlayer === 2 ? 'active' : ''}`}>
                                        <span className="name">{fmPlayer2?.name || 'Player 2'}</span>
                                        <span className="score">{fmP2Total}</span>
                                    </div>
                                </div>

                                <div className="game-board__fm-timer">
                                    <span className={fmTimerSeconds <= 5 ? 'critical' : ''}>{fmTimerSeconds}s</span>
                                </div>

                                <div className="game-board__fm-grid">
                                    {fastMoneyQuestions.map((q, idx) => {
                                        const p1Answer = fastMoneyAnswers.player1.find(a => a.questionIndex === idx);
                                        const p2Answer = fastMoneyAnswers.player2.find(a => a.questionIndex === idx);
                                        return (
                                            <div key={idx} className="game-board__fm-row">
                                                <div className="game-board__fm-question">{idx + 1}. {q.text}</div>
                                                <div className={`game-board__fm-answer ${p1Answer?.revealed ? 'revealed' : ''}`}>
                                                    {p1Answer?.revealed ? (
                                                        <>
                                                            <span className="text">{p1Answer.answer || '---'}</span>
                                                            <span className="points">{p1Answer.points}</span>
                                                        </>
                                                    ) : (
                                                        <span className="pending">---</span>
                                                    )}
                                                </div>
                                                <div className={`game-board__fm-answer ${p2Answer?.revealed ? 'revealed' : ''}`}>
                                                    {p2Answer?.revealed ? (
                                                        <>
                                                            <span className="text">{p2Answer.answer || '---'}</span>
                                                            <span className="points">{p2Answer.points}</span>
                                                        </>
                                                    ) : (
                                                        <span className="pending">---</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Regular Game Display */}
                {phase !== 'gameOver' && phase !== 'fastMoney' && (
                    <div className="game-board__play-area">
                        {/* Answer Board - Display only */}
                        <div className="game-board__answer-board">
                            {answers && answers.length > 0 ? (
                                <div className="game-board__answers">
                                    {answers.map((answer, index) => (
                                        <div
                                            key={index}
                                            className={`game-board__answer-slot ${answer.revealed ? 'revealed' : ''}`}
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
                        <div className="game-board__strikes">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className={`game-board__strike ${i < strikes ? 'active' : ''}`}>
                                    ✕
                                </div>
                            ))}
                        </div>

                        {/* Buzzer Status / Play or Pass */}
                        {phase === 'faceoff' && (
                            <div className="game-board__buzzer-status">
                                {awaitingPlayOrPass ? (
                                    <div className="game-board__play-pass-display">
                                        <div className="game-board__play-pass-winner-large">
                                            {players.find(p => p.sessionId === faceoffWinner)?.name} WINS FACE-OFF!
                                        </div>
                                        <div className="game-board__play-pass-team-large">
                                            {teams[players.find(p => p.sessionId === faceoffWinner)?.teamId]?.name}
                                        </div>
                                        <div className="game-board__play-pass-prompt-large">
                                            PLAY or PASS?
                                        </div>
                                    </div>
                                ) : buzzer?.winnerId ? (
                                    <div className="game-board__buzzer-winner">
                                        {players.find(p => p.sessionId === buzzer.winnerId)?.name} BUZZED IN!
                                    </div>
                                ) : buzzer?.active ? (
                                    <div className="game-board__buzzer-active">
                                        <span className="pulse"></span>
                                        BUZZER ACTIVE
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer - minimal leave button */}
            <footer className="game-board__footer">
                <button
                    className="game-board__btn game-board__btn--ghost game-board__btn--small"
                    onClick={handleLeave}
                >
                    Leave
                </button>
            </footer>
        </div>
    );
}
