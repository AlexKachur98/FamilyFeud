/**
 * @file SignUp.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Registration screen for provisioning new host accounts.
 */
import { useState } from 'react';
import PageSection from '../components/PageSection.jsx';
import { registerUser } from '../utils/authClient.js';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'host',
};

export default function SignUp() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setStatus({ state: 'error', message: 'Passwords must match before submitting.' });
      return;
    }

    setStatus({ state: 'loading', message: 'Submitting access request…' });

    try {
      const payload = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        admin: form.role === 'producer',
      });
      setStatus({ state: 'success', message: `${payload?.name ?? 'New host'} registered. Await approval email.` });
      setForm(INITIAL_FORM);
      // TODO (Backend Team): include onboarding status (pending/approved) in response to guide UI confirmation.
    } catch (error) {
      setStatus({ state: 'error', message: error.message });
    }
  };

  const isSubmitting = status.state === 'loading';

  return (
    <div className="page page--auth">
      <header className="page__header">
        <p className="eyebrow">Account</p>
        <h2>Create Host Account</h2>
        <p>Request access to question management and live session tools.</p>
      </header>

      <PageSection title="Host Details" description="Accounts require approval before they go live.">
        <form className="form-grid form-grid--vertical" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Alex Kachur"
              autoComplete="name"
              required
              disabled={isSubmitting}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="alex@familyfeud.ca"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
          </label>
          <label className="form-grid__full">
            Role Request
            <select name="role" value={form.role} onChange={handleChange} disabled={isSubmitting}>
              <option value="host">Host</option>
              <option value="producer">Producer</option>
            </select>
          </label>
          {/* TODO (Backend Team): confirm whether producer should map to admin=true or a dedicated role collection. */}
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Submit Request'}
            </button>
          </div>
          {status.state !== 'idle' ? (
            <p
              className={`form-status ${status.state === 'error' ? 'form-status--error' : 'form-status--success'}`}
              role="status"
            >
              {status.message}
            </p>
          ) : null}
        </form>
      </PageSection>
    </div>
  );
}
