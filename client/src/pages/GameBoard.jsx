/**
 * @file GameBoard.jsx
 * @author Alex Kachur
 * @since 2025-11-11
 * @purpose Shows the board background, reusable nav, and a 2x4 table placeholder for answer cards.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRIMARY_NAV_LINKS } from '../utils/navigation.js';

const SLOT_COUNT = 8;
const QUESTION_TEXT = 'Name something people double-check before leaving the house.';
const TIMER_VALUE = 45;
const PLAYER_PLACEHOLDERS = [
  { label: 'Team A', avatar: '/Default_Avatar.jpg', scoreCard: '/Answer_Card_50.png' },
  { label: 'Team B', avatar: '/Default_Avatar.jpg', scoreCard: '/Answer_Card_50.png' },
];

const SAMPLE_SLOTS = [
  { rank: 1, answer: 'Lights off', points: 50, revealed: true },
  { rank: 2, answer: 'Doors locked', points: 40, revealed: true },
  { rank: 3, answer: 'Stove / oven', points: 30, revealed: true },
  { rank: 4, answer: 'Wallet or purse', points: 20, revealed: false },
  { rank: 5, answer: 'Car keys', points: 10, revealed: false },
  { rank: 6, answer: 'Phone', points: 5, revealed: false },
  { rank: 7, answer: 'Windows', points: 0, revealed: false },
  { rank: 8, answer: 'Pets', points: 0, revealed: false },
];

const HIDDEN_CARD_ASSETS = [
  '/Hidden_Card_1.png',
  '/Hidden_Card_2.png',
  '/Hidden_Card_3.png',
  '/Hidden_Card_4.png',
  '/Hidden_Card_5.png',
  '/Hidden_Card_6.png',
  '/Hidden_Card_7.png',
  '/Hidden_Card_8.png',
];

export default function GameBoard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

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
        <div className="game-board__stage">
          <img
            src="/Gameboard_Backround.jpg"
            alt="Family Feud stage backdrop"
            className="game-board__bg"
            loading="lazy"
          />

          <div className="game-board__content">
            <div
              className="game-board-question"
              aria-label="Question placeholder"
              style={{ backgroundImage: 'url(/Question_Card.png)' }}
            >
              <p className="game-board-question__text">{QUESTION_TEXT}</p>
            </div>

            <div
              className="game-board-timer"
              aria-label="Timer placeholder"
              style={{ backgroundImage: 'url(/Answer_Card_0.png)' }}
            >
              <span className="game-board-timer__value">{TIMER_VALUE}</span>
            </div>

            <div className="game-board-board">
              <section className="game-board-grid" aria-label="Answer card placeholders">
                {SAMPLE_SLOTS.map((slot, index) => {
                  const cardAsset = slot.revealed
                    ? `/Answer_Card_${slot.points}.png`
                    : HIDDEN_CARD_ASSETS[index] ?? '/Hidden_Card_Empty.png';
                  return (
                    <div
                      key={slot.rank}
                      className="game-board-grid__slot"
                      style={{ backgroundImage: `url(${cardAsset})` }}
                    >
                      {slot.revealed ? (
                        <div className="game-board-grid__slot-text">
                          <span className="game-board-grid__slot-rank">{slot.rank}</span>
                          <span className="game-board-grid__slot-answer">{slot.answer}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </section>

              <div className="game-board-sides" aria-label="Player placeholders">
                {PLAYER_PLACEHOLDERS.map((player) => (
                  <div className="game-board-player" key={player.label}>
                    <div
                      className="game-board-player__avatar"
                      style={{ backgroundImage: `url(${player.avatar})` }}
                    />
                    <div
                      className="game-board-player__score"
                      style={{ backgroundImage: `url(${player.scoreCard})` }}
                    >
                      <span>000</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="game-board-input" aria-label="Answer input placeholder">
              <span>Type your guess…</span>
            </div>
          </div>
        </div>
      </main>

      {menuOpen ? (
        <button
          type="button"
          className="landing-basic__backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}
      <nav
        id="gameboard-drawer"
        className={`landing-basic__drawer${menuOpen ? ' landing-basic__drawer--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="landing-basic__drawer-close"
          onClick={closeMenu}
          aria-label="Close menu"
        >
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
}
