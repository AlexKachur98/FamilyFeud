/**
 * @file Layout.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Provides shared chrome for host dashboard views including header navigation.
 */

import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NAV_USER_ITEMS, AUTH_NAV_ITEMS, HOME_NAV_ITEM, NAV_ADMIN_ITEMS } from '../utils/navigation.js';
import { useAuth } from '../components/auth/AuthContext.js';

import Loader from '../components/loader/loader.jsx';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();
  const { signOut, isLoading, isLoggedIn } = useAuth();

  const handleSignOut = async () => {
    setStatus('loading');
    try {
      const { success, message } = await signOut();
      // setSignOutStatus('success'); // no point setting a status that wont be seen due to navigation.
      if (success) navigate('/signed-out');
      else setStatus({ state: 'error', message: message || 'Checking credentials…' });

    } catch (error) {
      setStatus('error');
      console.error('Failed to sign out', error);
    }
  };

  return isLoading ? (
    <Loader />
  ) : (
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
              {(user?.admin ? [HOME_NAV_ITEM, ...NAV_USER_ITEMS, ...NAV_ADMIN_ITEMS] : [HOME_NAV_ITEM, ...NAV_USER_ITEMS]).map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className="app-nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <ul className="app-nav__list app-nav__list--auth">

              {!isLoggedIn && AUTH_NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className="app-nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}

              {isLoggedIn && <li>
                <button
                  type="button"
                  className="app-nav__link app-nav__link--button"
                  onClick={handleSignOut}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Signing Out…' : 'Sign Out'}
                </button>
              </li>}
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
