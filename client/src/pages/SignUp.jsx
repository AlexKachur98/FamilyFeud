/**
 * @file SignUp.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Registration screen for provisioning new host accounts.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { useAuth } from '../components/auth/AuthContext.js';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
  // role: 'host'
};

export default function SignUp() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setStatus({ state: 'error', message: 'Passwords must match before submitting.' });
      return;
    };

    setStatus({ state: 'loading', message: 'Submitting access request…' });

    try {
      const { success, message } = await signUp({
        name: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (!success) {
        throw new Error(message || 'Registration failed');
      };

      setStatus({ state: 'success', message: /*`${payload?.name ?? 'New host'}*/ "registered." /*Await approval email.` */ });
      // setFormData(INITIAL_FORM);
      navigate('/');

      // TODO (Backend Team): include onboarding status (pending/approved) in response to guide UI confirmation.

    }
    catch (error) {
      setStatus({ state: 'error', message: error.message });
    };
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
            Username
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Alex_Kachur"
              autoComplete="username"
              required
              disabled={isSubmitting}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
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
              value={formData.password}
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
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
          </label>
          {/* <label className="form-grid__full">
            Role Request
            <select name="role" value={formData.role} onChange={handleChange} disabled={isSubmitting}>
              <option value="host">Host</option>
              <option value="producer">Producer</option>
            </select>
          </label> */}

          {/* TODO (Backend Team): confirm whether producer should map to admin=true or a dedicated role collection. */}

          {/* I think this is better as gamesession setup logic?  */}

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
