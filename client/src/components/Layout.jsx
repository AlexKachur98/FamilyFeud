/**
 * @file Layout.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Provides shared chrome for host dashboard views including header navigation.
 */
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, AUTH_NAV_ITEMS, HOME_NAV_ITEM } from '../utils/navigation.js';
import { signOut } from '../utils/authClient.js';

export default function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [signOutStatus, setSignOutStatus] = useState('idle');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setSignOutStatus('loading');
    try {
      await signOut();
      setSignOutStatus('success');
      // TODO (Backend Team): expose session invalidate confirmation so we can update client-side auth state.
      navigate('/signed-out');
    } catch (error) {
      setSignOutStatus('error');
      console.error('Failed to sign out', error);
    }
  };

  return (
    <div className={`app-shell${isLanding ? ' app-shell--landing' : ''}`}>
      {isLanding ? null : (
      <header className="app-header">
        <div className="app-header__brand">
          <Link to="/" className="app-header__brand-link" aria-label="Go to Home">
            <img src="/Family_Feud_Logo.png" alt="Family Feud" className="app-header__logo" />
          </Link>
          <div>
            <h1 className="app-header__title">Family Feud Control Center</h1>
            <p className="app-header__subtitle">Coordinate surveys, sessions, and live gameplay.</p>
          </div>
        </div>

        <nav className="app-nav">
          <ul className="app-nav__list">
            {[HOME_NAV_ITEM, ...NAV_ITEMS].map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className="app-nav__link">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <ul className="app-nav__list app-nav__list--auth">
            {AUTH_NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className="app-nav__link">
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="app-nav__link app-nav__link--button"
                onClick={handleSignOut}
                disabled={signOutStatus === 'loading'}
              >
                {signOutStatus === 'loading' ? 'Signing Out…' : 'Sign Out'}
              </button>
            </li>
            {/* TODO (Frontend): replace temporary sign-out button with auth-aware user menu. */}
          </ul>
        </nav>
      </header>
      )}

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
