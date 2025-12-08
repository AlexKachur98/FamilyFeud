/**
 * @file SignUp.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Registration screen for provisioning new host accounts.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../components/auth/AuthContext.js';

import PageSection from '../components/PageSection.jsx';
import logo from '/Family_Feud_Logo.png';

export default function SignUp() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = (data) => {
    if (!data.username.trim() || !data.email.trim() || !data.password || !data.confirmPassword) {
      return 'All Fields Must Be Completed.';
    }
    if (data.username.length < 3 || data.username.length > 30) {
      return 'Username Must Be Between 3 and 30 Characters.';
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return 'Invalid Email Address.';
    }
    if (data.password !== data.confirmPassword) {
      return 'Passwords Do Not Match.';
    }
    if (data.password.length < 6) {
      return 'Password Must Be At Least 6 Characters.';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm(formData);
    if (validationError) {
      setStatus({ state: 'error', message: validationError });
      return;
    }
    setStatus({ state: 'loading', message: 'Submitting access request…' });

    try {
      const { success, message } = await signUp(formData.username, formData.email, formData.password);

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
    <div className="game_theme">

      <div className="page page--auth">
        <header className="page__header">
          <p className="eyebrow">Account</p>
          <h2>Create Host Account</h2>
          <p>Request access to question management and live session tools.</p>
          <img src={logo} alt="Family Feud Logo" className='page__logo' />
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
                placeholder="FamilyFeud"
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
                placeholder="user@familyfeud.ca"
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
    </div>
  );
}
