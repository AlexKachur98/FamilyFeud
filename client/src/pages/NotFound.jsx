/**
 * @file NotFound.jsx
 * @author Alex Kachur
 * @since 2025-11-05
 * @purpose Renders a friendly 404 page for unknown routes.
 */
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Not Found</p>
        <h2>We couldn't find that page</h2>
        <p>The link may be broken or the page might have moved.</p>
      </header>

      <div>
        <Link to="/" className="menu-card__cta">Go Home</Link>
        <span> or </span>
        <Link to="/dashboard" className="menu-card__cta">Open Dashboard</Link>
      </div>
    </div>
  );
}

