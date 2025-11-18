/**
 * @file Home.jsx
 * @author Alex Kachur
 * @since 2025-11-05
 * @purpose Temporary full-screen landing with brand logo and primary CTAs.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext.js';

export default function Home() {
  const { isLoggedIn, signOut } = useAuth();

  return (
    <div className="landing-basic">
      <header className="landing-basic__chrome" />

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
              <Link to="/dashboard" className="landing-basic__cta landing-basic__cta--primary">
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
    </div>
  );
}
