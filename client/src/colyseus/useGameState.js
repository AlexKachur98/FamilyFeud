import { useState, useEffect } from 'react';

/**
 * React hook for reactive game state updates
 * Subscribes to specific state changes and provides derived values
 */
export function useGameState(room, gameState, userId) {
    const [phase, setPhase] = useState('lobby');
    const [teams, setTeams] = useState({ team1: null, team2: null });
    const [players, setPlayers] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [buzzer, setBuzzer] = useState({ active: false, locked: false, winnerId: '' });
    const [timer, setTimer] = useState(null);
    const [fastMoney, setFastMoney] = useState(null);

    // Update state when gameState changes
    useEffect(() => {
        if (!gameState) return;

        setPhase(gameState.phase || 'lobby');

        // Convert teams
        if (gameState.teams) {
            setTeams({
                team1: gameState.teams.team1 || null,
                team2: gameState.teams.team2 || null
            });
        }

        // Convert players map to array
        if (gameState.players) {
            const playerArray = Object.entries(gameState.players || {}).map(([sessionId, player]) => ({
                sessionId,
                ...player
            }));
            setPlayers(playerArray);
        }

        // Convert answers
        if (gameState.answers) {
            setAnswers(Array.isArray(gameState.answers) ? gameState.answers : []);
        }

        // Convert buzzer - ensure it's a plain object with correct property access
        if (gameState.buzzer !== undefined) {
            setBuzzer({
                active: Boolean(gameState.buzzer?.active),
                locked: Boolean(gameState.buzzer?.locked),
                winnerId: gameState.buzzer?.winnerId || ''
            });
        }

        setTimer(gameState.timer || null);
        setFastMoney(gameState.fastMoney || null);
    }, [gameState]);

    /**
     * Find the current player
     */
    const myPlayer = players.find(p => p.odId === userId || p.sessionId === room?.sessionId);

    /**
     * Get my team
     */
    const myTeam = myPlayer?.teamId ? teams[myPlayer.teamId] : null;

    /**
     * Get opposing team
     */
    const opposingTeam = myPlayer?.teamId === 'team1' ? teams.team2 : teams.team1;

    /**
     * Am I the host?
     */
    const isHost = gameState?.hostId === room?.sessionId;

    /**
     * Am I a spectator?
     */
    const isSpectator = myPlayer?.isSpectator === true;

    /**
     * Get list of spectators
     */
    const spectators = players.filter(p => p.isSpectator);

    /**
     * Can I buzz in?
     */
    const canBuzz = phase === 'faceoff' &&
        buzzer?.active &&
        !buzzer?.locked &&
        !buzzer?.winnerId &&
        !isSpectator;

    /**
     * Is it my team's turn to answer?
     */
    const isMyTeamsTurn = phase === 'play' &&
        myPlayer?.teamId === gameState?.controllingTeam;

    /**
     * Can I submit an answer?
     */
    const canAnswer = !isSpectator && (
        (phase === 'faceoff' && buzzer?.winnerId === room?.sessionId) ||
        (phase === 'play' && isMyTeamsTurn) ||
        (phase === 'steal' && myPlayer?.teamId !== gameState?.controllingTeam)
    );

    /**
     * Get revealed answers count
     */
    const revealedCount = answers.filter(a => a.revealed).length;

    /**
     * Calculate revealed points
     */
    const revealedPoints = answers
        .filter(a => a.revealed)
        .reduce((sum, a) => sum + a.points, 0);

    /**
     * Am I the current Fast Money player?
     */
    const isFastMoneyPlayer = phase === 'fastMoney' && (
        (fastMoney?.currentPlayer === 1 && fastMoney?.player1Id === room?.sessionId) ||
        (fastMoney?.currentPlayer === 2 && fastMoney?.player2Id === room?.sessionId)
    );

    /**
     * Get Fast Money questions as array
     */
    const fastMoneyQuestions = fastMoney?.questions
        ? (Array.isArray(fastMoney.questions) ? fastMoney.questions : [])
        : [];

    /**
     * Get Fast Money answers for current player
     */
    const fastMoneyAnswers = {
        player1: fastMoney?.player1Answers
            ? (Array.isArray(fastMoney.player1Answers) ? fastMoney.player1Answers : [])
            : [],
        player2: fastMoney?.player2Answers
            ? (Array.isArray(fastMoney.player2Answers) ? fastMoney.player2Answers : [])
            : []
    };

    return {
        // Raw state
        phase,
        teams,
        players,
        answers,
        buzzer,
        timer,
        fastMoney,

        // Derived state
        myPlayer,
        myTeam,
        opposingTeam,
        isHost,
        isSpectator,
        spectators,
        canBuzz,
        canAnswer,
        isMyTeamsTurn,
        revealedCount,
        revealedPoints,

        // Fast Money derived state
        isFastMoneyPlayer,
        fastMoneyQuestions,
        fastMoneyAnswers,

        // Game metadata
        roomCode: gameState?.roomCode,
        currentRound: gameState?.currentRound,
        roundType: gameState?.roundType,
        pointMultiplier: gameState?.pointMultiplier,
        questionText: gameState?.questionText,
        strikes: gameState?.strikes,
        pointsOnBoard: gameState?.pointsOnBoard,
        controllingTeam: gameState?.controllingTeam,
        message: gameState?.message,

        // Game over state
        winningTeam: gameState?.winningTeam,
        gameEndReason: gameState?.gameEndReason,

        // Face-off state (per official Family Feud rules)
        faceoffWaitingForSecond: gameState?.faceoffWaitingForSecond,
        awaitingPlayOrPass: gameState?.awaitingPlayOrPass,
        faceoffWinner: gameState?.faceoffWinner,
        faceoffAnswer1: gameState?.faceoffAnswer1,
        faceoffAnswer1Index: gameState?.faceoffAnswer1Index,
        faceoffAnswer2: gameState?.faceoffAnswer2,
        faceoffAnswer2Index: gameState?.faceoffAnswer2Index,
        // Alternating face-off state
        faceoffCurrentAnswerer: gameState?.faceoffCurrentAnswerer,

        // Steal tracking (per official rules: only ONE attempt allowed)
        stealAttempted: gameState?.stealAttempted
    };
}

export default useGameState;
