/**
 * @file Home.jsx
 * @author Alex Kachur
 * @since 2025-11-05
 * @purpose Temporary full-screen landing with brand logo and primary CTAs.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-basic">
      <header className="landing-basic__chrome">
        <button
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
        </button>
      </header>

      <main className="landing-basic__body">
        <img
          src="/Family_Feud_Logo.png"
          alt="Family Feud Logo"
          className="landing-basic__logo-img"
        />

        <div className="landing-basic__actions">
          <Link to="/signin" className="landing-basic__cta landing-basic__cta--secondary">
            Sign In
          </Link>
          <Link to="/player" className="landing-basic__cta landing-basic__cta--primary">
            Play
          </Link>
        </div>
        {/* TODO (Frontend): route Play to an active lobby or new-session wizard when sessions API lands. */}
      </main>

      {/* Simple slide-out drawer for quick navigation while on the landing view. */}
      {/* TODO (Frontend): read links from PRIMARY_NAV_LINKS to avoid duplicating routes here. */}
      {menuOpen ? <button className="landing-basic__backdrop" aria-label="Close menu" onClick={closeMenu} /> : null}
      <nav
        id="landing-drawer"
        className={"landing-basic__drawer" + (menuOpen ? " landing-basic__drawer--open" : "")}
        aria-hidden={!menuOpen}
      >
        <button type="button" className="landing-basic__drawer-close" onClick={closeMenu} aria-label="Close menu">
          ×
        </button>
        <ul className="landing-basic__drawer-list">
          <li><Link to="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
          <li><Link to="/question-sets" onClick={closeMenu}>Question Sets</Link></li>
          <li><Link to="/sessions" onClick={closeMenu}>Sessions</Link></li>
          <li><Link to="/player" onClick={closeMenu}>Join Game</Link></li>
          <li><Link to="/signin" onClick={closeMenu}>Sign In</Link></li>
          <li><Link to="/signup" onClick={closeMenu}>Register</Link></li>
        </ul>
      </nav>
    </div>
  );
}
