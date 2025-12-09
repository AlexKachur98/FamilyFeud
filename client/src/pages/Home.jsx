/**
 * @file Home.jsx
 * @author Alex Kachur
 * @since 2025-11-05
 * @purpose Temporary full-screen landing with brand logo and primary CTAs.
 */
import { Link } from 'react-router-dom';

import { useAuth } from '../components/auth/AuthContext.js';

export default function Home() {
  const { isLoggedIn, signOut, user } = useAuth();

  return (
    <div className="game_theme">
      <div className="landing-basic">
        <main className="landing-basic__body">
          <img
            src="/Family_Feud_Logo.png"
            alt="Family Feud Logo"
            className="landing-basic__logo-img"
          />

          <div className="landing-basic__actions">
            {isLoggedIn ? (
              <>
                <Link to="/leaderboard" className="landing-basic__cta landing-basic__cta--primary">
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
                <Link to="/signup" className="landing-basic__register-link">
                  New User? Click here to register
                </Link>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
