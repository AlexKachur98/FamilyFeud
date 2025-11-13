/**
 * @file Home.jsx
 * @author Alex Kachur
 * @since 2025-11-05
 * @purpose Temporary full-screen landing with brand logo and primary CTAs.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRIMARY_NAV_LINKS } from '../utils/navigation';
import { useAuth } from '../components/auth/AuthContext.js';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, signOut, user } = useAuth();
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
        {/* Switched play button and sign-in button for better UX flow. Completed by Kelly Burden - Nov 2025 */}
        <div className="landing-basic__actions">
          {isLoggedIn ? (
            <>
              <Link to="/sessions" className="landing-basic__cta landing-basic__cta--primary">
                Play
              </Link>
              <button onClick={async () => await signOut()} className="landing-basic__cta landing-basic__cta--secondary">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="landing-basic__cta landing-basic__cta--secondary">
                Sign In
              </Link>

              {/* Put new register link under sign-in for better UX flow. Completed by Kelly Burden - Nov 2025 */}
              <Link to="/signup" className="landing-basic__register-link">
                New User? Click here to register
              </Link>
            </>
          )}
        </div>
        {/* TODO (Frontend): route Play to an active lobby or new-session wizard when sessions API lands. 
        COMPLETED: Routed play button to /sessions (active sessions page). Completed by Kelly Burden - Nov 2025*/}
      </main>

      {/* Simple slide-out drawer for quick navigation while on the landing view. */}
      {/* TODO (Frontend): read links from PRIMARY_NAV_LINKS to avoid duplicating routes here. 
      COMPLETED: Implemented dynamic navigation links from PRIMARY_NAV_LINKS. Completed by Kelly Burden - Nov 2025 */}
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
          {PRIMARY_NAV_LINKS.map(link => (
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
