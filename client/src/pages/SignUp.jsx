/**
 * @file SignUp.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Registration screen for provisioning new host accounts.
 */
import PageSection from '../components/PageSection.jsx';

export default function SignUp() {
  return (
    <div className="page page--auth">
      <header className="page__header">
        <p className="eyebrow">Account</p>
        <h2>Create Host Account</h2>
        <p>Request access to question management and live session tools.</p>
      </header>

      <PageSection title="Host Details" description="Accounts require approval before they go live.">
        <form className="form-grid form-grid--vertical">
          <label>
            Full Name
            <input type="text" placeholder="Alex Kachur" />
          </label>
          <label>
            Email
            <input type="email" placeholder="alex@familyfeud.ca" />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" />
          </label>
          <label>
            Confirm Password
            <input type="password" placeholder="••••••••" />
          </label>
          <label className="form-grid__full">
            Role Request
            <select defaultValue="host">
              <option value="host">Host</option>
              <option value="producer">Producer</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="submit">Submit Request</button>
          </div>
          {/* TODO (Backend Team): integrate with POST /auth/signup and surface validation errors. */}
        </form>
      </PageSection>
    </div>
  );
}
