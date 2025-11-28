/**
 * @file SignIn.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Authentication screen for hosts to access moderator tools.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../components/auth/AuthContext.js';

import PageSection from '../components/PageSection.jsx';
import Sidebar from '../components/Sidebar.jsx';
import logo from '/Family_Feud_Logo.png';

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const { signIn } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: 'loading', message: 'Checking credentials…' });
    try {
      const { success, message } = await signIn(formData.email, formData.password);

      if (success) navigate('/dashboard');
      else setStatus({ state: 'error', message: message || 'SignIn Error…' });
    }
    catch (error) {
      console.debug("SignIn: ", error)
      setStatus({ state: 'error', message: error });
    }
  };

  const isSubmitting = status.state === 'loading';

  return (
    <div className="game_theme">

      <Sidebar />
      <div className="page page--auth">
        <header className="page__header">
          <p className="eyebrow">Account</p>
          <h2>Sign In</h2>
          <img src={logo} alt="Family Feud Logo" className='page__logo' />
          {/* <p>Enter your credentials to unlock host controls.</p> */}
        </header>

        <PageSection title="Credentials" description="Accounts are provisioned by the production team.">
          <form className="form-stack" onSubmit={handleSubmit}>
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
    </div>
  );
}
