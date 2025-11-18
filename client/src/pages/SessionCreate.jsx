/**
 * @file SessionCreate.jsx
 * @author Alex Kachur
 * @since 2025-11-17
 * @purpose Create new multiplayer sessions with defaults, timers, and optional saved settings.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { apiFetch, sessions } from '../utils/api.js';
import { useAuth } from '../components/auth/AuthContext.js';

const generateId = () => `sess-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

export default function SessionCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questionSets, setQuestionSets] = useState([]);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [formData, setFormData] = useState({
    hostName: user?.username || 'Host',
    questionSetId: 'default',
    accessCode: generateCode(),
    id: generateId()
  });
  const [settings, setSettings] = useState({
    fastMoney: true,
    useTimers: true,
    timerFaceoffBuzz: 12,
    timerFaceoffAnswer: 12,
    timerPlayGuess: 12,
    timerSteal: 12,
    mode: 'classic', // classic = round bucket flow, random = fully random questions
    enableDoubleTriple: true,
    randomizeRoundOrder: false,
    saveAsDefault: false
  });

  useEffect(() => {
    const loadSets = async () => {
      try {
        const res = await apiFetch('/question-sets', { method: 'GET' });
        if (!res.ok) throw new Error('Failed to load question sets');
        const data = await res.json();
        setQuestionSets(data);
        if (data.length && formData.questionSetId === 'default') {
          setFormData((prev) => ({ ...prev, questionSetId: 'default' }));
        }
      } catch (err) {
        setStatus({ state: 'error', message: err.message });
      }
    };
    loadSets();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'hostName' || name === 'id') return; // non-editable fields
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (event) => {
    const { name, type, checked, value } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(nextValue) || 0 : nextValue
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: 'loading', message: 'Creating session…' });
    try {
      const payload = {
        id: formData.id || generateId(),
        hostName: user?.username || formData.hostName || 'Host',
        accessCode: formData.accessCode || generateCode(),
        questionSetId: formData.questionSetId === 'default' ? undefined : formData.questionSetId,
        teams: [],
        settings
      };
      const res = await sessions.create(payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create session');
      }
      // TODO: save settings per user when backend supports it (e.g., /api/v1/user/:id/settings)
      setStatus({ state: 'success', message: 'Session created' });
      navigate('/sessions');
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  return (
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Sessions</p>
        <h2>Create Session</h2>
        <p>Generate an access code and pick a question set for your multiplayer lobby.</p>
      </header>

      {status.state !== 'idle' ? (
        <div className={`notification ${status.state === 'error' ? 'notification--error' : 'notification--success'}`}>
          {status.message}
        </div>
      ) : null}

      <PageSection title="Session Details" description="Set host info, question set, and access code.">
        <form className="form-grid form-grid--vertical" onSubmit={handleSubmit}>
          <label>
            Host Name (assigned)
            <input
              type="text"
              name="hostName"
              value={user?.username || formData.hostName}
              readOnly
              disabled
            />
          </label>

          <label>
            Question Set
            <select
              name="questionSetId"
              value={formData.questionSetId}
              onChange={handleChange}
              required
            >
              <option value="default">Default Question Set</option>
              {questionSets.map((set) => (
                <option key={set._id || set.id} value={set._id || set.id}>
                  {set.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Session ID (assigned)
            <input
              type="text"
              name="id"
              value={formData.id}
              readOnly
              disabled
            />
          </label>

          <label>
            Access Code
            <input
              type="text"
              name="accessCode"
              value={formData.accessCode}
              onChange={handleChange}
              required
              placeholder="6-digit code"
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="secondary-button" disabled={status.state === 'loading'}>
              {status.state === 'loading' ? 'Creating…' : 'Create Session'}
            </button>
          </div>
        </form>
      </PageSection>

      <PageSection title="Game Settings" description="Configure timers, round style, and fast money before you start.">
        <div className="form-grid form-grid--vertical">
          <div className="form-grid form-grid--two">
            <label>
              Mode
              <select name="mode" value={settings.mode} onChange={handleSettingsChange}>
                <option value="classic">Classic (round buckets)</option>
                <option value="random">Full random questions</option>
              </select>
            </label>
            <label>
              Include Fast Money
              <input
                type="checkbox"
                name="fastMoney"
                checked={settings.fastMoney}
                onChange={handleSettingsChange}
              />
            </label>
            <label>
              Enable Double/Triple Rounds
              <input
                type="checkbox"
                name="enableDoubleTriple"
                checked={settings.enableDoubleTriple}
                onChange={handleSettingsChange}
              />
            </label>
            <label>
              Randomize Round Order
              <input
                type="checkbox"
                name="randomizeRoundOrder"
                checked={settings.randomizeRoundOrder}
                onChange={handleSettingsChange}
              />
            </label>
            <label>
              Use Timers
              <input
                type="checkbox"
                name="useTimers"
                checked={settings.useTimers}
                onChange={handleSettingsChange}
              />
            </label>
          </div>

          <div className={`form-grid form-grid--two${!settings.useTimers ? ' is-disabled' : ''}`}>
            <label>
              Faceoff Buzz (sec)
              <input
                type="number"
                name="timerFaceoffBuzz"
                value={settings.timerFaceoffBuzz}
                onChange={handleSettingsChange}
                min="1"
                disabled={!settings.useTimers}
              />
            </label>
            <label>
              Faceoff Answer (sec)
              <input
                type="number"
                name="timerFaceoffAnswer"
                value={settings.timerFaceoffAnswer}
                onChange={handleSettingsChange}
                min="1"
                disabled={!settings.useTimers}
              />
            </label>
            <label>
              Play Guess (sec)
              <input
                type="number"
                name="timerPlayGuess"
                value={settings.timerPlayGuess}
                onChange={handleSettingsChange}
                min="1"
                disabled={!settings.useTimers}
              />
            </label>
            <label>
              Steal (sec)
              <input
                type="number"
                name="timerSteal"
                value={settings.timerSteal}
                onChange={handleSettingsChange}
                min="1"
                disabled={!settings.useTimers}
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className={`secondary-button${settings.saveAsDefault ? ' is-active' : ''}`}
              onClick={() => setSettings((prev) => ({ ...prev, saveAsDefault: !prev.saveAsDefault }))}
            >
              {settings.saveAsDefault ? 'Will save as default' : 'Save these as my defaults'}
            </button>
          </div>
        </div>
      </PageSection>
    </div>
  );
}
