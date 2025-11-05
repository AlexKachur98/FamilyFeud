/**
 * @file SignIn.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Authentication screen for hosts to access moderator tools.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { signIn } from '../utils/authClient.js';

const INITIAL_FORM = {
  email: '',
  password: '',
};

export default function SignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: 'loading', message: 'Checking credentials…' });

    try {
      const result = await signIn(form);
      setStatus({ state: 'success', message: result.message });
      setForm(INITIAL_FORM);
      // TODO (Backend Team): expose host role + permissions so we can route users appropriately post-auth.
      // TODO (Frontend): persist authenticated user in shared state/store once backend role data is available.
    } catch (error) {
      setStatus({ state: 'error', message: error.message });
    }
  };

  const isSubmitting = status.state === 'loading';

  return (
    <div className="page page--auth">
      <header className="page__header">
        <p className="eyebrow">Account</p>
        <h2>Sign In</h2>
        <p>Enter your credentials to unlock host controls.</p>
      </header>

      <PageSection title="Credentials" description="Accounts are provisioned by the production team.">
        <form className="form-stack" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In…' : 'Sign In'}
            </button>
            <button
              type="button"
              className="link-button"
              disabled={isSubmitting}
              onClick={() => navigate('/under-construction')}
            >
              Forgot Password
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
