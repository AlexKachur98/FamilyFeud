/**
 * @file SignIn.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Authentication screen for hosts to access moderator tools.
 */
import PageSection from '../components/PageSection.jsx';

export default function SignIn() {
  return (
    <div className="page page--auth">
      <header className="page__header">
        <p className="eyebrow">Account</p>
        <h2>Sign In</h2>
        <p>Enter your credentials to unlock host controls.</p>
      </header>

      <PageSection title="Credentials" description="Accounts are provisioned by the production team.">
        <form className="form-stack">
          <label>
            Email
            <input type="email" placeholder="alex@familyfeud.ca" />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" />
          </label>
          <div className="form-actions">
            <button type="submit">Sign In</button>
            <button type="button" className="link-button">Forgot Password</button>
          </div>
          {/* TODO (Backend Team): integrate with POST /auth/signin and persist JWT cookie. */}
        </form>
      </PageSection>
    </div>
  );
}
