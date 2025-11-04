/**
 * @file PageSection.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Lightweight wrapper for grouping related page content.
 */
export default function PageSection({ title, description, children, actions }) {
  return (
    <section className="page-section">
      <header className="page-section__header">
        <div>
          <h3>{title}</h3>
          {description ? <p className="page-section__description">{description}</p> : null}
        </div>
        {actions ? <div className="page-section__actions">{actions}</div> : null}
      </header>
      <div className="page-section__body">
        {children}
      </div>
    </section>
  );
}
