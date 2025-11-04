/**
 * @file Layout.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Provides shared chrome for host dashboard views including header navigation.
 */
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { NAV_ITEMS, AUTH_NAV_ITEMS } from '../utils/navigation.js';
import { signOut } from '../utils/authClient.js';

export default function Layout() {
  const [signOutStatus, setSignOutStatus] = useState('idle');

  const handleSignOut = async () => {
    setSignOutStatus('loading');
    try {
      await signOut();
      setSignOutStatus('success');
      // TODO (Backend Team): expose session invalidate confirmation so we can update client-side auth state.
    } catch (error) {
      setSignOutStatus('error');
      console.error('Failed to sign out', error);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <img src="/Family_Feud_Logo.png" alt="Family Feud" className="app-header__logo" />
          <div>
            <h1 className="app-header__title">Family Feud Control Center</h1>
            <p className="app-header__subtitle">Coordinate surveys, sessions, and live gameplay.</p>
          </div>
        </div>

        <nav className="app-nav">
          <ul className="app-nav__list">
            {NAV_ITEMS.map((item) => (
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
          </ul>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
