/**
 * @file AdminDrawer.jsx
 * @author Alex Kachur
 * @since 2025-11-17
 * @purpose Reusable hamburger + drawer component (based on landing/game board pattern).
 */
import { Link } from 'react-router-dom';

export default function AdminDrawer({ open, onToggle, links, onCommand }) {
  return (
    <div
      className="landing-basic__chrome landing-basic__chrome--floating"
      style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 10000, pointerEvents: 'auto' }}
    >
      <button
        type="button"
        className="landing-basic__menu"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span />
        <span />
        <span />
      </button>
      {open ? (
        <>
          {/* Ensure the drawer stays interactive by keeping it rendered with pointer events while open. */}
          <button
            type="button"
            className="landing-basic__backdrop"
            aria-label="Close navigation"
            onClick={onToggle}
            style={{ zIndex: 9998, pointerEvents: 'auto' }}
          />
          <nav
            className={"landing-basic__drawer" + (open ? " landing-basic__drawer--open" : "")}
            aria-hidden={!open}
            style={{ zIndex: 9999, pointerEvents: 'auto' }}
          >
              <button type="button" className="landing-basic__drawer-close" onClick={onToggle} aria-label="Close menu">
                ×
              </button>
              <ul className="landing-basic__drawer-list">
                {links.map((link) => (
                  <li key={link.path}>
                    {link.path === '#toggle-view' ? (
                      <button type="button" className="link-button" onClick={() => { onToggle(); onCommand?.('toggle-view'); }}>
                        {link.label}
                      </button>
                    ) : (
                      <Link to={link.path} onClick={onToggle}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </>
      ) : null}
    </div>
  );
}
