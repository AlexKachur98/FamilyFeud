/**
 * @file Layout.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Provides shared chrome for host dashboard views including header navigation.
 */
import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, AUTH_NAV_ITEMS, HOME_NAV_ITEM } from '../utils/navigation.js';
import { useAuth } from '../components/auth/AuthContext.js';
import AdminDrawer from './AdminDrawer.jsx';

export default function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, isLoggedIn, isAdmin, isActualAdmin, viewAsUser, setViewAsUser } = useAuth();

  // Shared nav for all users.
  const navItems = [HOME_NAV_ITEM, ...NAV_ITEMS];
  const publicNavItems = [HOME_NAV_ITEM];

  // Reset nav action status on route change to avoid stale loading/error states.
  useEffect(() => {
    setStatus({ state: 'idle', message: '' });
    setAdminMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setStatus({ state: 'loading', message: '' });
    try {
      const { success, message } = await signOut();
      // setSignOutStatus('success'); // no point setting a status that wont be seen due to navigation.
      if (success) {
        navigate('/');
        setStatus({ state: 'idle', message: '' });
      }
      else 
        setStatus({ state: 'error', message: message || 'Checking credentials…' });
      
    } catch (error) {
      setStatus({ state: 'error', message: 'Failed to sign out' });
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
              {(isLoggedIn ? navItems : publicNavItems).map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className="app-nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <ul className="app-nav__list app-nav__list--auth">
              {!isLoggedIn ? AUTH_NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className="app-nav__link">
                    {item.label}
                  </NavLink>
                </li>
              )) : null}
              {isLoggedIn ? (
                <li>
                  <button
                    type="button"
                    className="app-nav__link app-nav__link--button"
                    onClick={handleSignOut}
                    disabled={status.state === 'loading'}
                  >
                    {status.state === 'loading' ? 'Signing Out…' : 'Sign Out'}
                  </button>
                </li>
              ) : null}
            </ul>
          </nav>
        </header>
      )}

      {isActualAdmin ? (
        <AdminDrawer
          open={adminMenuOpen}
          onToggle={() => setAdminMenuOpen((value) => !value)}
          onCommand={(cmd) => {
            if (cmd === 'toggle-view') {
              setViewAsUser((value) => !value);
            }
          }}
          links={[
            HOME_NAV_ITEM,
            ...NAV_ITEMS.map((link) => ({
              ...link,
              label: viewAsUser ? `${link.label} (User View)` : link.label
            })),
            { path: '/question-sets', label: 'Question Sets' },
            { path: '/session-create', label: 'Create Session' },
            { path: '#toggle-view', label: viewAsUser ? 'View as Admin' : 'View as User' }
          ]}
        />
      ) : null}

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
