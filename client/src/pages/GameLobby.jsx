/**
 * @file GameLobby.jsx
 * @author Alex Kachur
 * @since 2025-12-09
 * @description Unified game lobby for Family Feud with Colyseus real-time multiplayer.
 * Handles room creation, joining via 6-digit code, team assignment, and pre-game setup.
 * Players can toggle ready state, switch teams, and host can shuffle/kick players.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/game.context';
import { useAuth } from '../components/auth/AuthContext';
import '../styles/game-lobby.css';

// Lobby view modes
const VIEW = {
    JOIN: 'join',
    WAITING: 'waiting'
};

export default function GameLobby() {
    const navigate = useNavigate();
    const { sessionId: urlSessionId } = useParams();
    const { user } = useAuth();
    const {
        isConnected,
        isConnecting,
        connectionError,
        roomCode,
        phase,
        teams,
        players,
        myPlayer,
        isHost,
        createGame,
        joinGame,
        startGame,
        setTeamName,
        toggleReady,
        switchTeam,
        leaveGame,
        kickPlayer,
        shuffleTeams
    } = useGame();

    // Local state
    const [view, setView] = useState(VIEW.JOIN);
    const [accessCode, setAccessCode] = useState(urlSessionId || '');
    const [displayName, setDisplayName] = useState(user?.username || '');
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [team1NameLocal, setTeam1NameLocal] = useState(null); // null = not yet synced
    const [team2NameLocal, setTeam2NameLocal] = useState(null);

    // Sync team names from server (only on initial load, null means not synced yet)
    useEffect(() => {
        if (teams.team1?.name && team1NameLocal === null) {
            setTeam1NameLocal(teams.team1.name);
        }
        if (teams.team2?.name && team2NameLocal === null) {
            setTeam2NameLocal(teams.team2.name);
        }
    }, [teams, team1NameLocal, team2NameLocal]);

    // Switch to waiting view when connected
    useEffect(() => {
        if (isConnected && view === VIEW.JOIN) {
            setView(VIEW.WAITING);
        }
    }, [isConnected, view]);

    // Navigate to game when it starts - everyone goes to player view
    useEffect(() => {
        if (phase === 'faceoff' || phase === 'play' || phase === 'steal' || phase === 'roundEnd' || phase === 'fastMoney') {
            navigate('/player-view');
        }
    }, [phase, navigate]);

    // Handle joining a game
    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');

        if (!accessCode || accessCode.length !== 6) {
            setError('Please enter a valid 6-digit room code');
            return;
        }

        if (!displayName.trim()) {
            setError('Please enter your display name');
            return;
        }

        const room = await joinGame(accessCode, displayName.trim());
        if (room) {
            setView(VIEW.WAITING);
        }
    };

    // Handle creating a new game
    const handleCreateGame = async () => {
        setError('');
        setIsCreating(true);

        if (!displayName.trim()) {
            setError('Please enter your display name to host');
            setIsCreating(false);
            return;
        }

        await createGame(displayName.trim());
        setIsCreating(false);
        setView(VIEW.WAITING);
    };

    // Handle starting the game (host only)
    const handleStartGame = () => {
        startGame();
    };

    // Handle team name changes
    const handleTeamNameChange = useCallback((teamId, name) => {
        if (teamId === 'team1') {
            setTeam1NameLocal(name);
        } else {
            setTeam2NameLocal(name);
        }
        setTeamName(teamId, name);
    }, [setTeamName]);

    // Handle leaving
    const handleLeave = () => {
        leaveGame();
        setView(VIEW.JOIN);
        setAccessCode('');
    };

    // Copy room code to clipboard
    const copyRoomCode = async () => {
        if (roomCode) {
            await navigator.clipboard.writeText(roomCode);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    // Get players for each team
    const team1Players = players.filter(p => p.teamId === 'team1');
    const team2Players = players.filter(p => p.teamId === 'team2');

    // Check if game can start
    const canStart = team1Players.length > 0 && team2Players.length > 0;

    // Count ready players
    const readyCount = players.filter(p => p.isReady).length;
    const totalPlayers = players.length;

    // Render join form view
    const renderJoinView = () => (
        <div className="lobby-join">
            <div className="lobby-join__hero">
                <div className="lobby-join__logo">
                    <span className="lobby-join__logo-text">FAMILY</span>
                    <span className="lobby-join__logo-feud">FEUD</span>
                </div>
                <p className="lobby-join__tagline">Survey Says... It&apos;s Game Time!</p>
            </div>

            <div className="lobby-join__cards">
                {/* Join Game Card */}
                <div className="lobby-card lobby-card--join">
                    <div className="lobby-card__header">
                        <div className="lobby-card__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10 17 15 12 10 7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                        </div>
                        <h2 className="lobby-card__title">Join Game</h2>
                        <p className="lobby-card__subtitle">Enter a room code to join</p>
                    </div>

                    <form className="lobby-card__form" onSubmit={handleJoin}>
                        <div className="lobby-input-group">
                            <label htmlFor="room-code" className="lobby-input-group__label">
                                Room Code
                            </label>
                            <input
                                id="room-code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="000000"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                                className="lobby-input lobby-input--code"
                                autoComplete="off"
                            />
                        </div>

                        <div className="lobby-input-group">
                            <label htmlFor="display-name-join" className="lobby-input-group__label">
                                Your Name
                            </label>
                            <input
                                id="display-name-join"
                                type="text"
                                placeholder="Enter your name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="lobby-input"
                                autoComplete="name"
                            />
                        </div>

                        {(error || connectionError) && (
                            <div className="lobby-error">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <span>{error || connectionError?.message}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="lobby-btn lobby-btn--primary"
                            disabled={isConnecting}
                        >
                            {isConnecting ? (
                                <>
                                    <span className="lobby-btn__spinner" />
                                    Joining...
                                </>
                            ) : (
                                'Join Game'
                            )}
                        </button>
                    </form>
                </div>

                {/* Divider */}
                <div className="lobby-divider">
                    <span>OR</span>
                </div>

                {/* Host Game Card */}
                <div className="lobby-card lobby-card--host">
                    <div className="lobby-card__header">
                        <div className="lobby-card__icon lobby-card__icon--host">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </div>
                        <h2 className="lobby-card__title">Host Game</h2>
                        <p className="lobby-card__subtitle">Create a new game room</p>
                    </div>

                    <div className="lobby-card__form">
                        <div className="lobby-input-group">
                            <label htmlFor="display-name-host" className="lobby-input-group__label">
                                Host Name
                            </label>
                            <input
                                id="display-name-host"
                                type="text"
                                placeholder="Enter your name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="lobby-input"
                                autoComplete="name"
                            />
                        </div>

                        <button
                            type="button"
                            className="lobby-btn lobby-btn--secondary"
                            onClick={handleCreateGame}
                            disabled={isCreating || isConnecting}
                        >
                            {isCreating ? (
                                <>
                                    <span className="lobby-btn__spinner" />
                                    Creating...
                                </>
                            ) : (
                                'Create Game'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render waiting room view
    const renderWaitingView = () => (
        <div className="lobby-waiting">
            {/* Header with room code */}
            <header className="lobby-header">
                <div className="lobby-header__brand">
                    <span className="lobby-header__title">FAMILY FEUD</span>
                    <span className="lobby-header__phase">Lobby</span>
                </div>

                <div className="lobby-header__code" onClick={copyRoomCode} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && copyRoomCode()}>
                    <span className="lobby-header__code-label">ROOM CODE</span>
                    <span className="lobby-header__code-value">{roomCode || '------'}</span>
                    <span className={`lobby-header__code-copy ${codeCopied ? 'lobby-header__code-copy--copied' : ''}`}>
                        {codeCopied ? 'Copied!' : 'Click to copy'}
                    </span>
                </div>

                <div className="lobby-header__status">
                    <div className="lobby-header__players">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span>{totalPlayers} Player{totalPlayers !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="lobby-header__ready">
                        <span className="lobby-header__ready-count">{readyCount}/{totalPlayers}</span>
                        <span>Ready</span>
                    </div>
                </div>
            </header>

            {/* Teams Container */}
            <div className="lobby-teams">
                {/* Team 1 */}
                <div className={`lobby-team lobby-team--1 ${myPlayer?.teamId === 'team1' ? 'lobby-team--mine' : ''}`}>
                    <div className="lobby-team__header">
                        {isHost ? (
                            <input
                                type="text"
                                value={team1NameLocal ?? teams.team1?.name ?? 'Team 1'}
                                onChange={(e) => handleTeamNameChange('team1', e.target.value)}
                                className="lobby-team__name-input"
                                maxLength={20}
                            />
                        ) : (
                            <h3 className="lobby-team__name">{teams.team1?.name || 'Team 1'}</h3>
                        )}
                        <span className="lobby-team__count">{team1Players.length} players</span>
                    </div>

                    <ul className="lobby-team__players">
                        {team1Players.map((player, index) => (
                            <li
                                key={player.sessionId}
                                className={`lobby-player ${player.sessionId === myPlayer?.sessionId ? 'lobby-player--me' : ''}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="lobby-player__info">
                                    <span className="lobby-player__avatar">
                                        {player.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="lobby-player__name">{player.name}</span>
                                    {player.isHost && <span className="lobby-player__badge lobby-player__badge--host">HOST</span>}
                                    {player.sessionId === myPlayer?.sessionId && <span className="lobby-player__badge lobby-player__badge--you">YOU</span>}
                                </div>
                                <div className="lobby-player__status">
                                    {player.isReady && (
                                        <span className="lobby-player__ready">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        </span>
                                    )}
                                    {isHost && player.sessionId !== myPlayer?.sessionId && (
                                        <button
                                            className="lobby-player__kick"
                                            onClick={() => kickPlayer(player.sessionId)}
                                            aria-label={`Kick ${player.name}`}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"/>
                                                <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                        {team1Players.length === 0 && (
                            <li className="lobby-player lobby-player--empty">
                                <span>Waiting for players...</span>
                            </li>
                        )}
                    </ul>
                </div>

                {/* VS Badge */}
                <div className="lobby-vs">
                    <span>VS</span>
                </div>

                {/* Team 2 */}
                <div className={`lobby-team lobby-team--2 ${myPlayer?.teamId === 'team2' ? 'lobby-team--mine' : ''}`}>
                    <div className="lobby-team__header">
                        {isHost ? (
                            <input
                                type="text"
                                value={team2NameLocal ?? teams.team2?.name ?? 'Team 2'}
                                onChange={(e) => handleTeamNameChange('team2', e.target.value)}
                                className="lobby-team__name-input"
                                maxLength={20}
                            />
                        ) : (
                            <h3 className="lobby-team__name">{teams.team2?.name || 'Team 2'}</h3>
                        )}
                        <span className="lobby-team__count">{team2Players.length} players</span>
                    </div>

                    <ul className="lobby-team__players">
                        {team2Players.map((player, index) => (
                            <li
                                key={player.sessionId}
                                className={`lobby-player ${player.sessionId === myPlayer?.sessionId ? 'lobby-player--me' : ''}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="lobby-player__info">
                                    <span className="lobby-player__avatar">
                                        {player.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="lobby-player__name">{player.name}</span>
                                    {player.isHost && <span className="lobby-player__badge lobby-player__badge--host">HOST</span>}
                                    {player.sessionId === myPlayer?.sessionId && <span className="lobby-player__badge lobby-player__badge--you">YOU</span>}
                                </div>
                                <div className="lobby-player__status">
                                    {player.isReady && (
                                        <span className="lobby-player__ready">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        </span>
                                    )}
                                    {isHost && player.sessionId !== myPlayer?.sessionId && (
                                        <button
                                            className="lobby-player__kick"
                                            onClick={() => kickPlayer(player.sessionId)}
                                            aria-label={`Kick ${player.name}`}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"/>
                                                <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                        {team2Players.length === 0 && (
                            <li className="lobby-player lobby-player--empty">
                                <span>Waiting for players...</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Action Bar */}
            <footer className="lobby-actions">
                {isHost ? (
                    <>
                        <button
                            className="lobby-btn lobby-btn--shuffle"
                            onClick={shuffleTeams}
                            disabled={totalPlayers < 2}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="16 3 21 3 21 8"/>
                                <line x1="4" y1="20" x2="21" y2="3"/>
                                <polyline points="21 16 21 21 16 21"/>
                                <line x1="15" y1="15" x2="21" y2="21"/>
                                <line x1="4" y1="4" x2="9" y2="9"/>
                            </svg>
                            Shuffle Teams
                        </button>

                        <button
                            className="lobby-btn lobby-btn--start"
                            onClick={handleStartGame}
                            disabled={!canStart}
                        >
                            {canStart ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                    Start Game
                                </>
                            ) : (
                                'Need players on both teams'
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className={`lobby-btn ${myPlayer?.isReady ? 'lobby-btn--ready-active' : 'lobby-btn--ready'}`}
                            onClick={toggleReady}
                        >
                            {myPlayer?.isReady ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    Ready!
                                </>
                            ) : (
                                'Click when Ready'
                            )}
                        </button>

                        <button
                            className="lobby-btn lobby-btn--switch"
                            onClick={switchTeam}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="17 1 21 5 17 9"/>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                <polyline points="7 23 3 19 7 15"/>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                            </svg>
                            Switch Team
                        </button>
                    </>
                )}

                <button
                    className="lobby-btn lobby-btn--leave"
                    onClick={handleLeave}
                >
                    Leave Lobby
                </button>
            </footer>

            {/* Waiting message for non-hosts */}
            {!isHost && (
                <div className="lobby-waiting-msg">
                    <div className="lobby-waiting-msg__dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p>Waiting for host to start the game</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="game-lobby">
            <div className="game-lobby__bg">
                <div className="game-lobby__stars"></div>
                <div className="game-lobby__glow"></div>
            </div>
            <div className="game-lobby__content">
                {view === VIEW.JOIN ? renderJoinView() : renderWaitingView()}
            </div>
        </div>
    );
}
