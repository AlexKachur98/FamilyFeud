/**
 * @file Sidebar.jsx
 * @author Pierre Moreau
 * @since 2025-11-26
 * @purpose Sidebar component for navigation and additional options.
*/
import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

import { PRIMARY_ADMIN_NAV_LINKS, PRIMARY_AUTH_NAV_LINKS, PRIMARY_USER_NAV_LINKS } from "../utils/navigation";
import { useAuth } from "./auth/AuthContext";
import { useGame } from "../context/game.context";

import profileIcon from '../assets/Icon.png';

export default function Sidebar() {

    const { user, signOut } = useAuth();
    const location = useLocation();
    const {
        isConnected,
        phase,
        isHost,
        // Admin game control actions (only for Fast Money and game flow)
        revealAnswer,
        startFastMoney,
        startFastMoneyTimer,
        nextFastMoneyQuestion,
        endFastMoney,
        playAgain,
        endGame,
        // Game state for controls
        answers,
        currentRound,
        fastMoney,
        fastMoneyAnswers,
        awaitingPlayOrPass
    } = useGame();

    const navigate = useNavigate();

    // Check if we're in a game view
    const isInGame = isConnected && (location.pathname === '/player-view' || location.pathname === '/game-board' || location.pathname === '/lobby');
    
    const [menuOpen, setMenuOpen] = useState(true);
    const [adminOpen, setAdminOpen] = useState(true);
    const [hostOpen, setHostOpen] = useState(true);
    const [gameControlsOpen, setGameControlsOpen] = useState(true);

    const toggleMenu = () => {
        const toggle = !menuOpen;
        const drawer = document.getElementById("landing-drawer");

        if (toggle) {
            drawer.removeAttribute("inert");
            drawer.setAttribute("aria-hidden", "false");
            drawer.querySelector(".landing-basic__drawer-close").focus();
        } else {
            drawer.setAttribute("inert", "");
            drawer.setAttribute("aria-hidden", "true");
        }

        setMenuOpen(toggle);
    }

    const closeMenu = () => {
        const drawer = document.getElementById("landing-drawer");

        drawer.setAttribute("inert", "");
        drawer.setAttribute("aria-hidden", "true");

        setMenuOpen(false);
    }

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    }

    return (
        <>
            <header className="landing-basic__chrome">
                <div
                    type="button"
                    className="landing-basic__menu"
                    aria-label="Open navigation"
                    aria-controls="landing-drawer"
                    aria-expanded={menuOpen}
                    onClick={toggleMenu}
                >
                    <span />
                    <span />
                    <span />
                </div>
            </header>

            {/* Simple slide-out drawer for quick navigation while on the landing view. */}
            {menuOpen ? <button className="landing-basic__backdrop" aria-label="Close menu" onClick={closeMenu} /> : null}
            <nav
                id="landing-drawer"
                className={"landing-basic__drawer" + (menuOpen ? " landing-basic__drawer--open" : "")}
            >
                <button type="button" className="landing-basic__drawer-close" onClick={closeMenu} aria-label="Close menu">
                    ×
                </button>
                <ul className="landing-basic__drawer-list">
                    {
                        !user 
                        ? PRIMARY_AUTH_NAV_LINKS.map(link => (
                                <li key={link.path}
                                    className={(window.location.pathname === link.path || window.location.pathname.startsWith(link.path + '/')) ? "landing-basic__drawer-item landing-basic__drawer-item--active" : "landing-basic__drawer-item"}
                                    aria-current={(window.location.pathname === link.path || window.location.pathname.startsWith(link.path + '/')) ? "page" : undefined}
                                >
                                    <Link to={link.path}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))
                        : <>
                            <li>
                                <img src={typeof user.image === 'string' ? user.image : profileIcon} alt={`${user.username}'s profile`} className="landing-basic__drawer-profile-avatar" />
                            </li>
                            <li>
                                <h2 className="landing-basic__drawer-profile-username">{user.username}</h2>
                            </li>
                            {
                                PRIMARY_USER_NAV_LINKS.map(link => (
                                    <li key={link.path}
                                        className={(window.location.pathname === link.path || window.location.pathname.startsWith(link.path + '/')) ? "landing-basic__drawer-item landing-basic__drawer-item--active" : "landing-basic__drawer-item"}
                                        aria-current={(window.location.pathname === link.path || window.location.pathname.startsWith(link.path + '/')) ? "page" : undefined}
                                    >
                                        <Link to={link.path}>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))
                            }
                            {/* Collapsible Admin Section */}
                            {user?.admin && (
                                <li className="drawer-section">
                                    <button
                                        type="button"
                                        className="drawer-section__toggle"
                                        onClick={() => setAdminOpen(!adminOpen)}
                                    >
                                        Admin
                                        <span className={`drawer-section__toggle-icon ${adminOpen ? 'drawer-section__toggle-icon--open' : ''}`}>▼</span>
                                    </button>
                                    <div className={`drawer-section__content ${adminOpen ? 'drawer-section__content--open' : ''}`}>
                                        <ul className="drawer-section__list">
                                            {PRIMARY_ADMIN_NAV_LINKS.map(link => (
                                                <li key={link.path}
                                                    className={(window.location.pathname === link.path || window.location.pathname.startsWith(link.path + '/')) ? "landing-basic__drawer-item landing-basic__drawer-item--active" : "landing-basic__drawer-item"}
                                                    aria-current={(window.location.pathname === link.path || window.location.pathname.startsWith(link.path + '/')) ? "page" : undefined}
                                                >
                                                    <Link to={link.path}>{link.label}</Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>
                            )}

                            {/* Collapsible Game Controls Section - Admin only */}
                            {user?.admin && isInGame && phase && phase !== 'lobby' && (
                                <li className="drawer-section">
                                    <button
                                        type="button"
                                        className="drawer-section__toggle"
                                        onClick={() => setGameControlsOpen(!gameControlsOpen)}
                                    >
                                        Game Controls
                                        <span className={`drawer-section__toggle-icon ${gameControlsOpen ? 'drawer-section__toggle-icon--open' : ''}`}>▼</span>
                                    </button>
                                    <div className={`drawer-section__content ${gameControlsOpen ? 'drawer-section__content--open' : ''}`}>
                                        <ul className="drawer-section__list">
                                            {/* Play or Pass - now handled by the winning player, not admin */}
                                            {awaitingPlayOrPass && (
                                                <li className="landing-basic__drawer-item">
                                                    <span className="game-controls__info">Waiting for winning team to choose PLAY or PASS...</span>
                                                </li>
                                            )}
                                            {/* Game status during play - strikes and answers are automatic */}
                                            {(phase === 'play' || phase === 'steal') && (
                                                <li className="landing-basic__drawer-item">
                                                    <span className="game-controls__info">
                                                        {phase === 'play' ? 'Players answering... (strikes are automatic)' : 'Steal attempt in progress...'}
                                                    </span>
                                                </li>
                                            )}
                                            {/* Round End Controls */}
                                            {phase === 'roundEnd' && (
                                                <>
                                                    {/* Reveal remaining answers (like on TV show) */}
                                                    {answers && answers.some(a => !a.revealed) && (
                                                        <li className="landing-basic__drawer-item">
                                                            <div className="game-controls__section">
                                                                <span className="game-controls__label">Reveal Remaining:</span>
                                                                <div className="game-controls__buttons">
                                                                    {answers.map((answer, idx) => (
                                                                        !answer.revealed && (
                                                                            <button key={idx} type="button" className="game-controls__btn" onClick={() => revealAnswer(idx)} title={`Reveal #${idx + 1}`}>{idx + 1}</button>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    )}
                                                    <li className="landing-basic__drawer-item">
                                                        <span className="game-controls__info">
                                                            {currentRound >= 4 ? 'Game ending...' : 'Next round starting in 5 seconds...'}
                                                        </span>
                                                    </li>
                                                    {currentRound >= 3 && (
                                                        <li className="landing-basic__drawer-item">
                                                            <button type="button" className="game-controls__action game-controls__action--special" onClick={startFastMoney}>Start Fast Money Instead</button>
                                                        </li>
                                                    )}
                                                </>
                                            )}
                                            {/* Fast Money Controls */}
                                            {phase === 'fastMoney' && (
                                                <>
                                                    {!fastMoney?.player1Id && (<li className="landing-basic__drawer-item"><span className="game-controls__info">Select FM players in game view</span></li>)}
                                                    {fastMoney?.player1Id && fastMoney?.currentPlayer === 1 && (!fastMoneyAnswers?.player1 || fastMoneyAnswers.player1.length === 0) && (
                                                        <li className="landing-basic__drawer-item"><button type="button" className="game-controls__action game-controls__action--primary" onClick={startFastMoneyTimer}>Start P1 Timer (20s)</button></li>
                                                    )}
                                                    {fastMoney?.currentPlayer === 1 && fastMoneyAnswers?.player1?.length >= 5 && (
                                                        <li className="landing-basic__drawer-item"><button type="button" className="game-controls__action" onClick={nextFastMoneyQuestion}>Switch to Player 2</button></li>
                                                    )}
                                                    {fastMoney?.currentPlayer === 2 && (!fastMoneyAnswers?.player2 || fastMoneyAnswers.player2.length === 0) && (
                                                        <li className="landing-basic__drawer-item"><button type="button" className="game-controls__action game-controls__action--primary" onClick={startFastMoneyTimer}>Start P2 Timer (25s)</button></li>
                                                    )}
                                                    {fastMoney?.currentPlayer === 2 && fastMoneyAnswers?.player2?.length >= 5 && (
                                                        <li className="landing-basic__drawer-item"><button type="button" className="game-controls__action game-controls__action--special" onClick={endFastMoney}>End Fast Money</button></li>
                                                    )}
                                                </>
                                            )}
                                            {/* Game Over Controls */}
                                            {phase === 'gameOver' && (
                                                <>
                                                    <li className="landing-basic__drawer-item"><button type="button" className="game-controls__action game-controls__action--primary" onClick={playAgain}>Play Again</button></li>
                                                    <li className="landing-basic__drawer-item"><button type="button" className="game-controls__action game-controls__action--danger" onClick={() => { endGame(); navigate('/lobby'); }}>End Game Session</button></li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </li>
                            )}

                            {/* Collapsible Host Options Section */}
                            {isInGame && isHost && (
                                <li className="drawer-section">
                                    <button
                                        type="button"
                                        className="drawer-section__toggle"
                                        onClick={() => setHostOpen(!hostOpen)}
                                    >
                                        Host Options
                                        <span className={`drawer-section__toggle-icon ${hostOpen ? 'drawer-section__toggle-icon--open' : ''}`}>▼</span>
                                    </button>
                                    <div className={`drawer-section__content ${hostOpen ? 'drawer-section__content--open' : ''}`}>
                                        <ul className="drawer-section__list">
                                            <li className="landing-basic__drawer-item">
                                                <button type="button" className="game-controls__action game-controls__action--danger" onClick={() => { endGame(); navigate('/'); }}>Cancel Game</button>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            )}
                            <li>
                                <button type="button" className="primary-button" onClick={handleSignOut}>
                                    Sign Out
                                </button>
                            </li>
                        </>
                    }
                </ul>
            </nav>

            <main>
                <Outlet />
            </main>
        </>
    );
}
