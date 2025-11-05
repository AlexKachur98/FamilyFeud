/**
 * @file SignedOut.jsx
 * @author Alex Kachur
 * @since 2025-11-05
 * @purpose Confirms sign-out for users leaving authenticated sections.
 */
import { Link } from 'react-router-dom';

export default function SignedOut() {
  return (
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Signed Out</p>
        <h2>You are now signed out</h2>
        <p>Come back anytime to host or play Family Feud.</p>
      </header>

      <div className="action-grid">
        <Link to="/signin" className="menu-card__cta">Sign In</Link>
        <Link to="/" className="menu-card__cta">Go Home</Link>
      </div>
    </div>
  );
}

