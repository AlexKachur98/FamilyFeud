/**
 * @file game.context.jsx
 * @author Alex Kachur
 * @since 2025-12-09
 * @description React context for Family Feud game state and actions.
 *
 * Provides:
 * - Colyseus room connection management
 * - Real-time game state (phase, teams, answers, scores)
 * - Host actions (start game, reveal answers, fast money controls)
 * - Player actions (buzz, submit answer, play/pass, switch team)
 *
 * Usage: Wrap app with <GameProvider>, use useGame() hook in components.
 */
import { createContext, useContext, useMemo, useCallback } from 'react';
import { useColyseus } from '../colyseus/useColyseus';
import { useGameState } from '../colyseus/useGameState';
import { useAuth } from '../components/auth/AuthContext';

const GameContext = createContext(null);

/**
 * Game Provider component - wraps the app to provide game state and actions.
 * Combines Colyseus room management with parsed game state.
 */
export function GameProvider({ children }) {
    const { user } = useAuth();
    const colyseus = useColyseus();
    const gameState = useGameState(
        colyseus.room,
        colyseus.gameState,
        user?._id
    );

    // ==================== HOST ACTIONS ====================

    const startGame = useCallback(() => {
        colyseus.send('host:startGame', {});
    }, [colyseus]);

    const nextRound = useCallback(() => {
        colyseus.send('host:nextRound', {});
    }, [colyseus]);

    const revealAnswer = useCallback((index) => {
        colyseus.send('host:revealAnswer', { index });
    }, [colyseus]);

    const addStrike = useCallback(() => {
        colyseus.send('host:addStrike', {});
    }, [colyseus]);

    const passControl = useCallback(() => {
        colyseus.send('host:passControl', {});
    }, [colyseus]);

    const startFaceoff = useCallback((player1Id, player2Id) => {
        colyseus.send('host:startFaceoff', { player1Id, player2Id });
    }, [colyseus]);

    const endRound = useCallback(() => {
        colyseus.send('host:endRound', {});
    }, [colyseus]);

    const setTeamName = useCallback((teamId, name) => {
        colyseus.send('host:setTeamName', { teamId, name });
    }, [colyseus]);

    // Face-off play/pass decision (per official Family Feud rules)
    // The winning PLAYER decides, not the host
    const playOrPass = useCallback((choice) => {
        colyseus.send('player:playOrPass', { choice }); // 'play' or 'pass'
    }, [colyseus]);

    const kickPlayer = useCallback((sessionId) => {
        colyseus.send('host:kickPlayer', { sessionId });
    }, [colyseus]);

    const shuffleTeams = useCallback(() => {
        colyseus.send('host:shuffleTeams', {});
    }, [colyseus]);

    // ==================== PLAYER ACTIONS ====================

    const buzz = useCallback(() => {
        colyseus.send('player:buzz', {});
    }, [colyseus]);

    const submitAnswer = useCallback((answer) => {
        colyseus.send('player:submitAnswer', { answer });
    }, [colyseus]);

    const toggleReady = useCallback(() => {
        colyseus.send('player:ready', {});
    }, [colyseus]);

    const switchTeam = useCallback(() => {
        colyseus.send('player:switchTeam', {});
    }, [colyseus]);

    const toggleSpectator = useCallback(() => {
        colyseus.send('player:toggleSpectator', {});
    }, [colyseus]);

    // ==================== FAST MONEY ACTIONS ====================

    const startFastMoney = useCallback(() => {
        colyseus.send('host:startFastMoney', {});
    }, [colyseus]);

    const selectFastMoneyPlayers = useCallback((player1Id, player2Id) => {
        colyseus.send('host:selectFastMoneyPlayers', { player1Id, player2Id });
    }, [colyseus]);

    const startFastMoneyTimer = useCallback(() => {
        colyseus.send('host:startFastMoneyTimer', {});
    }, [colyseus]);

    const revealFastMoneyAnswer = useCallback((playerNum, questionIndex) => {
        colyseus.send('host:revealFastMoneyAnswer', { playerNum, questionIndex });
    }, [colyseus]);

    const nextFastMoneyQuestion = useCallback(() => {
        colyseus.send('host:nextFastMoneyQuestion', {});
    }, [colyseus]);

    const endFastMoney = useCallback(() => {
        colyseus.send('host:endFastMoney', {});
    }, [colyseus]);

    const submitFastMoneyAnswer = useCallback((answer) => {
        colyseus.send('player:fastMoneyAnswer', { answer });
    }, [colyseus]);

    // ==================== GAME COMPLETION ACTIONS ====================

    const playAgain = useCallback(() => {
        colyseus.send('host:playAgain', {});
    }, [colyseus]);

    const endGame = useCallback(() => {
        colyseus.send('host:endGame', {});
    }, [colyseus]);

    // ==================== ROOM ACTIONS ====================

    const createGame = useCallback(async (displayName) => {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('t='))
            ?.split('=')[1];

        return colyseus.createRoom({
            token,
            displayName: displayName || user?.username || 'Host'
        });
    }, [colyseus, user]);

    const joinGame = useCallback(async (roomCode, displayName) => {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('t='))
            ?.split('=')[1];

        return colyseus.joinByCode(roomCode, {
            token,
            displayName: displayName || user?.username || 'Player'
        });
    }, [colyseus, user]);

    const leaveGame = useCallback(() => {
        colyseus.leaveRoom(true);
    }, [colyseus]);

    // Memoize context value
    const value = useMemo(() => ({
        // Connection state
        isConnected: colyseus.isConnected,
        isConnecting: colyseus.isConnecting,
        connectionError: colyseus.error,

        // Game state (from useGameState)
        ...gameState,

        // Room info
        roomId: colyseus.room?.roomId,
        sessionId: colyseus.room?.sessionId,

        // Host actions
        startGame,
        nextRound,
        revealAnswer,
        addStrike,
        passControl,
        startFaceoff,
        endRound,
        setTeamName,
        playOrPass,
        kickPlayer,
        shuffleTeams,

        // Player actions
        buzz,
        submitAnswer,
        toggleReady,
        switchTeam,
        toggleSpectator,

        // Fast Money actions
        startFastMoney,
        selectFastMoneyPlayers,
        startFastMoneyTimer,
        revealFastMoneyAnswer,
        nextFastMoneyQuestion,
        endFastMoney,
        submitFastMoneyAnswer,

        // Game completion actions
        playAgain,
        endGame,

        // Room actions
        createGame,
        joinGame,
        leaveGame,
        tryReconnect: colyseus.tryReconnect
    }), [
        colyseus.isConnected,
        colyseus.isConnecting,
        colyseus.error,
        colyseus.room?.roomId,
        colyseus.room?.sessionId,
        colyseus.tryReconnect,
        gameState,
        startGame,
        nextRound,
        revealAnswer,
        addStrike,
        passControl,
        startFaceoff,
        endRound,
        setTeamName,
        playOrPass,
        kickPlayer,
        shuffleTeams,
        buzz,
        submitAnswer,
        toggleReady,
        switchTeam,
        toggleSpectator,
        startFastMoney,
        selectFastMoneyPlayers,
        startFastMoneyTimer,
        revealFastMoneyAnswer,
        nextFastMoneyQuestion,
        endFastMoney,
        submitFastMoneyAnswer,
        playAgain,
        endGame,
        createGame,
        joinGame,
        leaveGame
    ]);

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

/**
 * Hook to access game context
 */
export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

export default GameContext;
